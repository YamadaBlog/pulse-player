# Pulse — Online sandboxes

Interactive playgrounds for evaluating Pulse without cloning the repo. Each link opens a pre-configured project on a free CodeSandbox or StackBlitz workspace.

> 📺 **Prefer a video?** Watch the 3-minute demo on YouTube: [https://youtu.be/q_FJ1GWaCc8](https://youtu.be/q_FJ1GWaCc8). The video walks through every framework wrapper, the 9 themes, the resize / FAB / fullscreen interactions, and the keyboard shortcuts, in real time. No clone needed.

> **Status:** `@pulse-music/*` packages are LIVE on npm as of 2026-06-08. The StackBlitz / CodeSandbox links below are templates — the maintainer creates each sandbox using the snippets, then replaces the URLs here with the shared workspace links.
>
> 1. Maintainer runs `npm publish --workspace=@pulse-music/{types,core,tokens,web-component,react,svelte}` (one-time, requires OTP)
> 2. Create the StackBlitz / CodeSandbox project from the templates in `apps/demo-{vanilla,react,svelte}/`
> 3. Replace the placeholder URLs below with the real share links
> 4. Each sandbox includes a "Fork on StackBlitz" badge that lands consumers in an editable copy

## Vanilla HTML (no framework)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/pulse-player-vanilla)

```html
<!doctype html>
<script type="module">
  import '@pulse-music/web-component'
</script>
<pulse-player variant="midnight" ambient-eq></pulse-player>
<pulse-fab variant="vinyl" pulso></pulse-fab>
```

Source: [`apps/demo-vanilla/index.html`](../../apps/demo-vanilla/index.html)

## React 18 / 19

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/pulse-player-react)
[![Edit on CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/sandbox/pulse-player-react)

```tsx
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse-music/react'

export default function App() {
  const { isPlaying, track, toggle } = usePulseAudio()
  return (
    <>
      <PulsePlayer variant="midnight" ambientEq />
      <PulseFab variant="vinyl" pulso draggable showMenu />
      <button onClick={toggle}>
        {isPlaying ? '⏸' : '▶'} {track.title}
      </button>
    </>
  )
}
```

Source: [`apps/demo-react/`](../../apps/demo-react/)

## Vue 3

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/pulse-player-vue)

```vue
<script setup lang="ts">
import { MusicPlayer, MiniPlayer } from '@pulse-music/vue'
</script>

<template>
  <MusicPlayer variant="midnight" />
  <MiniPlayer />
</template>
```

Source: [`src/App.vue`](../../src/App.vue) (v2.3.4 reference) — `@pulse-music/vue` is the soft re-export.

## Svelte 5

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/pulse-player-svelte)

```svelte
<script lang="ts">
  import { usePulseAudio } from '@pulse-music/svelte'
  const audio = usePulseAudio()
</script>

<pulse-player variant="midnight" ambient-eq></pulse-player>
<pulse-fab variant="vinyl" pulso></pulse-fab>
<button onclick={audio.toggle}>{$audio.isPlaying ? '⏸' : '▶'}</button>
```

Source: [`apps/demo-svelte/`](../../apps/demo-svelte/)

## Angular 17+

(Once `@pulse-music/angular` goes public — see [`BLOCKERS.md`](./BLOCKERS.md) for the `@angular/core` floor decision.)

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/pulse-player-angular)

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { PulseModule } from '@pulse-music/angular'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PulseModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<pulse-player variant="midnight" [attr.ambient-eq]="true"></pulse-player>`,
})
export class AppComponent {}
```

## Local development (no sandbox)

If you'd rather run locally:

```bash
git clone https://github.com/YamadaBlog/pulse-player.git
cd pulse-player
npm install

# Vue v2.3.4 reference demo
npm run dev                                       # → http://localhost:5174

# Per-framework demos
npm run dev --workspace=@pulse-music/demo-vanilla       # → http://localhost:5180
npm run dev --workspace=@pulse-music/demo-react         # → http://localhost:5181
npm run dev --workspace=@pulse-music/demo-svelte        # → http://localhost:5182
```

Each demo aliases the `@pulse-music/*` packages to the workspace TypeScript sources, so edits in `packages/*/src/` reflect immediately without rebuilding.

## Why both StackBlitz and CodeSandbox?

- **StackBlitz** runs the full Node + Vite toolchain in the browser via WebContainers. Best fit for our Vite-based demos — same dev server, same HMR, same build output.
- **CodeSandbox** runs in their cloud sandbox model with a faster boot time but a slightly less faithful Node environment.

Both are linked for React because React's tooling tolerates both equally; the Vite-heavy demos (Vue, Svelte, vanilla) link StackBlitz only.
