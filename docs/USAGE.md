# USAGE — pulse-player

Detailed integration guide. For the overview, install, API reference and
theming, see [README.md](../README.md).

---

## 1. Architectural model

`pulse-player` is built around **one** singleton `<audio>` element owned by a
Pinia store. Vue components are pure projections of that state:

```
                ┌────────────────────────────────┐
                │       useAudioStore (Pinia)    │
                │  - audio: HTMLAudioElement     │
                │  - AnalyserNode (FFT, 4 bars)  │
                │  - tracks[], currentTrack,     │
                │    isPlaying, progress, ...    │
                └──────────┬─────────────────────┘
                           │ reactive refs
            ┌──────────────┴──────────────┐
            │                             │
   ┌────────▼────────┐         ┌──────────▼──────────┐
   │ MusicPlayer.vue │         │   MiniPlayer.vue    │
   │  (inline card)  │         │ (floating FAB body) │
   └─────────────────┘         └─────────────────────┘
```

Consequences:
- Both components can be mounted simultaneously without conflict.
- Either can be unmounted at any time without stopping playback.
- Switching pages in your app preserves audio because the store lives
  outside the component tree.

## 2. Triggering and stopping playback

There is **no explicit `start()` action** — `toggle()` does it all.

```ts
const store = useAudioStore()

store.toggle()  // first call: init AudioContext + start playback
store.toggle()  // pause
store.toggle()  // resume

store.close()   // pause + hide the FAB
store.open()    // show the FAB without playing
```

First-play side effects:
- `toggle()` calls `initAudio()` internally (idempotent — safe to call repeatedly).
- `isVisible` flips to `true` on first play — that's what makes the floating FAB appear.
- `hasBeenOpened` flips to `true` permanently after first play, useful if you
  want to gate first-time onboarding UI.

> **Autoplay caveat**: per browser policy, the very first `audio.play()` MUST
> follow a user gesture (click / keydown). `pulse-player` does not work around
> this — keep your first trigger inside a click handler.

## 3. Changing tracks at runtime

```ts
const store = useAudioStore()

store.next()         // wraps to start
store.prev()         // restart if currentTime > 3s, else previous
store.loadTrack(2)   // jump to index 2; continues playing if already playing
store.seek(0.5)      // jump to 50 % of the duration
```

To replace the **entire** playlist at runtime:

```ts
import { setAudioTracks } from './lib'

setAudioTracks([...newTracks])
store.loadTrack(0)   // explicit reset to the first track of the new list
```

The replace-then-reload pattern is required because `setAudioTracks()` only
updates the internal array — the currently loaded `<audio>` keeps the old src
until you call `loadTrack()`.

## 4. Embedding patterns

### 4.1 Floating FAB only (drop-in global player)

`main.ts`:
```ts
createApp(App).use(createPinia()).mount('#app')
```

`App.vue`:
```vue
<template>
  <RouterView />
  <MiniPlayer />  <!-- once, at the root -->
</template>
```

Anywhere in your app:
```vue
<button @click="useAudioStore().toggle()">Play music</button>
```

That first click triggers `toggle()` → `isVisible = true` → the floating FAB pops in.

### 4.2 Inline player on a single page

```vue
<template>
  <section class="now-playing">
    <MusicPlayer github-url="https://github.com/your-handle" />
  </section>
</template>
```

The inline `MusicPlayer` is responsive: it computes the artwork size from the
container width via a `ResizeObserver`. Give the container a fixed width if
you want a fixed look.

### 4.3 Both together (recommended)

- `<MiniPlayer />` mounted globally → persistent FAB.
- `<MusicPlayer />` on a dedicated "Now playing" page → richer UI when the user wants it.

They share the same store and stay in perfect sync.

## 5. Custom controls

Don't like the built-in controls? Build your own — the store is your only
contract:

```vue
<script setup>
import { useAudioStore } from './lib'
const audio = useAudioStore()
</script>

<template>
  <input
    type="range"
    min="0"
    max="100"
    :value="audio.progress"
    @input="audio.seek($event.target.value / 100)"
  />
  <span>{{ audio.fmt(audio.currentTime) }} / {{ audio.fmt(audio.duration) }}</span>
</template>
```

## 6. Theming recipes

```css
/* Light-ish theme */
:root {
  --pulse-accent: #6750a4;
  --pulse-bg: #f4f4f8;
}

/* High-contrast / WCAG focus */
:root {
  --pulse-accent: #00ff88;
}
```

Note: the components are designed for dark UIs (white text). For a truly
light theme you'd also need to override the `color: #ffffff` hard-coded in
`.mp__title` etc.

## 7. Common questions

**Why is there no `play()` and `pause()`?**
There is — they're inside `toggle()`. We didn't expose them separately to
keep one source of truth on the `isPlaying` flag.

**Why does the FAB not appear after I call `toggle()`?**
The store's `isVisible` is set inside the `play` branch of `toggle()`. If
the AudioContext failed to start (e.g., the gesture got swallowed),
`audio.play()` returns a rejected promise but `isPlaying` and `isVisible`
will still have been set. Check the browser console for autoplay-policy
warnings.

**Cross-origin tracks freeze the EQ bars.**
That's expected: the Web Audio analyser requires CORS-enabled responses
when used with `MediaElementAudioSourceNode`. Either serve the audio with
`Access-Control-Allow-Origin: *` or host it on the same origin.

**Can I have two players on the same page playing different tracks?**
Not with the default store — there's one `<audio>` element. Clone
`useAudioStore` with a different `defineStore` id if you need this.

## 8. File layout

```
pulse-player/
├── public/
│   └── audio/
│       ├── cover.webp        # demo cover 1
│       ├── cover2.webp       # demo cover 2
│       ├── track1.webm       # demo track 1
│       └── track2.webm       # demo track 2
├── src/
│   ├── lib/                  # the reusable library
│   │   ├── index.ts          # public exports
│   │   ├── useAudioStore.ts  # Pinia store + setAudioTracks helper
│   │   ├── MiniPlayer.vue    # floating FAB
│   │   └── MusicPlayer.vue   # inline card
│   ├── App.vue               # demo page (not part of the library)
│   └── main.ts               # demo entry (not part of the library)
├── docs/
│   └── USAGE.md              # this file
├── index.html
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

To consume the library in your own project, copy `src/lib/` verbatim.
Nothing else is required.
