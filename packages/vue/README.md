# @pulse/vue

Vue 3 wrapper for pulse-player. **Soft re-export package** — re-exports the validated v2.3.4 implementation from `src/lib/` at the monorepo root.

## Status

✅ **v3.0.0-alpha.9 — soft migration shipped.**

`@pulse/vue` now exposes the same surface as the historical `pulse-player` package:

```ts
import {
  MusicPlayer,
  MiniPlayer,
  useAudioStore,
  setAudioTracks,
  ALL_VARIANTS,
  type Track,
  type PulseVariant,
  type MusicPlayerVariant,
  type MiniPlayerVariant,
} from '@pulse/vue'
```

The package re-exports from `src/lib/index.ts` at the repo root, so behaviour is **bit-for-bit identical** to `pulse-player@2.3.4`. The physical move into `packages/vue/src/*.vue` is gated by the Playwright baselines (see `docs/universal/BLOCKERS.md` #3-#4) and lands in v3.0.0-alpha.10 or later.

## Usage

Today:

```ts
// Install (once v3.0.0 stable ships): npm install @pulse/vue
import { MusicPlayer, MiniPlayer } from '@pulse/vue'
```

```vue
<template>
  <MusicPlayer variant="midnight" />
  <MiniPlayer />
</template>
```

The `MusicPlayer` component is the inline card; `MiniPlayer` is the floating FAB. Both share the same Pinia store (`useAudioStore`) so toggling one toggles both.

## Difference vs other framework wrappers

| Aspect | `@pulse/vue` (v2.3.4 ref) | `@pulse/react` / `svelte` / `angular` |
| --- | --- | --- |
| Chrome parity | **100 %** | ~85 % (chrome being completed) |
| Backed by | Vue Pinia store + Vue SFCs | `@pulse/web-component` Lit Custom Elements |
| Guided demo tour | Yes (`src/composables/useDemoTour.ts`) | No (library doesn't expose) |
| FAB radial menu + fullscreen | Yes | Yes (Web Component native, alpha.8) |
| Drag-to-resize | Yes | Yes (alpha.7) |

If you want the **full premium chrome today**, use `@pulse/vue`. If you're building in another framework, use the corresponding wrapper.

## License

MIT.
