<div align="center">

# pulse-player

**A drop-in Vue 3 music player — floating FAB + inline card, one persistent global store.**

[![Vue 3](https://img.shields.io/badge/Vue-3.4+-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Pinia](https://img.shields.io/badge/Pinia-2.1+-f7d336?logo=pinia&logoColor=black)](https://pinia.vuejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-3DBDA7.svg)](./LICENSE)

<img src="./docs/screenshots/hero.png" alt="pulse-player default inline player with cover art background" width="900" />

</div>

---

`pulse-player` is two Vue 3 components and one Pinia store. Mount the inline
**`MusicPlayer`** card anywhere in a page, drop the floating **`MiniPlayer`**
FAB at the root of your app, and the same global audio session powers both —
playback survives navigation, the FAB persists across routes, and the
component sizes itself to its container with no layout breaks from a 320 px
sidebar to a 720 px hero.

- Container-query responsive typography (mobile-first, scales clean to desktop)
- 8 curated background presets + a custom-CSS escape hatch
- FFT equalizer bars (4 bands, smoothed via Web Audio API)
- Circular progress ring on the FAB, hover-to-scrub progress bar inline
- Draggable FAB, swipe to dismiss, long-press radial menu
- Themable accent color via a single CSS variable
- Zero business / domain code — pure UI library, MIT licensed

## Background variants

<img src="./docs/screenshots/variants.png" alt="The 8 background variants: auto, sunset, midnight, aurora, dark, light, transparent, custom" width="900" />

| Variant | Use case |
|---|---|
| `auto` *(default)* | Live cover art, heavily blurred + noise overlay. The signature look. |
| `sunset` | Warm sepia / brown gradient — pairs naturally with amber accent. |
| `midnight` | Deep navy → violet — pairs with `#8B5CF6` accent. |
| `aurora` | Teal night gradient — pairs with `#06B6D4` accent. |
| `dark` | Pure neutral `#0a0a0f` — best when your app already has a strong palette. |
| `light` | Inverted text + soft surface for light-mode apps. |
| `transparent` | No background, no border tint — sits over whatever you give it. |
| `custom` | Pass any CSS `background` value via `customBackground`. |

## Responsive

<img src="./docs/screenshots/responsive.png" alt="The same MusicPlayer component at 320 px, 480 px and 720 px container widths — typography scales without layout breaks" width="900" />

Typography is sized with **container queries**, not viewport media queries.
The component reads its own width and scales the title, artwork and chrome
accordingly. Drop it in a 320 px sidebar or a 720 px hero — it stays clean
without you tuning a thing.

## Install

```bash
git clone https://github.com/YamadaBlog/pulse-player.git
cd pulse-player
npm install
npm run dev      # demo on http://localhost:5174
```

To consume in your own Vue 3 app, copy [`src/lib/`](./src/lib) into your
project — it has no other source dependency. Then:

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
  <!-- Inline card — embed anywhere. -->
  <MusicPlayer variant="sunset" accent-color="#F59E0B" />

  <!-- Your own controls, if you don't want the built-in ones. -->
  <button @click="store.toggle">
    {{ store.isPlaying ? 'Pause' : 'Play' }}
  </button>

  <!-- Mount ONCE near the app root — survives every navigation. -->
  <MiniPlayer variant="midnight" />
</template>
```

That's it. No provider, no context, no plugin registration — Pinia is the
only thing that needs to be installed once.

## Change the music

### Replace the demo files (simplest)

Drop your own audio + covers into `public/audio/` and keep the demo filenames
(`track1.webm`, `track2.webm`, `cover.webp`, `cover2.webp`). No code change.

### Provide your own playlist

```ts
// main.ts
import { setAudioTracks } from './lib'

setAudioTracks([
  { title: 'YOUR TRACK',    src: '/music/01.mp3', cover: '/img/01.jpg', coverPos: '50% 40%' },
  { title: 'ANOTHER ONE',   src: '/music/02.mp3', cover: '/img/02.jpg', coverPos: 'center', coverScale: 1.1 },
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

## Customization

### Props — `<MusicPlayer />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'auto' \| 'transparent' \| 'solid' \| 'dark' \| 'light' \| 'sunset' \| 'midnight' \| 'aurora' \| 'custom'` | `'auto'` | Visual background preset. |
| `customBackground` | `string` | — | Any CSS `background` value. Used when `variant="custom"`. |
| `accentColor` | `string` | — | Overrides `--pulse-accent` locally (EQ bars, scrub progress). |
| `githubUrl` | `string` | — | If set, shows an inline GitHub icon linking to the URL. |
| `showSpotifyIcon` | `boolean` | `false` | Decorative Spotify glyph (no link). |

### Props — `<MiniPlayer />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | same set as MusicPlayer | `'auto'` | `'auto'` shows the cover art inside the circle; other presets use a solid/gradient fill. |
| `customBackground` | `string` | — | CSS background used when `variant="custom"`. |
| `accentColor` | `string` | — | Overrides the ring + EQ accent locally. |
| `size` | `number` | `56` | Diameter in pixels. Min recommended 40. |
| `offset` | `{ bottom?: number; right?: number }` | `{ bottom: 32, right: 16 }` | Position offset from the bottom-right corner. |

### CSS variables (global theming)

```css
:root {
  --pulse-accent: #ff3da8;   /* EQ bars, progress ring, scrub hover, focus ring */
  --pulse-bg:     #0e0e14;   /* `solid` variant background */
}
```

Both components fall back to a teal default (`#3DBDA7`) when the variables
are absent, so they work out of the box without any theming work.

### Examples

```vue
<!-- Sunset (warm sepia gradient) with amber accent -->
<MusicPlayer variant="sunset" accent-color="#F59E0B" />

<!-- Midnight (deep navy / violet) with violet accent -->
<MusicPlayer variant="midnight" accent-color="#8B5CF6" />

<!-- Light theme -->
<MusicPlayer variant="light" accent-color="#6750A4" />

<!-- Fully custom — pass any CSS background -->
<MusicPlayer
  variant="custom"
  :custom-background="'linear-gradient(135deg, #2c1610 0%, #4a2c1f 45%, #6b4226 100%)'"
  accent-color="#E8A87C"
/>

<!-- Bigger FAB, pinned higher, brand-accent ring -->
<MiniPlayer variant="aurora" :size="72" :offset="{ bottom: 56, right: 24 }" />
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
nothing ever stops playback.

For a deeper integration guide, embedding patterns and FAQ, see
[`docs/USAGE.md`](./docs/USAGE.md).

## Dependencies

Runtime:
- `vue` ^3.4 — composition API + `<script setup>` + `<Teleport>`
- `pinia` ^2.1 — state management
- `lucide-vue-next` ^0.300 — icons (`Play`, `Pause`, `SkipBack`, `SkipForward`, `X`)

Browser APIs:
- `HTMLAudioElement` (universal)
- Web Audio API: `AudioContext` + `AnalyserNode` + `MediaElementAudioSourceNode` — used only for the FFT bars, wrapped in try/catch (bars stay flat if unavailable)
- `ResizeObserver` (Safari 13.1+, all evergreen browsers)
- CSS container queries (Chrome 105+, Safari 16+, Firefox 110+)
- Vue 3 `<Teleport>` (built-in)

Build / dev only: `vite ^5`, `@vitejs/plugin-vue ^5`, `typescript ^5.4`, `vue-tsc ^2`.
> ⚠ `vue-tsc 1.x` is incompatible with TypeScript 5.3+ (`supportedTSExtensions` crash). Use `^2`.

## Limits

- One global `<audio>` element. For two independent players on the same page,
  clone the store with a different `defineStore` id.
- The FFT analyser requires CORS-enabled responses when the source is
  cross-origin (`MediaElementAudioSourceNode` quirk). Playback still works;
  only the EQ bars stay flat.
- First play must follow a user gesture (standard autoplay policy).
- No volume slider, shuffle or repeat in the default UI — actions live in
  the store, you can wire your own controls on top.

## Roadmap

- [ ] Volume slider + mute (inline)
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

<sub>Built with Vue 3, Pinia and a small amount of obsessive responsive tuning.</sub>

</div>
