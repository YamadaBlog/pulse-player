/**
 * @pulse-music/web-component — `<pulse-player>`, `<pulse-fab>` and
 * `<pulse-track>`, framework-agnostic Custom Elements built with Lit.
 *
 * Importing this module registers the three elements (idempotently, so
 * duplicate bundles never throw). Use them from plain HTML or any
 * framework that renders to the DOM.
 */
import { PulseFabElement } from './PulseFab'
import { PulsePlayerElement } from './PulsePlayer'
import { PulseTrackElement } from './PulseTrack'

const define = (name: string, ctor: CustomElementConstructor): void => {
  if (typeof customElements !== 'undefined' && !customElements.get(name))
    customElements.define(name, ctor)
}

define('pulse-player', PulsePlayerElement)
define('pulse-fab', PulseFabElement)
define('pulse-track', PulseTrackElement)

export { PulsePlayerElement, PulseFabElement, PulseTrackElement }
export type { FabPlacement } from './PulseFab'
export { DEFAULT_LABELS, type PulseLabels } from './labels'
export { readTracks } from './PulseTrack'

export {
  PulseEngine,
  getSharedEngine,
  setSharedEngine,
  formatTime,
  type PulseEngineOptions,
} from '@pulse-music/core'
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
