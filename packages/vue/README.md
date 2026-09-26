# @pulse-music/vue

Vue 3 bindings for [Pulse](https://github.com/YamadaBlog/pulse-player): typed `<PulsePlayer>` / `<PulseFab>` components and a `usePulseAudio()` composable. No plugin, no store.

```bash
npm i @pulse-music/vue
```

```vue
<script setup lang="ts">
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse-music/vue'

const tracks = [
  { title: 'Protofunk', artist: 'Kevin MacLeod', src: '/protofunk.mp3', cover: '/protofunk.jpg' },
]
const { isPlaying, track, toggle } = usePulseAudio()
</script>

<template>
  <PulsePlayer
    :tracks="tracks"
    variant="midnight"
    ambient-eq
    @trackchange="(e) => console.log(e.track)"
  />
  <button @click="toggle">{{ isPlaying ? 'Pause' : 'Play' }} {{ track?.title }}</button>
  <PulseFab pulso />
</template>
```

**Docs:** [Vue guide](https://github.com/YamadaBlog/pulse-player/blob/main/docs/frameworks.md#vue) · [element reference](https://github.com/YamadaBlog/pulse-player/blob/main/docs/reference/elements.md)

MIT © YamadaBlog
