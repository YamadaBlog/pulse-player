/**
 * @pulse-music/core — framework-agnostic audio engine.
 *
 * Public surface:
 *   - `PulseEngine` class — owns the singleton audio graph + state
 *     machine. Every framework wrapper (`@pulse-music/vue`, `@pulse-music/react`,
 *     etc.) creates one engine instance and projects its state into
 *     the framework's reactivity primitive via `onStateChange()`.
 *   - Re-exports `@pulse-music/types` so framework wrappers can pull
 *     everything from a single import.
 *
 * Status: v3.0.0-alpha.1 — first real release. Audio engine extracted
 * from the validated Vue v2.3.4 `useAudioStore.ts`, stripped of Pinia /
 * Vue refs. Behaviour bit-for-bit identical with the Vue v2.3.4
 * reference; the consumer model changes from "reactive store" to
 * "imperative class + observer callbacks".
 */
export { PulseEngine } from './PulseEngine'

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
