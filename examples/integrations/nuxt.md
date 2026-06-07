# Pulse in Nuxt 3+

Nuxt 3 is Vue under the hood — Pulse's Vue reference (`pulse-player` v2.3.4 or `@pulse/vue` from v3.0.0-rc.0+) integrates with minimal ceremony. The one gotcha is Nuxt's SSR by default — Pulse's audio engine and Custom Elements need the browser, so the rendered chrome lives inside `<ClientOnly>` or in a `.client.vue` component.

## Install

```bash
npm install @pulse/vue @pulse/core
```

(Or `pulse-player` if you want the Vue v2.3.4 reference build during the alpha phase — it's the same code, see the alpha.15 CHANGELOG entry for the soft re-export status.)

## The component

`components/MusicPlayer.client.vue` (the `.client.vue` suffix tells Nuxt to skip SSR for this file):

```vue
<script setup lang="ts">
import { MusicPlayer, MiniPlayer, useAudioStore, type Track } from '@pulse/vue'

const audio = useAudioStore()

const tracks: Track[] = [
  {
    title: 'Ambient Test',
    artist: 'You',
    src: '/audio/ambient-test.webm',
    cover: '/covers/ambient-test.webp',
  },
]

audio.setAudioTracks(tracks)

const onPlay = ({ track, time }: { track: Track; time: number }) => {
  // wire your analytics here
  console.log('play', track.title, time)
}
</script>

<template>
  <div>
    <MusicPlayer variant="midnight" :ambient-eq="true" :resizable="true" @play="onPlay" />
    <MiniPlayer variant="vinyl" :pulso="true" :draggable="true" :show-menu="true" />
  </div>
</template>
```

## Use it from a page

`pages/index.vue`:

```vue
<template>
  <main>
    <h1>My Nuxt site</h1>
    <MusicPlayer />
  </main>
</template>
```

Nuxt's auto-imports pick up `components/MusicPlayer.client.vue` automatically. No import statement needed in the page.

## Persistent FAB across routes

Mount the FAB once at the root layout so playback survives navigation:

`layouts/default.vue`:

```vue
<script setup lang="ts">
import { MiniPlayer } from '@pulse/vue'
</script>

<template>
  <div>
    <slot />
    <ClientOnly>
      <MiniPlayer variant="vinyl" :pulso="true" :draggable="true" />
    </ClientOnly>
  </div>
</template>
```

The `<ClientOnly>` wrapper is the explicit SSR-skip — equivalent to the `.client.vue` suffix but inline.

## CSS

If you use the library bundle (`pulse-player` not `@pulse/vue`), import the stylesheet once at the app root:

`app.vue`:

```vue
<script setup lang="ts">
import 'pulse-player/style.css'
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

`@pulse/vue` (the v3.0.0+ scope) ships its CSS as a side-effect of importing the components — no separate `style.css` import needed.

## Tested against

- Nuxt 3.10+
- Node 20 + 22
- Vue 3.4+

## What this snippet doesn't cover

- Module wrapper (`modules/pulse.ts`) if you want Pulse auto-registered via Nuxt's module system — for now the auto-imports + `.client.vue` pattern is enough.
- `useState()` from Nuxt for cross-route state — Pulse's audio engine is already a singleton, so playback state survives routes without `useState` ceremony.
- Server routes for analytics — same as Next.js, capture `onPlay` on the client and POST to `/api/analytics`.

For the canonical Vue API, see [`docs/API.md`](../../docs/API.md).
