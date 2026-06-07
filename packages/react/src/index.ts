/**
 * @pulse-music/react — React 18 / 19 wrapper for pulse-player.
 *
 * Exposes:
 *   - `<PulsePlayer />` — inline card (wraps `<pulse-player>` Custom Element)
 *   - `<PulseFab />`    — floating FAB (wraps `<pulse-fab>`)
 *   - `usePulseAudio()` — React hook over `@pulse-music/core` state (equivalent to Vue's `useAudioStore`)
 *
 * The components are THIN adapters — Lit handles the rendering, this
 * package just maps React conventions (camelCase props, on-handler
 * props, `useEffect` lifecycle) to the underlying Custom Element's
 * attributes and DOM events.
 *
 * Status: v3.0.0-alpha.3 — first real release. Renders the minimum
 * inline-card / FAB chrome that the underlying Lit elements ship.
 * Full v2.3.4 visual parity grows additively as `@pulse-music/web-component`
 * closes the chrome gap (alpha.2.2).
 */

// Side-effect import registers <pulse-player> + <pulse-fab>.
import '@pulse-music/web-component'

// JSX type augmentation for `<pulse-player>` / `<pulse-fab>` is at
// `./jsx-elements.d.ts`. As a `.d.ts` file it is loaded automatically
// by TypeScript via the project's `include` glob — no runtime
// import needed, and adding one would crash any bundler at build
// time (declaration files have no runtime payload).

export { PulsePlayer, type PulsePlayerProps } from './PulsePlayer'
export { PulseFab, type PulseFabProps } from './PulseFab'
export { usePulseAudio, type UsePulseAudioReturn } from './usePulseAudio'
export { useDomEvent } from './useDomEvent'

// Re-export engine + types so consumers can pull everything from one import.
export {
  PulseEngine,
  getSharedEngine,
  setSharedEngine,
} from '@pulse-music/web-component'

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
