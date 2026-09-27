import { gsap } from 'gsap'
import { engine } from './audio'
import { cancelCue, deck, dropNeedle, liftNeedle } from './deck'
import { reducedMotion } from './lifecycle'
import { BEAT, EASE, EIGHTH, SIXTEENTH } from './tempo'

/**
 * The hero's turntable gesture. The tonearm follows the real playback
 * state (whoever started it: the needle button, a tap on the record, a
 * player's button, the keyboard, media keys):
 *   down — the arm swings over the lead-in (a sixteenth), lands, and the
 *          landing sends one ring out from the stylus through the groove;
 *   up   — the arm returns to its rest while the platter runs down.
 * While playing, the arm tracks the progress through the side.
 */
const REST = -24
const SWING = SIXTEENTH * 1.5 // rest to lead-in
const groove = (): number => 2 + (engine.progress / 100) * 18

export function setupNeedle(root: HTMLElement): () => void {
  const swing = root.querySelector<SVGGElement>('.arm__swing')
  const head = root.querySelector<SVGElement>('.arm__head')
  const ring = root.querySelector<SVGCircleElement>('.record__ring')
  const record = root.querySelector<HTMLElement>('[data-record]')
  const disc = record?.querySelector<HTMLElement>('canvas, .record__fallback')
  if (!swing || !head || !ring || !record) return () => undefined

  let down = engine.state.isPlaying
  // The needle's own moves; progress tracking waits for them. (gsap.isTweening
  // ignores a tween until its first render, so it can't be trusted here.)
  let moving: gsap.core.Tween | null = null
  gsap.set(swing, { rotation: down ? groove() : REST, svgOrigin: '170 30' })

  const landing = (): void => {
    // Where the stylus touches, in the record's own box (0..200 viewBox).
    const r = record.getBoundingClientRect()
    const h = head.getBoundingClientRect()
    const cx = ((h.left + h.width / 2 - r.left) / r.width) * 200
    const cy = ((h.top + h.height / 2 - r.top) / r.height) * 200
    gsap.fromTo(
      ring,
      { attr: { cx, cy, r: 2 }, opacity: 0.9, strokeWidth: 1.6 },
      { attr: { r: 190 }, opacity: 0, strokeWidth: 0.3, duration: BEAT, ease: EASE.out },
    )
    if (disc) gsap.fromTo(disc, { y: 3 }, { y: 0, duration: EIGHTH, ease: EASE.pop })
  }

  const lower = (): void => {
    if (down) return
    down = true
    gsap.killTweensOf(swing)
    if (reducedMotion()) {
      gsap.set(swing, { rotation: groove() })
      return
    }
    moving = gsap.to(swing, {
      rotation: groove(),
      duration: SWING,
      ease: EASE.inOut,
      onComplete: () => {
        moving = null
        landing()
      },
    })
  }
  const raise = (): void => {
    if (!down) return
    down = false
    gsap.killTweensOf(swing)
    if (reducedMotion()) gsap.set(swing, { rotation: REST })
    else
      moving = gsap.to(swing, {
        rotation: REST,
        duration: EIGHTH,
        ease: EASE.inOut,
        onComplete: () => (moving = null),
      })
  }

  const toggle = (): void => {
    if (deck.cueing) {
      cancelCue()
      raise()
    } else if (engine.state.isPlaying && !deck.braking) {
      raise()
      liftNeedle()
    } else if (!deck.braking) {
      // The music starts as the stylus lands, with the ring — not at the click.
      lower()
      dropNeedle(reducedMotion() ? 0 : SWING * 1000)
    }
  }

  let lastProgress = -1
  const off = engine.onStateChange((s) => {
    if (s.isPlaying && !deck.braking) lower()
    else if (!s.isPlaying) raise()
    // Follow the side: the arm creeps inwards as the track plays.
    if (down && !moving && Math.abs(engine.progress - lastProgress) > 0.2) {
      lastProgress = engine.progress
      gsap.to(swing, { rotation: groove(), duration: 0.6, ease: 'none', overwrite: 'auto' })
    }
  })

  const onToggle = (): void => toggle()
  root.addEventListener('needle:toggle', onToggle)
  return () => {
    off()
    root.removeEventListener('needle:toggle', onToggle)
    cancelCue()
    gsap.killTweensOf([swing, ring, disc])
  }
}
