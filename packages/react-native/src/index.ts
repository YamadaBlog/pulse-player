/**
 * @pulse-music/react-native — React Native wrapper for pulse-player.
 *
 * v3.0.0-rc.1 — first iteration of the real renderer. Audio via expo-av,
 * animation via react-native-reanimated, theming via the variant table
 * mirrored from @pulse-music/tokens.
 *
 * Public API:
 *
 *   - **Components** — `<PulsePlayerRN />` (inline card) and
 *     `<PulseFabRN />` (floating action button) drop into any Expo /
 *     bare React Native app.
 *
 *   - **Hook** — `usePulseAudioRN()` returns the same shape as the web
 *     `usePulseAudio` so framework-portable apps work over the React
 *     tree (web vs RN).
 *
 *   - **Engine** — `PulseEngineRN`, `getSharedEngineRN`,
 *     `setSharedEngineRN` for advanced use cases that need direct
 *     engine control.
 *
 *   - **Types + parity matrix** — re-exported from `./types`.
 *
 * Known limitations in rc.1 (documented in
 * `docs/universal/REACT_NATIVE_RUNTIME_SETUP.md`):
 *
 *   - FFT visualisation uses a pseudo-bar synth, not real audio FFT.
 *     `react-native-audio-api` integration ships in a subsequent patch
 *     once Swansion's iOS implementation reaches GA.
 *   - Backdrop blur not yet ported (uses solid background colour).
 *   - FAB drag-to-reposition deferred — basic FAB renders + plays
 *     but does not yet pan. Pulso heartbeat ring works.
 *   - Drag-to-resize is intentionally absent (no DOM resize concept
 *     on mobile native).
 *   - Fullscreen API is intentionally absent.
 */

// Real renderer
export { PulsePlayerRN } from './components/PulsePlayer'
export { PulseFabRN } from './components/PulseFab'

// Engine surface
export {
  PulseEngineRN,
  getSharedEngineRN,
  setSharedEngineRN,
} from './utils/audioEngine'

// Hook
export { usePulseAudioRN } from './hooks/usePulseAudio'

// Interface types
export type {
  PulsePlayerRNProps,
  PulseFabRNProps,
  UsePulseAudioRNReturn,
} from './types'

export { RN_PARITY_MATRIX } from './types'

// Re-exports from @pulse-music/types
export type {
  AudioEvent,
  ErrorReason,
  EventListener,
  EventMap,
  PulseState,
  PulseVariant,
  Track,
  Unsubscribe,
} from '@pulse-music/types'

export { ALL_VARIANTS } from '@pulse-music/types'
