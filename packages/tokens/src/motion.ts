/**
 * Motion tokens. The springs are real damped-spring curves sampled into
 * CSS `linear()` easings, so they run on the compositor with no JS.
 */
export const EASING = Object.freeze({
  /** Critically damped — settles without overshoot (≈ 640 ms natural length). */
  smooth:
    'linear(0, 0.049, 0.155, 0.282, 0.408, 0.522, 0.62, 0.703, 0.769, 0.823, 0.865, 0.897, 0.923, 0.942, 0.957, 0.968, 0.976, 0.982, 0.987, 0.99, 0.993, 0.995, 0.996, 0.997, 1)',
  /** Light spring, ~5 % overshoot — layout morphs, panels. */
  gentle:
    'linear(0, 0.03, 0.107, 0.212, 0.33, 0.45, 0.566, 0.671, 0.763, 0.841, 0.904, 0.954, 0.991, 1.017, 1.035, 1.045, 1.049, 1.05, 1.047, 1.043, 1.037, 1.031, 1.025, 1.019, 1.014, 1.01, 1.006, 1.004, 1.001, 1, 0.999, 0.998, 0.998, 0.997, 0.998, 0.998, 1)',
  /** Lively spring, ~12 % overshoot — pops, presses, reveals. */
  pop:
    'linear(0, 0.053, 0.182, 0.35, 0.529, 0.696, 0.84, 0.953, 1.035, 1.087, 1.113, 1.12, 1.113, 1.097, 1.076, 1.055, 1.035, 1.018, 1.005, 0.995, 0.989, 0.986, 0.986, 0.987, 0.989, 0.991, 0.994, 0.996, 1)',
  /** Classic expressive ease-out for fades and colour changes. */
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  /** Symmetric ease for loops. */
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
})

export const DURATION = Object.freeze({
  instant: '90ms',
  fast: '160ms',
  base: '280ms',
  slow: '520ms',
  spring: '640ms',
})

/** Motion tokens as custom properties, scoped to `selector`. */
export function createMotionCss(selector = ':host'): string {
  return `${selector} {
  --pulse-ease-smooth: ${EASING.smooth};
  --pulse-ease-gentle: ${EASING.gentle};
  --pulse-ease-pop: ${EASING.pop};
  --pulse-ease-out: ${EASING.out};
  --pulse-ease-in-out: ${EASING.inOut};
  --pulse-dur-instant: ${DURATION.instant};
  --pulse-dur-fast: ${DURATION.fast};
  --pulse-dur-base: ${DURATION.base};
  --pulse-dur-slow: ${DURATION.slow};
  --pulse-dur-spring: ${DURATION.spring};
}`
}
