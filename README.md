# pulse-player

> Reusable Vue 3 music player components: a floating draggable FAB plus a
> full-size inline card, both backed by a single persistent global audio
> store. FFT equalizer, circular progress ring, long-press radial menu,
> drag-to-dismiss.

## What it is

`pulse-player` is two small Vue 3 single-file components and one Pinia store:

| Piece | Type | Role |
|---|---|---|
| `useAudioStore` | Pinia store | Singleton `<audio>` element + Web Audio API analyser (FFT). Owns all playback state. Lives outside the component tree so playback survives navigation. |
| `MiniPlayer.vue` | Vue 3 SFC | Floating 56 px circular FAB in the corner. Draggable, swipe-to-dismiss, long-press radial menu (next / close), circular progress ring. Teleports to `<body>`. |
| `MusicPlayer.vue` | Vue 3 SFC | Full-size inline card with artwork, animated background, NOW PLAYING label, FFT equalizer bars, track title, prev/next, hover-to-scrub progress bar. |

Both components delegate **all** audio state to `useAudioStore`. Mount or
unmount them freely — playback is never stopped by the UI lifecycle.

## What it can do

- Play / pause / next / previous, with persistent state across page navigation
- Click-to-seek progress bar (hover reveals a draggable thumb)
- FFT-driven equalizer bars (4 bands, smoothed)
- Multiple track playlist with circular cover crossfade and `coverPos` / `coverScale` framing
- Auto-advance on track end
- Floating FAB: draggable, swipe down/right to dismiss, long-press for radial menu
- Circular progress ring around the FAB
- Cover-art background of the inline player with blur + procedural noise SVG filter
- Responsive (mobile breakpoints) and `prefers-reduced-motion` aware
- Theme accent color via a single CSS variable (`--pulse-accent`)

## Demo (run locally)

```bash
git clone <repo-url>
cd pulse-player
npm install
npm run dev
```

Open <http://localhost:5174/>. You should see the inline player, a
controls row, and the floating FAB once you press Play.

> Audio playback requires a user gesture per browser autoplay policies — the
> first click on Play (or the artwork) bootstraps the `AudioContext`.

## Install in your own Vue 3 app

```bash
npm install vue pinia lucide-vue-next
```

Then copy `src/lib/` into your project (`useAudioStore.ts`,
`MiniPlayer.vue`, `MusicPlayer.vue`, `index.ts`) — it has no other
runtime dependency. Make sure your app provides a Pinia instance:

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')
```

### Use the components

```vue
<script setup lang="ts">
import { MusicPlayer, MiniPlayer, useAudioStore } from './lib'
const store = useAudioStore()
</script>

<template>
  <MusicPlayer />                       <!-- inline card, anywhere in a page -->
  <button @click="store.toggle">Play</button>

  <!-- Mount ONCE near the app root so the FAB persists across routes -->
  <MiniPlayer />
</template>
```

## Change the music

Two equally valid options.

### Option 1 — Replace the demo files (simplest)

Drop your own audio + covers into `public/audio/` keeping the same filenames
(`track1.webm`, `track2.webm`, `cover.webp`, `cover2.webp`). No code change.

### Option 2 — Provide your own track list

Call `setAudioTracks()` **before** the store is consumed:

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { setAudioTracks } from './lib'
import App from './App.vue'

setAudioTracks([
  { title: 'YOUR TRACK',    src: '/music/01.mp3', cover: '/img/01.jpg', coverPos: '50% 40%' },
  { title: 'ANOTHER ONE',   src: '/music/02.mp3', cover: '/img/02.jpg', coverPos: 'center', coverScale: 1.1 },
])

createApp(App).use(createPinia()).mount('#app')
```

### Track shape

```ts
interface Track {
  title: string        // displayed in the inline player
  src: string          // URL passed to <audio>; any browser-supported codec
  cover: string        // URL of the cover image
  coverPos: string     // CSS object-position (e.g. '50% 50%', '20% center')
  coverScale?: number  // optional CSS scale applied to the cover (1.25 = +25 %)
}
```

## API

Everything exported from `./lib`:

| Export | Kind | Purpose |
|---|---|---|
| `MiniPlayer` | Vue component | Floating FAB. Renders only when `store.isVisible === true`. |
| `MusicPlayer` | Vue component | Inline card. Props: `githubUrl?: string`, `showSpotifyIcon?: boolean`. |
| `useAudioStore()` | Pinia store factory | Reactive state + actions (see below). |
| `setAudioTracks(tracks)` | Function | Replace the global playlist. Call before first consumption. |
| `Track` | TypeScript type | Shape of a single track. |

### Store state (reactive)

