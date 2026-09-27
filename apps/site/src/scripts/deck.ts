import { engine, getMedia } from './audio'
import { reducedMotion } from './lifecycle'
import { THIRTY_SECOND } from './tempo'

/**
 * The turntable has inertia. Dropping the needle spins the platter up;
 * lifting it runs the platter down. The audio follows the platter (pitch
 * included, like vinyl), and the record on screen reads `deck.speed` so
 * picture and sound slow down together.
 *
 * Only the needle (the hero's turntable) behaves this way: the players'
 * own buttons stay instant, like the digital controls they are.
 */
export const deck = { speed: 1, braking: false, cueing: false }

let raf = 0
let cue = 0
const MIN_RATE = 0.12 // browsers reject rates much lower than this
const SPIN_UP = THIRTY_SECOND * 5 * 1000 // ≈ 0.54 s, on the page's grid
const RUN_DOWN = THIRTY_SECOND * 6 * 1000 // a dotted eighth, ≈ 0.64 s

function rampTo(target: number, ms: number, ease: (u: number) => number, done?: () => void): void {
  cancelAnimationFrame(raf)
  const media = getMedia()
  const from = deck.speed
  const t0 = performance.now()
  const step = (now: number): void => {
    const u = Math.min(1, (now - t0) / ms)
    deck.speed = from + (target - from) * ease(u)
    if (media) media.playbackRate = Math.max(MIN_RATE, deck.speed)
    if (u < 1) raf = requestAnimationFrame(step)
    else done?.()
  }
  raf = requestAnimationFrame(step)
}

function setPitchLock(locked: boolean): void {
  const media = getMedia() as (HTMLAudioElement & { webkitPreservesPitch?: boolean }) | null
  if (!media) return
  media.preservesPitch = locked
  if ('webkitPreservesPitch' in media) media.webkitPreservesPitch = locked
}

function reset(): void {
  cancelAnimationFrame(raf)
  deck.speed = 1
  deck.braking = false
  const media = getMedia()
  if (media) media.playbackRate = 1
  setPitchLock(true)
}

const outCubic = (u: number): number => 1 - (1 - u) ** 3
const inQuad = (u: number): number => u * u

/**
 * Needle down. The arm takes `travel` ms to reach the lead-in; the music
 * starts when the stylus touches the groove, then comes up to speed. (A
 * timer under a second keeps the click's permission to play, in WebKit too.)
 */
export function dropNeedle(travel = 0): void {
  reset()
  clearTimeout(cue)
  const start = (): void => {
    deck.cueing = false
    if (engine.state.isPlaying) return // another control started it meanwhile
    if (reducedMotion()) {
      void engine.play()
      return
    }
    setPitchLock(false)
    deck.speed = 0.55
    const media = getMedia()
    if (media) media.playbackRate = deck.speed
    void engine.play()
    rampTo(1, SPIN_UP, outCubic, () => setPitchLock(true))
  }
  if (travel <= 0 || reducedMotion()) return start()
  engine.prepare()
  deck.cueing = true
  cue = window.setTimeout(start, Math.min(travel, 900))
}

/** A second press while the arm is still travelling: no music after all. */
export function cancelCue(): void {
  clearTimeout(cue)
  deck.cueing = false
}

/** Needle up: the platter runs down, then the music stops. */
export function liftNeedle(): void {
  if (reducedMotion() || !engine.state.isPlaying || !getMedia()) {
    reset()
    engine.pause()
    return
  }
  deck.braking = true
  setPitchLock(false)
  rampTo(MIN_RATE, RUN_DOWN, inQuad, () => {
    engine.pause()
    reset()
  })
}

// Any other pause (a player's button, the FAB, media keys) cancels a ramp.
engine.onStateChange((s) => {
  if (!s.isPlaying && !deck.braking && deck.speed !== 1) reset()
})
