/**
 * pulse-player — public API
 *
 * Drop-in Vue 3 music player components backed by a global Pinia store.
 */
export { default as MiniPlayer } from './MiniPlayer.vue'
export { default as MusicPlayer } from './MusicPlayer.vue'
export { useAudioStore, setAudioTracks, type Track } from './useAudioStore'
export type { MusicPlayerVariant } from './MusicPlayer.vue'
export type { MiniPlayerVariant } from './MiniPlayer.vue'