| Property | Type | Notes |
|---|---|---|
| `currentTrack` | `number` | Index in the playlist. |
| `isPlaying` | `boolean` | `true` while audio is playing. |
| `currentTime` | `number` | Seconds. |
| `duration` | `number` | Seconds. |
| `progress` | `number` (computed) | `0–100`. |
| `eqBars` | `number[]` | 4-band FFT energies `0–1`. |
| `track` | `Track` (computed) | The currently selected track object. |
| `tracks` | `Track[]` (computed) | The full playlist (same array passed to `setAudioTracks`). |
| `isVisible` | `boolean` | Whether the floating `MiniPlayer` should render. |
| `hasBeenOpened` | `boolean` | `true` after the user starts playback at least once. |

### Store actions

| Action | Effect |
|---|---|
| `toggle()` | Initialize audio on first call, then play ↔ pause. Also flips `isVisible` on first play. |
| `next()` | Skip to the next track (wraps to start). |
| `prev()` | Restart current track if `currentTime > 3s`, otherwise previous. |
| `seek(fraction)` | `fraction ∈ [0, 1]`. |
| `loadTrack(i)` | Switch to track at index `i`. Continues playing if currently playing. |
| `open()` | Show the floating FAB (`isVisible = true`). |
| `close()` | Pause + hide the FAB. |
| `fmt(seconds)` | Format helper returning `m:ss`. |

## Theming

Override the accent (used by the EQ bars, progress, FAB ring) via a CSS variable:

```css
:root {
  --pulse-accent: #ff3da8; /* hot pink */
  --pulse-bg: #0e0e14;     /* inline-player background */
}
```

Both components fall back to a teal default (`#3DBDA7`) when the variable is
absent, so they work even without theming.

## Integrate into another app — checklist

1. Install runtime deps: `vue@^3.4`, `pinia@^2.1`, `lucide-vue-next`.
2. Copy `src/lib/` into your project (or publish it as your own package).
3. Ensure `createPinia()` is used in your `main.ts`.
4. (Optional) call `setAudioTracks(...)` before mount.
5. (Optional) override `--pulse-accent` / `--pulse-bg` in a global stylesheet.
6. Mount `<MiniPlayer />` **once** near the app root so it persists across routes.
7. Embed `<MusicPlayer />` anywhere you want an inline player.

## Dependencies

Runtime:
- `vue` ^3.4 — composition API + `<script setup>` + `<Teleport>`
- `pinia` ^2.1 — state management
- `lucide-vue-next` ^0.300 — icons (`Play`, `Pause`, `SkipBack`, `SkipForward`, `X`)

Build / dev only:
- `vite` ^5 — bundler / dev server
- `@vitejs/plugin-vue` ^5
- `typescript` ^5.4
- `vue-tsc` ^2 (note: `vue-tsc@1.x` is incompatible with `typescript@5.3+` and crashes with a `supportedTSExtensions` error — use `^2`)

Browser APIs used (no polyfill ships):
- `HTMLAudioElement` (universal)
- Web Audio API: `AudioContext`, `AnalyserNode`, `MediaElementAudioSourceNode` (used only for the FFT equalizer — wrapped in a try/catch; bars stay flat if unavailable)
- `ResizeObserver` (Safari 13.1+, all evergreen browsers)
- `<Teleport>` (Vue 3 built-in)

## Limits

- Single-instance store: one `<audio>` element shared globally. If you need
  several independent players on the same page, you'd need to clone the store
  with a different id.
- The FFT analyser requires the browser to allow `MediaElementAudioSourceNode`
  on the source. Cross-origin tracks must serve `Access-Control-Allow-Origin`
  (CORS) or the analyser will silently fail and the EQ bars stay flat
  (playback still works).
- Autoplay: first play must follow a user gesture (standard browser policy).
- No volume slider or shuffle in the current UI — actions are exposed in the
  store, you can build your own controls on top.
- No keyboard shortcuts wired by default.

## Next possible improvements

- Volume slider + mute on the inline player
- Shuffle / repeat modes
- Persisting `currentTrack` + `currentTime` to `localStorage`
- Keyboard shortcuts (`Space`, `←`, `→`)
- Media Session API (`navigator.mediaSession.metadata` + hardware media keys)
- Lyrics or waveform display
- Optional second store id for multi-instance use
- Package the lib as a standalone npm module (currently distributed by copying `src/lib/`)

## Acknowledgements

Visual design inspired by the "MyPlaying / NowPlaying" Spotify-style players.

## License

[MIT](./LICENSE). The two demo tracks under `public/audio/` are shipped for
local testing only and are **not** part of the MIT-licensed source — swap them
for content you own before redistributing.
