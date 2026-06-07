# @pulse/vue

Vue 3 wrapper for pulse-player. **Reference implementation** — the visual and behavioural source of truth for every other framework wrapper.

## Status

⏳ **Pre-migration scaffold.** The actual Vue code currently lives at the repo root under `src/lib/` (validated v2.3.4). It moves into this package in **v3.0.0-alpha.1** along with the refactor that converts it from owning the audio engine to wrapping `@pulse/core` + `@pulse/web-component`.

Until the migration completes, consumers should keep using:

```ts
// Current usage (v2.x — works today)
import { MusicPlayer, MiniPlayer, useAudioStore } from 'pulse-player'
```

After v3.0.0:

```ts
// Same API, new package name
import { MusicPlayer, MiniPlayer, useAudioStore } from '@pulse/vue'
```

The validated pixel-perfect behaviour from v2.3.4 is preserved bit-for-bit; only the import path changes.

## License

MIT.
