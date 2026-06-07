/**
 * @pulse/svelte — Svelte 5 wrapper for pulse-player.
 *
 * Svelte's DOM-first philosophy means `<pulse-player>` and
 * `<pulse-fab>` Custom Elements work **directly** in any Svelte
 * template — no Svelte components needed, no wrapping. This package
 * exists to ship:
 *
 *   - `usePulseAudio()` — a Svelte 5 runes wrapper around the shared
 *     PulseEngine, returning a `$state`-backed reactive snapshot +
 *     the action surface. Equivalent to Vue's `useAudioStore` and
 *     React's `usePulseAudio()`.
 *   - Re-exports of the engine, the singleton helpers, and every
 *     `@pulse/types` shape, so consumers pull everything from one
 *     import.
 *
 * Example:
 *
 * ```svelte
 * <script lang="ts">
 *   import { usePulseAudio } from '@pulse/svelte'
 *   const audio = usePulseAudio()
 * </script>
 *
 * <!-- Custom Elements work natively in Svelte. No <PulsePlayer /> needed. -->
 * <pulse-player variant="midnight" onpulse-play={(e) => console.log(e.detail.track.title)}></pulse-player>
 * <pulse-fab pulso></pulse-fab>
 *
 * <p>Tracks played this session: {audio.state.playCount}</p>
 * ```
 *
 * Status: v3.0.0-alpha.3 — first real release. Runes-based hook +
 * type re-exports. No bespoke `<PulsePlayer />` / `<PulseFab />`
 * Svelte components in this alpha — they'd be a single-line wrapper
 * around the Custom Elements without adding meaningful DX, and
 * shipping a real `.svelte` file requires a Svelte build step that
 * complicates the monorepo's npm-workspaces tooling. We can revisit
 * if consumer feedback asks for `<PulsePlayer />` / `<PulseFab />`.
 */

// Side-effect import registers <pulse-player> + <pulse-fab>.
import '@pulse/web-component'

export { usePulseAudio, type UsePulseAudioStore } from './usePulseAudio'

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
