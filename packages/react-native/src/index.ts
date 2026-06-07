/**
 * @pulse/react-native — React Native wrapper for pulse-player.
 *
 * Status: interface-only (v3.0.0-alpha.8). The runtime renderer is
 * deferred to a v3.X.0 dedicated sprint because it requires the
 * CocoaPods / Gradle / `react-native-audio-api` native pipeline that
 * the npm-only monorepo session cannot bootstrap. See
 * `docs/universal/BLOCKERS.md` #1 for details.
 *
 * This file exposes:
 *
 *   - **Types** (`PulsePlayerRNProps`, `PulseFabRNProps`,
 *     `UsePulseAudioRNReturn`, `RN_PARITY_MATRIX`) — usable today by
 *     RN consumers prototyping against the planned API, and by the
 *     eventual renderer as a build-time contract.
 *
 *   - **Re-exports from `@pulse/types`** — every shared shape
 *     (`Track`, `PulseVariant`, `EventMap`, `PulseState`).
 *
 *   - **Sentinel runtime exports** (`PulsePlayerRN`, `PulseFabRN`,
 *     `usePulseAudioRN`) that throw a clear error message if a
 *     consumer tries to use them before the renderer lands. This is
 *     better than `export {}` because it surfaces the gap with a
 *     copy-paste path forward instead of an opaque "named export
 *     not found" error.
 */
export type {
  PulsePlayerRNProps,
  PulseFabRNProps,
  UsePulseAudioRNReturn,
} from './types'

export { RN_PARITY_MATRIX } from './types'

export type {
  AudioEvent,
  ErrorReason,
  EventListener,
  EventMap,
  PulseState,
  PulseVariant,
  Track,
  Unsubscribe,
} from '@pulse/types'

export { ALL_VARIANTS } from '@pulse/types'

const NOT_IMPLEMENTED_MSG = `[@pulse/react-native] The runtime renderer is not implemented yet.
This package currently ships INTERFACE TYPES only (so RN consumers
can write against the planned API today and the eventual renderer
is type-driven from day one).

The real implementation requires CocoaPods / Gradle / the native
pipeline of react-native-audio-api — see docs/universal/BLOCKERS.md
in the monorepo root for the deferral rationale and the path forward.

For the WEB (any framework: React, Vue, Svelte, Angular, vanilla
HTML), use one of:
  - @pulse/react        — React 18 / 19
  - @pulse/vue          — Vue 3 (currently pulse-player v2.3.4)
  - @pulse/svelte       — Svelte 5
  - @pulse/angular      — Angular 17+
  - @pulse/web-component — Lit Custom Elements, works in any framework`

import type { PulsePlayerRNProps, PulseFabRNProps } from './types'

export const PulsePlayerRN = (_props: PulsePlayerRNProps): never => {
  throw new Error(NOT_IMPLEMENTED_MSG)
}

export const PulseFabRN = (_props: PulseFabRNProps): never => {
  throw new Error(NOT_IMPLEMENTED_MSG)
}

export const usePulseAudioRN = (): never => {
  throw new Error(NOT_IMPLEMENTED_MSG)
}
