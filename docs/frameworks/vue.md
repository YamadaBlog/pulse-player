# Pulse for Vue 3 (`@pulse-music/vue`)

The Vue 3 wrapper. Reference implementation — the visual + behavioural source of truth that every other framework wrapper is benchmarked against.

> ✅ **Honest status:** Vue is the **only fully-featured** version of Pulse today. The validated `v2.3.4` codebase ships 100 % of the premium chrome (ambient EQ, pulso, drag-to-resize, three responsive states, social icons, prev / next, FAB drag, palette / menu, fullscreen). React / Svelte / Web Components currently expose ~15 % of that chrome. **If you need the full Pulse experience today, use the Vue version.**

## Current status

The validated v2.3.4 codebase lives at the repo root under `src/lib/`. The migration into `packages/vue/` (with a refactor that turns the Vue layer into a thin wrapper over `@pulse-music/web-component`) is **deferred until the web-component chrome reaches feature parity** (currently planned for v3.0.0-alpha.7). Until then, the import path is unchanged:

```ts
// Pre-migration (today, v2.x)
import { MusicPlayer, MiniPlayer, useAudioStore } from 'pulse-player'

// Post-migration (v3.0.0+)
import { MusicPlayer, MiniPlayer, useAudioStore } from '@pulse-music/vue'
```

The consumer-facing API stays pixel-perfect identical. Visual regression tests in CI enforce that.

## See also

- [API reference (current)](../API.md)
- [Architecture (post-v3)](../universal/ARCHITECTURE.md)
- [Roadmap](../universal/ROADMAP.md)
