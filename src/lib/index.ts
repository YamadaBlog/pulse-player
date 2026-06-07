/**
 * pulse-player — public API
 *
 * Drop-in Vue 3 music player components backed by a global Pinia store.
 *
 * Anything NOT exported from this file is internal. The guided demo tour
 * (`useDemoTour`) used to live here but has been retired from the public
 * surface in v2.0.0 — it was a demo-page helper, not a library
 * primitive, and tying releases to its API was making the surface area
 * grow without reason. The composable is still available inside the
 * repo under `src/composables/useDemoTour.ts` for the bundled demo.
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
