/**
 * @pulse-music/angular — Angular 17+ wrapper for pulse-player.
 *
 * Exposes `PulseModule` and re-exports the engine + types so
 * consumers can pull everything from one import.
 *
 * The wrapper is intentionally minimal — Angular's
 * `CUSTOM_ELEMENTS_SCHEMA` lets `<pulse-player>` and `<pulse-fab>`
 * Custom Elements work directly in any template. The module just
 * groups the side-effect element registration with the public
 * re-exports.
 */
export {
  PulseModule,
  PulseEngine,
  getSharedEngine,
  setSharedEngine,
  ALL_VARIANTS,
} from './pulse.module'

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
