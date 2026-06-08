/**
 * @pulse-music/react-native — public API types (interface-only).
 *
 * The real React Native renderer requires CocoaPods / Gradle / the
 * native module pipeline of `react-native-audio-api` — out of scope
 * for the npm monorepo session that built the rest of @pulse-music/*. See
 * `docs/universal/BLOCKERS.md` #1 for the deferral rationale and the
 * path forward (v3.X.0 dedicated sprint).
 *
 * This file ships the INTERFACE types so RN consumers can write
 * against the API surface today, and so the eventual implementation
 * is type-driven from day one. The runtime export at
 * `packages/react-native/src/index.ts` re-exports these types and
 * throws a clear error if a consumer tries to construct
 * `PulsePlayerRN` before the renderer lands.
 */
import type {
  PulseVariant,
  Track,
  EventMap,
  PulseState,
  Unsubscribe,
} from '@pulse-music/types'

/** Props for the `<PulsePlayerRN />` React Native component. */
export interface PulsePlayerRNProps {
  variant?: PulseVariant
  /** Accent color (CSS-style hex / rgb / hsl string). Applied via
   *  StyleSheet equivalents — no CSS custom properties on RN. */
  accentColor?: string
  /** Override the playlist. */
  tracks?: Track[]
  /** Ambient EQ visualisation (Reanimated equivalent of the
   *  web `<pulse-player ambient-eq>` CSS animation). */
  ambientEq?: boolean
  /** Pulso heartbeat ring (Reanimated equivalent). */
  pulso?: boolean
  onPlay?: (payload: EventMap['play']) => void
  onPause?: (payload: EventMap['pause']) => void
  onTrackChange?: (payload: EventMap['trackchange']) => void
  onError?: (payload: EventMap['error']) => void
  /** RN style prop. Replaces the web `className` / `style`. */
  style?: object
}

/** Props for the `<PulseFabRN />` React Native component. */
export interface PulseFabRNProps {
  variant?: PulseVariant
  pulso?: boolean
  /** Drag-to-reposition via `react-native-gesture-handler`. */
  draggable?: boolean
  /** `AsyncStorage` key for the persisted position (replaces
   *  `localStorage` on the web). */
  persistKey?: string
  /** Show the menu (palette + Pulso/Fullscreen toggles). */
  showMenu?: boolean
  onPlay?: (payload: EventMap['play']) => void
  onPause?: (payload: EventMap['pause']) => void
  onTrackChange?: (payload: EventMap['trackchange']) => void
  onError?: (payload: EventMap['error']) => void
  style?: object
}

/** Return type of the `usePulseAudioRN()` hook (mirrors the web React hook). */
export interface UsePulseAudioRNReturn extends PulseState {
  track: Track
  progress: number
  toggle: () => void
  next: () => void
  prev: () => void
  seek: (fraction: number) => void
  setAudioTracks: (tracks: Track[]) => void
  setAmbientEq: (on: boolean) => void
  subscribe: <E extends keyof EventMap>(
    event: E,
    cb: (payload: EventMap[E]) => void,
  ) => Unsubscribe
  fmt: (seconds: number) => string
}

/**
 * Feature parity matrix (binding contract between web and RN).
 *
 * Each entry marks whether the feature SHOULD be available on RN
 * (✅ port directly), MUST be substituted (⚠️ alternative API),
 * or CANNOT be provided (❌ documented gap).
 *
 * The eventual implementation reads this constant and the type
 * checks below as the spec.
 */
/**
 * State as of v3.0.0-rc.1 (first real renderer shipped):
 *   ✅ = shipped in rc.1
 *   ⚠️ = shipped with caveat (substitute or pseudo implementation)
 *   ⏳ = planned for a subsequent rc patch
 *   ❌ = intentionally absent (platform constraint or web-only concept)
 */
export const RN_PARITY_MATRIX = {
  audioPlayback: '✅', // expo-av Audio.Sound
  fftVisualisation: '⚠️', // pseudo-bar synth; real FFT via react-native-audio-api in next patch
  themes: '✅', // variant table mirrored from @pulse-music/tokens
  ambientEq: '✅', // Reanimated withRepeat off-thread
  pulsoHeartbeat: '✅', // Reanimated withSequence + withDelay
  fabBasic: '✅', // tap-to-toggle + pulso ring shipped in rc.1
  fabDrag: '⏳', // PanGestureHandler integration in next patch
  prefersReducedMotion: '⏳', // AccessibilityInfo wiring next patch
  backdropFilter: '⏳', // expo-blur next patch
  dragToResize: '❌', // No DOM resize concept on mobile native
  teleportFab: '❌', // Use absolute positioning at nav root
  guidedDemoTour: '❌', // App.vue consumer concern, not library API
} as const
