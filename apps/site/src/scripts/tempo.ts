import { EASING } from '@pulse-music/tokens'
import { gsap } from 'gsap'
import { CustomEase } from 'gsap/CustomEase'

/**
 * The site keeps time with side A: "Projector Screen" runs at 70.06 BPM.
 * Durations are fractions of its beat, so every section moves on the same
 * grid as the music (and as the reel, which was cut on it).
 */
export const BPM = 70.06
export const BEAT = 60 / BPM // 0.856 s: large reveals, wipes
export const EIGHTH = BEAT / 2 // 0.428 s: morphs, secondary moves
export const SIXTEENTH = BEAT / 4 // 0.214 s: UI responses
export const THIRTY_SECOND = BEAT / 8 // 0.107 s: staggers between lines

gsap.registerPlugin(CustomEase)

// The same curves as the player component (packages/tokens), so the page
// and the players it hosts move alike. Springs are sampled curves, turned
// into polylines GSAP can follow.
const bezier = (css: string): string => css.slice(css.indexOf('(') + 1, -1)
const polyline = (css: string): string => {
  const ys = css
    .slice(css.indexOf('(') + 1, -1)
    .split(',')
    .map(Number)
  return `M0,0 ${ys.map((y, i) => `L${(i / (ys.length - 1)).toFixed(4)},${y}`).join(' ')}`
}
CustomEase.create('pulse.out', bezier(EASING.out))
CustomEase.create('pulse.inOut', bezier(EASING.inOut))
CustomEase.create('pulse.in', '0.64,0,0.78,0')
CustomEase.create('pulse.pop', polyline(EASING.pop))
CustomEase.create('pulse.gentle', polyline(EASING.gentle))

export const EASE = {
  out: 'pulse.out',
  in: 'pulse.in',
  inOut: 'pulse.inOut',
  pop: 'pulse.pop',
  gentle: 'pulse.gentle',
} as const
