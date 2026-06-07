/**
 * @pulse/react — React 18 / 19 wrapper for pulse-player.
 *
 * Exposes:
 *   - `<PulsePlayer />` — inline card (wraps `<pulse-player>` Custom Element)
 *   - `<PulseFab />`    — floating FAB (wraps `<pulse-fab>`)
 *   - `usePulseAudio()` — React hook over `@pulse/core` state (equivalent to Vue's `useAudioStore`)
 *
 * The components are THIN adapters — Lit handles the rendering, this
 * package just maps React conventions (camelCase props, on-handler
 * props, `useEffect` lifecycle) to the underlying Custom Element's
 * attributes and DOM events.
 *
 * Status: v3.0.0-alpha.3 — first real release. Renders the minimum
 * inline-card / FAB chrome that the underlying Lit elements ship.
 * Full v2.3.4 visual parity grows additively as `@pulse/web-component`
 * closes the chrome gap (alpha.2.2).
 */

// Side-effect import registers <pulse-player> + <pulse-fab>.
import '@pulse/web-component'

// JSX type augmentation for `<pulse-player>` / `<pulse-fab>`.
import './jsx-elements'

export { PulsePlayer, type PulsePlayerProps } from './PulsePlayer'
export { PulseFab, type PulseFabProps } from './PulseFab'
export { usePulseAudio, type UsePulseAudioReturn } from './usePulseAudio'

// Re-export engine + types so consumers can pull everything from one import.
export {
  PulseEngine,
  getSharedEngine,
  setSharedEngine,
} from '@pulse/web-component'

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
