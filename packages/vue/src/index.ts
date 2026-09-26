/**
 * @pulse-music/vue — Vue 3 bindings for Pulse.
 *
 * - `<PulsePlayer>` / `<PulseFab>` wrap the Custom Elements with typed props and emits.
 * - `usePulseAudio()` exposes an audio session as reactive refs.
 */
export { PulsePlayer, PulseFab } from './components'
export { usePulseAudio, type UsePulseAudioReturn } from './usePulseAudio'
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
