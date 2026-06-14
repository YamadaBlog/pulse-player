# Advanced usage

[← back to README](../README.md)

## Replace the playlist at runtime

```ts
// main.ts — BEFORE the app mounts
import { setAudioTracks } from './lib'

setAudioTracks([
  { title: 'YOUR TRACK', src: '/music/01.mp3', cover: '/img/01.jpg', coverPos: '50% 40%' },
  {
    title: 'ANOTHER ONE',
    src: '/music/02.mp3',
    cover: '/img/02.jpg',
    coverPos: 'center',
    coverScale: 1.1,
  },
])

createApp(App).use(createPinia()).mount('#app')
```

## Build your own controls

The store is the only contract. Anything Vue can read is fair game.

```vue
<script setup lang="ts">
import { useAudioStore } from './lib'
const store = useAudioStore()
</script>

<template>
  <button @click="store.toggle">
    {{ store.isPlaying ? 'Pause' : 'Play' }}
  </button>

  <input
    type="range"
    min="0"
    max="100"
    :value="store.progress"
    @input="(e) => store.seek(+(e.target as HTMLInputElement).value / 100)"
  />

  <span>{{ store.fmt(store.currentTime) }} / {{ store.fmt(store.duration) }}</span>
</template>
```

## React to track changes

Standard Vue reactivity. `watch` on `store.currentTrack` (or any other ref).

```ts
import { watch } from 'vue'
import { useAudioStore } from './lib'

const store = useAudioStore()

watch(
  () => store.currentTrack,
  (i) => {
    console.log('now playing', store.tracks[i].title)
  },
)
```

## Mount several players

All instances share the same store. They stay in sync automatically.

```vue
<template>
  <!-- Page header — large hero player -->
  <MusicPlayer variant="auto" :size="1.6" />

  <!-- Sidebar — compact, no chrome -->
  <aside>
    <MusicPlayer variant="dark" :size="0.75" hide-icons />
  </aside>

  <!-- Persistent global FAB -->
  <MiniPlayer variant="midnight" />
</template>
```

Press play on any of them — all three update in lockstep.

## Hide the FAB on certain routes

`store.close()` pauses and hides. `store.open()` reveals it without playing. `store.isVisible` is reactive — drive it from your router if you want.

```ts
import { useRouter } from 'vue-router'
import { useAudioStore } from './lib'

const router = useRouter()
const store = useAudioStore()

router.afterEach((to) => {
  if (to.meta.hideFab) store.close()
})
```

## Auto-FAB on scroll + show on navigation

Out of the box the FAB appears when playback starts (or `store.open()`)
and stays until `store.close()` — it is **not** tied to scroll position
or route changes. Two small composables (built only on the public
`store.open()` / writable `store.isVisible`) add exactly those modes.
The reference implementation lives at
[`src/composables/useAutoFab.ts`](../src/composables/useAutoFab.ts)
(unit-tested in `tests/useAutoFab.test.ts`) — copy it into your app, or
import it if you vendor the repo.

**Mode 1 — surface the FAB when the inline player scrolls out of view,
hide it (without pausing) when it scrolls back:**

```ts
import { ref } from 'vue'
import { useAutoFab } from './composables/useAutoFab'

const playerEl = ref<HTMLElement | null>(null)
useAutoFab(playerEl) // observes playerEl; show FAB out of view, hide in view
```

```vue
<div ref="playerEl"><MusicPlayer /></div>
```

The key detail: when the player returns to view the helper writes
`store.isVisible = false` directly rather than calling `store.close()`,
because `close()` also **pauses playback** — here you want the FAB to
disappear while the song keeps playing. Options: `requirePlayback`
(only show after first play), `rootMargin`, `threshold`.

**Mode 2 — show the FAB on navigation (opt-in):**

```ts
import { useRouter } from 'vue-router'
import { showFabOnRouteChange } from './composables/useAutoFab'

const onRoute = showFabOnRouteChange() // only after first play; { always: true } for every nav
useRouter().afterEach(() => onRoute())
```

Opt-in by definition — nothing happens unless you wire it. (To do the
reverse — _hide_ the FAB on specific routes — see the section above.)

## Tracks behind authentication

The audio element follows standard browser rules. If the source needs cookies, host it on the same origin or serve it with CORS + `Access-Control-Allow-Credentials`. The FFT analyser additionally requires `Access-Control-Allow-Origin` to be permissive — otherwise the bars stay flat, but **playback still works**.

## Disable the analyser

The analyser is wrapped in a `try / catch`. Nothing to disable — if you don't want the EQ bars, hide them in CSS:

```css
.mp__eq,
.fab__eq {
  display: none;
}
```

## Limitations

- One global `<audio>` element per store id. For two independent players (one inline, one FAB, both playing different tracks at once), clone the store with `defineStore('audio-second', …)` — the singleton pattern is per-store, not per-app.
- First play must follow a user gesture (browser autoplay policy). If `audio.play()` rejects, `isPlaying` still flips to `true` because the call site sets it synchronously — check the browser console for autoplay-policy warnings and gate your first play on a user click.
- Cross-origin tracks freeze the EQ bars. The Web Audio analyser requires CORS-enabled responses when used with `MediaElementAudioSourceNode`. Either serve the audio with `Access-Control-Allow-Origin: *` or host it on the same origin.
- The default UI ships prev / next + scrub only. Volume, shuffle and repeat aren't in the chrome — the actions exist on the store, wire your own UI if you need them (see "Build your own controls" above).
