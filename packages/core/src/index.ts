/**
 * @pulse-music/core — the framework-agnostic audio engine behind every
 * Pulse player. Pure TypeScript, SSR-safe, zero dependencies besides the
 * shared types.
 */
export { PulseEngine, type PulseEngineOptions } from './PulseEngine'
export { getSharedEngine, setSharedEngine } from './shared'
export { formatTime, clamp } from './format'

export type {
  AudioEvent,
  AudioFrame,
  ErrorReason,
  EventListener,
  EventMap,
  PulseState,
  PulseVariant,
  RepeatMode,
  Track,
  Unsubscribe,
} from '@pulse-music/types'
export { ALL_VARIANTS } from '@pulse-music/types'
