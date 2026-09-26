# @pulse-music/types

Shared TypeScript types for every [Pulse](https://github.com/YamadaBlog/pulse-player) package: `Track`, `PulseState`, `PulseVariant`, `EventMap`, `AudioFrame`, `RepeatMode`, plus the `ALL_VARIANTS` list.

```bash
npm i -D @pulse-music/types
```

```ts
import type { Track } from '@pulse-music/types'

const playlist: Track[] = [{ title: 'Protofunk', artist: 'Kevin MacLeod', src: '/protofunk.mp3' }]
```

Every other package re-exports these types, so you rarely need to install this one directly.

MIT © YamadaBlog
