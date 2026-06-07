/**
 * @pulse-music/vue — Vue 3 wrapper for pulse-player.
 *
 * v3.0.0-alpha.9: **soft re-export package**. The validated Vue
 * v2.3.4 implementation still lives at the repo root under
 * `src/lib/` — moving it physically is gated by the alpha.9 Playwright
 * baselines (see `docs/universal/BLOCKERS.md` #3 and #4). Until then,
 * this package re-exports everything from the canonical location, so
 * downstream consumers can already write:
 *
 *   import { MusicPlayer, MiniPlayer, useAudioStore } from '@pulse-music/vue'
 *
 * The relative path traverses the package boundary
 * (`../../../src/lib/`), which works in the monorepo development
 * setup because every consumer (the demo + vitest + tsup) resolves
 * via the same tsconfig path mapping. For npm publication, the
 * package's `files` field would be expanded to include the relevant
 * `.vue` SFC files at their published location.
 *
 * Once the alpha.10+ physical migration lands, this file becomes a
 * normal `export * from './MusicPlayer'` style barrel.
 */
export {
  MiniPlayer,
  MusicPlayer,
  useAudioStore,
  setAudioTracks,
  type Track,
  type PulseVariant,
  type MusicPlayerVariant,
  type MiniPlayerVariant,
  ALL_VARIANTS,
} from '../../../src/lib/index'

export type {
  AudioEvent,
  ErrorReason,
  EventListener,
  EventMap,
  PulseState,
  Unsubscribe,
} from '@pulse-music/types'
