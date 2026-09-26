/**
 * @pulse-music/types — the shared data contract of every Pulse package.
 *
 * Pure types (plus one runtime constant, `ALL_VARIANTS`). No DOM, no
 * framework imports, so it can be consumed by the engine, the Web
 * Components, every framework wrapper and the React Native renderer.
 */

// ─── Tracks ──────────────────────────────────────────────────────────

export interface Track {
  /** Display title. */
  title: string
  /** Audio source URL — any format the platform's audio element accepts. */
  src: string
  /** Artist / author line shown under the title and in the OS media controls. */
  artist?: string
  /** Album name, forwarded to the OS media controls (Media Session). */
  album?: string
  /** Cover image URL. Without one, the player renders a generated gradient. */
  cover?: string
  /** CSS `object-position` applied to the cover (`'50% 50%'`, `'20% center'`…). */
  coverPos?: string
  /** Optional zoom applied to the cover (`1.25` crops in slightly). */
  coverScale?: number
}

// ─── Themes ──────────────────────────────────────────────────────────

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

/** Every variant, in display order — handy for pickers and docs. */
export const ALL_VARIANTS: readonly PulseVariant[] = Object.freeze([
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
])

// ─── Engine state ────────────────────────────────────────────────────

/** How the playlist behaves when a track ends. */
export type RepeatMode = 'none' | 'all' | 'one'

/**
 * Why playback failed.
 * - `play-rejected` — the browser refused `play()` (autoplay policy, no user gesture…).
 * - `media-error`   — the source could not be loaded or decoded (404, CORS, codec…).
 */
export type ErrorReason = 'play-rejected' | 'media-error'

/**
 * Immutable snapshot of the engine. A new object is produced on every
 * change, so reference equality is a valid change check
 * (`useSyncExternalStore`, `shallowRef`, Svelte stores…).
 */
export interface PulseState {
  /** Index of the active track in the playlist. */
  currentTrack: number
  /** `true` while audio is (or is about to be) playing. */
  isPlaying: boolean
  /** `true` while the player waits for data (initial load, buffering, seeking). */
  isLoading: boolean
  /** Playback position in seconds. */
  currentTime: number
  /** Track length in seconds (`0` until metadata is known, `Infinity` for live streams). */
  duration: number
  /** Buffered-ahead fraction of the current track, `0..1`. */
  buffered: number
  /** Output volume, `0..1`. */
  volume: number
  muted: boolean
  repeat: RepeatMode
  /** Last playback error; cleared as soon as playback succeeds again. */
  error: ErrorReason | null
  /** Whether the floating player should be on screen (set on first play, cleared by `close()`). */
  isVisible: boolean
  /** Whether playback has been started at least once in this session. */
  hasBeenOpened: boolean
  /** App-wide default for the ambient equaliser backdrop. */
  ambientEq: boolean
  /** Local-only counters — never transmitted anywhere. */
  playCount: number
  pauseCount: number
  trackChangeCount: number
}

// ─── Events ──────────────────────────────────────────────────────────

export interface EventMap {
  play: { track: Track; time: number }
  pause: { track: Track; time: number }
  trackchange: { from: number; to: number; track: Track }
  ended: { track: Track }
  error: { track: Track | null; reason: ErrorReason; detail?: unknown }
}

export type AudioEvent = keyof EventMap
export type EventListener<E extends AudioEvent> = (payload: EventMap[E]) => void

/** Returned by every subscription — call it to detach the listener. */
export type Unsubscribe = () => void

// ─── Visualiser frames ───────────────────────────────────────────────

/**
 * One visualiser frame, delivered at display refresh rate while audio
 * plays. The arrays are reused between frames: read them synchronously,
 * copy them if you need to keep a value.
 */
export interface AudioFrame {
  /** Log-spaced frequency bands, bass → treble, each `0..1`. */
  bands: Float32Array
  /** Overall loudness proxy, `0..1`. */
  energy: number
  /**
   * `true` when the values are synthesised because the real spectrum is
   * unavailable (no Web Audio, or a cross-origin source without CORS).
   */
  synthetic: boolean
}
