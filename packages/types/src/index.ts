/**
 * @pulse/types — shared TypeScript types for every pulse-player
 * framework wrapper.
 *
 * Every other `@pulse/*` package depends on this one. The types are
 * extracted from the validated Vue v2.3.4 implementation. They are
 * pure types — no runtime, no DOM, no framework imports — so they
 * can be consumed by:
 *
 *   - `@pulse/vue` (current reference implementation)
 *   - `@pulse/core` (framework-agnostic audio engine)
 *   - `@pulse/web-component` (Lit-based universal renderer)
 *   - `@pulse/react`, `@pulse/svelte`, `@pulse/angular` (wrappers)
 *   - `@pulse/react-native` (separate native implementation that
 *     shares the data contract but rebuilds the renderer)
 */

// ─── Tracks ─────────────────────────────────────────────────────
export interface Track {
  /** Display title shown in the NOW PLAYING strip. */
  title: string
  /** Audio source URL. Any format the host's `<audio>` element accepts. */
  src: string
  /** Cover image URL. */
  cover: string
  /** CSS `object-position` value applied to the cover (`50% 50%`, `20% center`, ...). */
  coverPos: string
  /** Optional CSS scale applied to the cover (`1.25` zooms in slightly). */
  coverScale?: number
}

// ─── Variants (themes) ──────────────────────────────────────────
export type PulseVariant =
  | 'auto'
  | 'transparent'
  | 'solid'
  | 'dark'
  | 'light'
  | 'sunset'
  | 'midnight'
  | 'aurora'
  | 'vinyl'
  | 'custom'

/** Runtime-enumerable list of every variant — useful for picker UIs. */
export const ALL_VARIANTS: readonly PulseVariant[] = [
  'auto',
  'transparent',
  'solid',
  'dark',
  'light',
  'sunset',
  'midnight',
  'aurora',
  'vinyl',
  'custom',
] as const

// ─── Event bus payloads (discriminated union, mirrors v2.0.0+) ──
export type ErrorReason = 'play-rejected' | 'media-error' | 'stalled'

export type EventMap = {
  play: { track: Track; time: number }
  pause: { track: Track; time: number }
  trackchange: { from: number; to: number; track: Track }
  error: { track: Track; reason: ErrorReason; detail?: unknown }
}

export type AudioEvent = keyof EventMap
export type EventListener<E extends AudioEvent> = (payload: EventMap[E]) => void

// ─── State shape (consumed by every wrapper to project into framework primitives) ──
export interface PulseState {
  currentTrack: number
  isPlaying: boolean
  currentTime: number
  duration: number
  isVisible: boolean
  hasBeenOpened: boolean
  ambientEq: boolean
  /** Local-only counters; not transmitted anywhere. */
  playCount: number
  pauseCount: number
  trackChangeCount: number
}

/** Returned by every `subscribe(event, cb)` — call it to detach the listener. */
export type Unsubscribe = () => void
