const pad = (n: number): string => String(n).padStart(2, '0')

/**
 * Format a number of seconds as `m:ss` (or `h:mm:ss` past one hour).
 * Non-finite or negative input — unknown or live durations — yields `0:00`.
 */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/** Clamp `value` into `[min, max]`; `NaN` collapses to `min`. */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}
