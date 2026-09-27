import { gsap } from 'gsap'
import { engine } from './audio'
import { cancelCue, deck, dropNeedle, liftNeedle } from './deck'
import { reducedMotion } from './lifecycle'
import { stage, stageLive, stylus } from './stage/stage'
import { BEAT, EASE, EIGHTH, SIXTEENTH } from './tempo'

/**
 * The hero's turntable gesture. The tonearm follows the real playback
 * state (whoever started it: the needle button, a tap on the record, a
 * player's button, the keyboard, media keys):
 *   down — the arm swings over the lead-in (a sixteenth), lowers, lands,
 *          and the landing sends one ring out from the stylus through the
 *          groove;
 *   up   — the arm rises and returns to its rest while the platter runs down.
 * While playing, the arm tracks the progress through the side.
 *
 * With the stage live the arm is the scene's (it really rises and lowers);
 * without WebGL2 it is the flat SVG arm, which only swings.
 */
const REST = -24
const SWING = SIXTEENTH * 1.5 // rest to lead-in
const groove = (): number => 2 + (engine.progress / 100) * 18

interface Arm {
  target: object
  prop: string
  ring: () => void
  thud: () => void
}

export function setupNeedle(root: HTMLElement): () => void {
  const record = root.querySelector<HTMLElement>('[data-record]')
  if (!record) return () => undefined
  const scene = stageLive()
  const arm = scene ? sceneArm() : flatArm(root, record)
  if (!arm) return () => undefined

  let down = engine.state.isPlaying
  // The needle's own moves; progress tracking waits for them. (gsap.isTweening
  // ignores a tween until its first render, so it can't be trusted here.)
  let moving: gsap.core.Timeline | null = null
  gsap.set(arm.target, { [arm.prop]: down ? groove() : REST })
  if (scene) stage.arm.lift = down ? 0 : 1

  const lower = (): void => {
    if (down) return
    down = true
    gsap.killTweensOf([arm.target, stage.arm])
    if (reducedMotion()) {
      gsap.set(arm.target, { [arm.prop]: groove() })
      if (scene) stage.arm.lift = 0
      return
    }
    // Over the lead-in, then down onto the groove: one gesture, a sixteenth
    // and a half. The stylus touches at its end — the ring, the music.
    const tl = gsap.timeline({
      onComplete: () => {
        moving = null
        arm.ring()
        arm.thud()
      },
    })
    tl.to(arm.target, { [arm.prop]: groove(), duration: SWING, ease: EASE.inOut }, 0)
    if (scene) {
      stage.arm.lift = 1
      tl.to(stage.arm, { lift: 0, duration: SWING * 0.45, ease: EASE.in }, SWING * 0.55)
    }
    moving = tl
  }
  const raise = (): void => {
    if (!down) return
    down = false
    gsap.killTweensOf([arm.target, stage.arm])
    if (reducedMotion()) {
      gsap.set(arm.target, { [arm.prop]: REST })
      if (scene) stage.arm.lift = 1
      return
    }
    const tl = gsap.timeline({ onComplete: () => void (moving = null) })
    if (scene) tl.to(stage.arm, { lift: 1, duration: SIXTEENTH * 0.5, ease: EASE.out }, 0)
    tl.to(
      arm.target,
      { [arm.prop]: REST, duration: EIGHTH, ease: EASE.inOut },
      scene ? SIXTEENTH * 0.25 : 0,
    )
    moving = tl
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
      gsap.to(arm.target, { [arm.prop]: groove(), duration: 0.6, ease: 'none', overwrite: 'auto' })
    }
  })

  const onToggle = (): void => toggle()
  root.addEventListener('needle:toggle', onToggle)
  return () => {
    off()
    cancelCue()
    root.removeEventListener('needle:toggle', onToggle)
    gsap.killTweensOf([arm.target, stage.arm, stage.ring, stage])
  }
}

/** The scene's arm: swing and lift are the stage's; the ring runs on the vinyl. */
function sceneArm(): Arm {
  return {
    target: stage.arm,
    prop: 'swing',
    ring: () => {
      const p = stylus()
      stage.ring.x = p[0]
      stage.ring.z = p[2]
      gsap.fromTo(stage.ring, { r: 0.02, a: 0.9 }, { r: 2.1, a: 0, duration: BEAT, ease: EASE.out })
    },
    // The stylus meets the vinyl: the record gives a little, then settles.
    thud: () => {
      gsap.fromTo(stage, { lift: 0.085 }, { lift: 0.1, duration: EIGHTH, ease: EASE.pop })
    },
  }
}

/** The flat arm (no WebGL2): the SVG swings, the SVG ring spreads. */
function flatArm(root: HTMLElement, record: HTMLElement): Arm | null {
  const swing = root.querySelector<SVGGElement>('.arm__swing')
  const head = root.querySelector<SVGElement>('.arm__head')
  const ring = root.querySelector<SVGCircleElement>('.record__ring')
  const disc = record.querySelector<HTMLElement>('.record__fallback')
  if (!swing || !head || !ring) return null
  gsap.set(swing, { svgOrigin: '170 30' })
  return {
    target: swing,
    prop: 'rotation',
    ring: () => {
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
    },
    thud: () => {
      if (disc) gsap.fromTo(disc, { y: 3 }, { y: 0, duration: EIGHTH, ease: EASE.pop })
    },
  }
}
