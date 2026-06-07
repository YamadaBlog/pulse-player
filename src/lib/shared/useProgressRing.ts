import { computed, type ComputedRef, type Ref } from 'vue'

/**
 * Geometry for the circular progress ring that wraps the FAB and the
 * inline FAB chrome.
 *
 * Returns three reactive values:
 *   - `radius`        — circle radius, in px (size minus stroke width)
 *   - `circumference` — total stroke length, used as `stroke-dasharray`
 *   - `offset(progress)` — the `stroke-dashoffset` for a given progress %
 *
 * Used to be duplicated in `MusicPlayer.vue` (`FAB_STROKE = 2.5`,
 * `fabRadius`, `fabCircumference`, `fabRingOffset`) and `MiniPlayer.vue`
 * (`STROKE = 3`, `RADIUS`, `CIRCUMFERENCE`, `ringOffset`). Same maths,
 * slightly different constants. Centralising the geometry kills the
 * drift risk; the stroke width stays per-call so each consumer keeps
 * its own visual signature.
 */
export function useProgressRing(
  size: Ref<number> | ComputedRef<number>,
  strokeWidth: number,
): {
  radius: ComputedRef<number>
  circumference: ComputedRef<number>
  offset: (progressPercent: number | Ref<number> | ComputedRef<number>) => number
} {
  const radius = computed(() => (size.value - strokeWidth) / 2)
  const circumference = computed(() => 2 * Math.PI * radius.value)

  function offset(progressPercent: number | Ref<number> | ComputedRef<number>): number {
    const p = typeof progressPercent === 'number' ? progressPercent : progressPercent.value
    return circumference.value - (p / 100) * circumference.value
  }

  return { radius, circumference, offset }
}
