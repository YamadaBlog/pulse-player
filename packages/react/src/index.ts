/**
 * @pulse-music/react — React 18 / 19 bindings for Pulse.
 *
 * - `<PulsePlayer />` and `<PulseFab />` wrap the Custom Elements with typed props.
 * - `usePulseAudio()` subscribes any component to an audio session.
 */
export { PulsePlayer, type PulsePlayerProps } from './PulsePlayer'
export { PulseFab, type PulseFabProps } from './PulseFab'
export {
  usePulseAudio,
  type UsePulseAudioReturn,
  type UsePulseAudioOptions,
  type PulseAudioControls,
} from './usePulseAudio'

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
export type {
  AudioEvent,
  AudioFrame,
  ErrorReason,
  EventMap,
  PulseState,
  PulseVariant,
  RepeatMode,
  Track,
  Unsubscribe,
} from '@pulse-music/types'
