/**
 * pulse-player — public API
 *
 * Drop-in Vue 3 music player components backed by a global Pinia store.
 */
export { default as MiniPlayer } from './MiniPlayer.vue'
export { default as MusicPlayer } from './MusicPlayer.vue'
export { useAudioStore, setAudioTracks, type Track } from './useAudioStore'

// Shared variant types — `PulseVariant` is the canonical union; the
// two component-specific aliases stay for backward compatibility.
export type { PulseVariant } from './shared/types'
export { ALL_VARIANTS } from './shared/types'
export type { MusicPlayerVariant } from './MusicPlayer.vue'
export type { MiniPlayerVariant } from './MiniPlayer.vue'

// Composable — the guided demo tour controller, useful for integrators
// who want to script their own onboarding using the same primitives.
export {
  useDemoTour,
  type DemoStep,
  type DemoStepContext,
  type EasingName,
  type ScrollToOptions,
} from '../composables/useDemoTour'
