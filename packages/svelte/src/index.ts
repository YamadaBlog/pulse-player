/**
 * @pulse-music/svelte — Svelte bindings for Pulse.
 *
 * Svelte renders Custom Elements natively, so `<pulse-player>` and
 * `<pulse-fab>` are used directly; this package registers them and adds
 * `usePulseAudio()`, a readable store over the audio session.
 */
import '@pulse-music/web-component'

export { usePulseAudio, type PulseAudioStore, type PulseSnapshot } from './usePulseAudio'
export {
  PulseEngine,
  getSharedEngine,
  setSharedEngine,
  formatTime,
  ALL_VARIANTS,
  DEFAULT_LABELS,
  type PulseEngineOptions,
  type PulseLabels,
  type FabPlacement,
} from '@pulse-music/web-component'
export type { EventMap, PulseState, PulseVariant, RepeatMode, Track } from '@pulse-music/types'
