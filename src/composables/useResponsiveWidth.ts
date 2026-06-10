/**
 * useResponsiveWidth — fluid sizing helper for Pulse Player demo.
 *
 * The MusicPlayer component exposes a `width` prop driving its
 * intrinsic `--pulse-scale` chrome. Without a prop set explicitly, the
 * player stays at a baseline ~440 px wide regardless of viewport,
 * which makes it look tiny on 2K (17 %) and microscopic on 4K (6 %).
 *
 * This composable reads `window.innerWidth` (with ResizeObserver +
 * `resize` event), then maps it to a recommended player width using a
 * piecewise-linear curve calibrated so the player feels balanced at
 * every viewport from 320 to 4 K:
 *
 *   ≤ 720    : 0.92 × viewport (mobile / tablet — near full bleed)
 *   720-1280 : ramps from ~660 to ~720 (tablet → laptop)
 *   1280-1920: ramps from 720 to 820 (laptop → 1080p)
 *   1920-2560: ramps from 820 to 1020 (1080p → 2K) ← the brief's pain
 *   2560-3840: ramps from 1020 to 1320 (2K → 4K)
 *
 * The min/max caps keep the chrome harmonious — never absurdly
 * stretched on 8K, never crushed under 320.
 *
 * Returns a reactive `Ref<number>` that the consumer binds to the
 * MusicPlayer `:width` prop or to inline `--pulse-scale`.
 */

import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const PRESET = [
  // [viewportWidth, recommendedPlayerWidth]
  [320, 296],
  [480, 440],
  [720, 660],
  [1024, 700],
  [1280, 720],
  [1440, 780],
  [1600, 820],
  [1920, 860],
  [2240, 960],
  [2560, 1040],
  [3200, 1180],
  [3840, 1320],
] as const

function lerpFromPreset(vw: number): number {
  // Below the first preset, clamp to preset[0].
  if (vw <= PRESET[0][0]) return PRESET[0][1]
  // Above the last, clamp to preset[last].
  const last = PRESET[PRESET.length - 1]
  if (vw >= last[0]) return last[1]
  // Otherwise piecewise-linear interpolation.
  for (let i = 0; i < PRESET.length - 1; i++) {
    const [v0, w0] = PRESET[i]
    const [v1, w1] = PRESET[i + 1]
    if (vw >= v0 && vw <= v1) {
      const t = (vw - v0) / (v1 - v0)
      return Math.round(w0 + (w1 - w0) * t)
    }
  }
  return PRESET[PRESET.length - 1][1]
}

interface UseResponsiveWidthOptions {
  /** Optional multiplier applied to the preset output. Use < 1 for
   *  secondary placements, > 1 for hero-scale moments. Default 1. */
  multiplier?: number
  /** Hard floor — never go below this width in px. Default 240. */
  min?: number
  /** Hard ceiling — never go above. Default 1480. */
  max?: number
  /** Optional cap as a fraction of viewport width (0..1). Default 0.92. */
  fractionOfViewport?: number
}

export function useResponsiveWidth(opts: UseResponsiveWidthOptions = {}): Ref<number> {
  const multiplier = opts.multiplier ?? 1
  const minWidth = opts.min ?? 240
  const maxWidth = opts.max ?? 1480
  const fractionCap = opts.fractionOfViewport ?? 0.92

  const width = ref(700) // SSR-safe default

  const compute = () => {
    if (typeof window === 'undefined') return
    const vw = window.innerWidth
    const target = lerpFromPreset(vw) * multiplier
    const viewportCap = vw * fractionCap
    const next = Math.round(Math.max(minWidth, Math.min(maxWidth, Math.min(target, viewportCap))))
    if (next !== width.value) width.value = next
  }

  const onResize = () => compute()

  onMounted(() => {
    compute()
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', onResize, { passive: true })
    }
  })
  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onResize)
    }
  })

  return width
}
