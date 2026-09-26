# Nuxt 3 / 4

```bash
npm i @pulse-music/vue
```

Tell Vue that `pulse-*` tags are Custom Elements (needed only if you write the raw tags in templates; the `PulsePlayer` / `PulseFab` components work without it):

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  vue: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('pulse-') } },
})
```

```vue
<!-- components/Player.vue -->
<script setup lang="ts">
import { PulsePlayer, type Track } from '@pulse-music/vue'

const tracks: Track[] = [
  { title: 'Projector Screen', artist: 'HoliznaCC0', src: '/audio/projector-screen.mp3' },
]
</script>

<template>
  <PulsePlayer :tracks="tracks" variant="aurora" />
</template>
```

```vue
<!-- app.vue — the floating player lives at the root and survives navigation -->
<script setup lang="ts">
import { PulseFab } from '@pulse-music/vue'
</script>

<template>
  <NuxtPage />
  <ClientOnly><PulseFab pulso /></ClientOnly>
</template>
```

The packages are SSR-safe; `<ClientOnly>` simply avoids rendering an empty element on the server.
