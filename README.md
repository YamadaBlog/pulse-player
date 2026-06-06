<div align="center">

# pulse-player

**A drop-in Vue 3 music player — floating FAB + inline card, one persistent global store.**

[![Vue 3](https://img.shields.io/badge/Vue-3.4+-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Pinia](https://img.shields.io/badge/Pinia-2.1+-f7d336?logo=pinia&logoColor=black)](https://pinia.vuejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-3DBDA7.svg)](./LICENSE)
[![bundle](https://img.shields.io/badge/gzip-~41kB-3DBDA7)](#dependencies)

<br>

<img src="./docs/screenshots/hero.png" alt="pulse-player inline card with cover art, GitHub + Spotify icons, NOW PLAYING label and prev/next controls" width="680" />

</div>

---

`pulse-player` is two Vue 3 single-file components and one Pinia store.
Embed the inline **`MusicPlayer`** card anywhere in a page, drop the floating
**`MiniPlayer`** FAB at the root of your app, and the same global audio
session powers both — playback survives navigation, the FAB persists across
routes, the component scales fluidly to its container.

- **9 background variants** + a custom-CSS escape hatch
- **Container-query responsive** typography (mobile-first, scales to desktop)
- FFT equalizer bars (4 bands, Web Audio API)
- Circular progress ring on the FAB, hover-to-scrub progress bar inline
- Draggable FAB, swipe-to-dismiss, long-press radial menu
- Opt-in GitHub / Spotify link icons
- Themable accent via a single CSS variable
- Zero business / domain code — pure UI library, MIT licensed
- **~41 kB gzipped** (JS + CSS combined)

## Variants

<table>
  <tr>
    <td align="center" width="33%">
      <img src="./docs/screenshots/variant-auto.png" width="280" alt="auto variant" />
      <br><sub><code>variant="auto"</code> — cover art blur</sub>
    </td>
    <td align="center" width="33%">
      <img src="./docs/screenshots/variant-vinyl.png" width="280" alt="vinyl dark variant" />
      <br><sub><code>variant="vinyl"</code> — warm analog</sub>
    </td>
    <td align="center" width="33%">
      <img src="./docs/screenshots/variant-sunset.png" width="280" alt="sunset variant" />
      <br><sub><code>variant="sunset"</code> — sepia / brown</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./docs/screenshots/variant-midnight.png" width="280" alt="midnight variant" />
      <br><sub><code>variant="midnight"</code> — deep navy</sub>
    </td>
    <td align="center">
      <img src="./docs/screenshots/variant-aurora.png" width="280" alt="aurora variant" />
      <br><sub><code>variant="aurora"</code> — teal night</sub>
    </td>
    <td align="center">
      <img src="./docs/screenshots/variant-dark.png" width="280" alt="dark variant" />
      <br><sub><code>variant="dark"</code> — neutral dark</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./docs/screenshots/variant-light.png" width="280" alt="light variant" />
      <br><sub><code>variant="light"</code> — light theme</sub>
    </td>
    <td align="center">
      <img src="./docs/screenshots/variant-transparent.png" width="280" alt="transparent variant" />
      <br><sub><code>variant="transparent"</code> — frameless</sub>
    </td>
    <td align="center">
      <img src="./docs/screenshots/variant-custom.png" width="280" alt="custom chocolate variant" />
      <br><sub><code>variant="custom"</code> + your CSS</sub>
    </td>
  </tr>
</table>

Every variant ships with a tasteful default accent. Override locally with
`accentColor="#hex"` (EQ bars, scrub hover, FAB ring).

## Responsive

Typography is sized with **container queries**, not viewport media queries —
the component reads its own width and scales the title + artwork + chrome
accordingly. Drop it in a 320 px sidebar or a 720 px hero, it stays clean.

<div align="center">

<img src="./docs/screenshots/responsive-320.png" alt="320 px container" width="320" />
<br><sub>320 px</sub>
<br><br>
<img src="./docs/screenshots/responsive-480.png" alt="480 px container" width="480" />
<br><sub>480 px</sub>
<br><br>
<img src="./docs/screenshots/responsive-720.png" alt="720 px container" width="680" />
<br><sub>720 px — same component, fluid typography, no layout breaks</sub>

</div>

## Floating FAB

<table>
  <tr>
    <td align="center" width="50%">
      <img src="./docs/screenshots/fab-auto.png" width="80" alt="FAB auto (cover art)" />
      <br><sub><code>variant="auto"</code> — cover art</sub>
    </td>
    <td align="center" width="50%">
      <img src="./docs/screenshots/fab-vinyl.png" width="80" alt="FAB vinyl" />
      <br><sub><code>variant="vinyl"</code> — gold ring</sub>
    </td>
  </tr>
</table>

A 56 px circular button (configurable). Draggable, swipe down/right to
dismiss, long-press for the radial menu (next + close). Progress ring runs
around the edge.

## Install

```bash
git clone https://github.com/YamadaBlog/pulse-player.git
cd pulse-player
npm install
npm run dev       # demo on http://localhost:5174
```

For your own Vue 3 app, copy [`src/lib/`](./src/lib) into your project — it
has no other source dependency. Then:

```bash
npm install vue pinia lucide-vue-next
```

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

createApp(App).use(createPinia()).mount('#app')
```

## Usage

```vue
<script setup lang="ts">
import { MusicPlayer, MiniPlayer, useAudioStore } from './lib'

const store = useAudioStore()
</script>

<template>
  <!-- Inline card — embed anywhere. Both icons appear by default. -->
  <MusicPlayer
    variant="sunset"
    accent-color="#F59E0B"
    github-url="https://github.com/your-handle"
    spotify-url="https://open.spotify.com/playlist/..."
  />

  <!-- Your own controls — the store is the only contract. -->
  <button @click="store.toggle">
    {{ store.isPlaying ? 'Pause' : 'Play' }}
  </button>

  <!-- Mount ONCE near the app root — persists across every navigation. -->
  <MiniPlayer variant="vinyl" />
</template>
```

No provider, no plugin registration — Pinia is the only thing that needs to
be installed once.

## Change the music

### Replace the demo files (simplest)

Drop your own audio + covers into `public/audio/` keeping the demo
filenames (`track1.webm`, `track2.webm`, `cover.webp`, `cover2.webp`). No
code change.

### Provide your own playlist

```ts
// main.ts — BEFORE the app mounts
import { setAudioTracks } from './lib'

setAudioTracks([
  { title: 'YOUR TRACK',  src: '/music/01.mp3', cover: '/img/01.jpg', coverPos: '50% 40%' },
  { title: 'ANOTHER ONE', src: '/music/02.mp3', cover: '/img/02.jpg', coverPos: 'center', coverScale: 1.1 },
])

createApp(App).use(createPinia()).mount('#app')
```

```ts
interface Track {
  title: string        // shown in the inline player
  src: string          // any browser-supported codec
  cover: string        // cover image URL
  coverPos: string     // CSS object-position
  coverScale?: number  // optional CSS scale (1.25 = +25 % zoom)
}
```

## Props — `<MusicPlayer />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'auto' \| 'transparent' \| 'solid' \| 'dark' \| 'light' \| 'sunset' \| 'midnight' \| 'aurora' \| 'vinyl' \| 'custom'` | `'auto'` | Visual background preset. |
| `customBackground` | `string` | — | Any CSS `background` value. Used when `variant="custom"`. |
| `accentColor` | `string` | — | Overrides the local accent (EQ bars, scrub hover, focus). |
| `githubUrl` | `string` | — | If set, the GitHub icon becomes a link to this URL. Without it, the icon is decorative. |
| `spotifyUrl` | `string` | — | If set, the Spotify icon becomes a link (e.g. to the album / playlist). Without it, decorative. |
| `hideIcons` | `boolean` | `false` | Hide BOTH icons entirely. |

## Props — `<MiniPlayer />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | same set as `MusicPlayer` | `'auto'` | `'auto'` shows the cover art inside the circle; presets fill with a solid / gradient. |
| `customBackground` | `string` | — | CSS background for `variant="custom"`. |
| `accentColor` | `string` | — | Overrides the ring + EQ accent locally. |
| `size` | `number` | `56` | Diameter in pixels (min recommended 40). |
| `offset` | `{ bottom?: number; right?: number }` | `{ bottom: 32, right: 16 }` | Position offset from the bottom-right corner. |

## CSS variables (global theming)

```css
:root {
  --pulse-accent: #ff3da8;   /* EQ bars, progress ring, scrub hover, focus */
  --pulse-bg:     #0e0e14;   /* `solid` variant background */
}
```

Both components fall back to teal (`#3DBDA7`) when the variables are
absent, so they work out of the box without theming work.

## Examples

```vue
<!-- Vinyl Dark — warm analog with gold accent (matches the variant aesthetic) -->
<MusicPlayer variant="vinyl" accent-color="#C8A97E" />

<!-- Midnight with brand violet -->
<MusicPlayer variant="midnight" accent-color="#8B5CF6"
             spotify-url="https://open.spotify.com/playlist/abc" />

<!-- Light theme inversion -->
<MusicPlayer variant="light" accent-color="#6750A4" />

<!-- Fully custom — pass any CSS background -->
<MusicPlayer
  variant="custom"
  :custom-background="'linear-gradient(135deg, #2c1610 0%, #4a2c1f 45%, #6b4226 100%)'"
  accent-color="#E8A87C"
/>

<!-- Bigger FAB, pinned higher -->
<MiniPlayer variant="aurora" :size="72" :offset="{ bottom: 56, right: 24 }" />

<!-- Headless mode: hide both icons -->
<MusicPlayer variant="midnight" hide-icons />
```

## Store API — `useAudioStore`

### State (all reactive)

| | Type | |
|---|---|---|
| `currentTrack` | `number` | Index in the playlist. |
| `isPlaying` | `boolean` | Live playback flag. |
| `currentTime` / `duration` | `number` | Seconds. |
| `progress` | `number` (computed) | `0–100`. |
| `eqBars` | `number[]` | 4-band FFT energies, `0–1`. |
| `track` / `tracks` | computed | Current `Track` / full playlist. |
| `isVisible` | `boolean` | Whether the floating FAB should render. |
| `hasBeenOpened` | `boolean` | `true` after the user starts playback at least once. |

### Actions

| | |
|---|---|
| `toggle()` | Initialize audio on first call, then play ↔ pause. Flips `isVisible` on first play. |
| `next()` / `prev()` | Wraps to start/end. `prev` restarts the current track if `currentTime > 3s`. |
| `loadTrack(i)` | Jump to track `i`. Keeps playing if already playing. |
| `seek(fraction)` | `fraction ∈ [0, 1]`. |
| `open()` / `close()` | Show / hide the floating FAB (`close` also pauses). |
| `fmt(seconds)` | Format helper returning `m:ss`. |

## How it works

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

A single `<audio>` element + Web Audio API analyser live in the Pinia store —
outside the Vue component tree. Mount / unmount either UI component freely:
nothing ever stops playback. For embedding patterns + FAQ, see
[`docs/USAGE.md`](./docs/USAGE.md).

## Dependencies

Runtime:
- `vue` ^3.4 — composition API + `<script setup>` + `<Teleport>`
- `pinia` ^2.1 — state management
- `lucide-vue-next` ^0.300 — `Play`, `Pause`, `SkipBack`, `SkipForward`, `X`

Browser APIs:
- `HTMLAudioElement`
- Web Audio API: `AudioContext` + `AnalyserNode` + `MediaElementAudioSourceNode` (used only for the EQ bars — try/catch wrapped, bars stay flat if unavailable)
- `ResizeObserver`
- CSS container queries (Chrome 105+, Safari 16+, Firefox 110+)
- Vue 3 `<Teleport>` (built-in)

Build / dev only: `vite ^5`, `@vitejs/plugin-vue ^5`, `typescript ^5.4`, `vue-tsc ^2`.
> ⚠ `vue-tsc 1.x` is incompatible with TypeScript 5.3+ (`supportedTSExtensions` crash). Use `^2`.

**Bundle:** ~96 kB JS + ~15 kB CSS (≈ **41 kB gzipped** combined).

## Limits

- One global `<audio>` element. For two independent players on the same
  page, clone the store with a different `defineStore` id.
- The FFT analyser requires CORS-enabled responses when the source is
  cross-origin (`MediaElementAudioSourceNode` quirk). Playback still works;
  only the EQ bars stay flat.
- First play must follow a user gesture (standard autoplay policy).
- No volume slider, shuffle or repeat in the default UI — the store actions
  exist, you can wire your own controls.

## Roadmap

- [ ] Volume slider + mute on the inline card
- [ ] Shuffle / repeat modes
- [ ] Persist `currentTrack` + `currentTime` to `localStorage`
- [ ] Keyboard shortcuts (`Space`, `←`, `→`)
- [ ] Media Session API (hardware media keys + lock-screen art)
- [ ] Waveform variant (canvas-rendered alternative to the EQ bars)
- [ ] Published as a standalone npm package

## License

[MIT](./LICENSE). The two demo tracks under `public/audio/` are shipped for
local testing only and are **not** part of the MIT-licensed source — replace
them with content you own before redistributing.

<div align="center">

<sub>Built with Vue 3, Pinia, and a small amount of obsessive responsive tuning.</sub>

</div>
