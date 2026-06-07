# Pulse for Vue 3 (`@pulse/vue`)

The Vue 3 wrapper. Reference implementation — the visual + behavioural source of truth that every other framework wrapper is benchmarked against.

## Current status

The validated v2.3.4 codebase lives at the repo root under `src/lib/`. The migration into `packages/vue/` (with a refactor that turns the Vue layer into a thin wrapper over `@pulse/web-component`) happens in **v3.0.0-alpha.3**. Until then, the import path is unchanged:

```ts
// Pre-migration (today, v2.x)
import { MusicPlayer, MiniPlayer, useAudioStore } from 'pulse-player'

// Post-migration (v3.0.0+)
import { MusicPlayer, MiniPlayer, useAudioStore } from '@pulse/vue'
```

The consumer-facing API stays pixel-perfect identical. Visual regression tests in CI enforce that.

## See also

- [API reference (current)](../API.md)
- [Architecture (post-v3)](../universal/ARCHITECTURE.md)
- [Roadmap](../universal/ROADMAP.md)
