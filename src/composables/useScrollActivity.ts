/**
 * useScrollActivity — round-18 fluidity primitive (demo-only).
 *
 * One passive scroll listener for the whole page ; `isScrolling()`
 * returns true from the first scroll event until 160 ms after the
 * last one. The audio-cosmetic loops (ambient pump, AudioBars canvas,
 * particle field) consult it to FREEZE their work while the page is
 * actually moving :
 *
 *   - while scrolling, the eye tracks layout motion, not a 12 px EQ
 *     shimmer — freezing the cosmetics for the scroll burst is
 *     imperceptible (verified by screenshot pairs) ;
 *   - a frozen canvas/custom-property layer scrolls as a cached
 *     texture : zero raster, zero style recalc — which is exactly
 *     what the paused page already enjoys.
 *
 * Measured motivation : full-page read-pace scrolling was 8 % janky
 * frames with audio paused vs 29 % with audio playing (2560×1440,
 * prod build, headed GPU) — the delta was these per-frame cosmetics
 * stacking on top of scroll work.
 *
 * NOT used by `src/lib/` (byte-identical contract) — demo composables
 * and components only.
 */

let installed = false
let scrolling = false
let settleTimer: ReturnType<typeof setTimeout> | null = null

const SETTLE_MS = 160

function ensureListener(): void {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener(
    'scroll',
    () => {
      scrolling = true
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(() => {
        scrolling = false
      }, SETTLE_MS)
    },
    { passive: true },
  )
}

/** True while the page is being scrolled (settles 160 ms after the last event). */
export function isScrolling(): boolean {
  ensureListener()
  return scrolling
}
