# Frameworks

Pulse is a set of standard Custom Elements, so it works anywhere the DOM does. The wrappers exist for comfort: typed props, idiomatic events and a reactive view of the audio session.

- [Vue](#vue) · [React](#react) · [Svelte](#svelte) · [Angular](#angular) · [Plain HTML](#plain-html) · [React Native](#react-native-experimental)

## Vue

```bash
npm i @pulse-music/vue
```

```vue
<script setup lang="ts">
import { PulsePlayer, PulseFab, usePulseAudio, type Track } from '@pulse-music/vue'

const tracks: Track[] = [
  { title: 'Protofunk', artist: 'Kevin MacLeod', src: '/protofunk.mp3', cover: '/protofunk.jpg' },
]
const { state, track, isPlaying, toggle, next } = usePulseAudio()
</script>

<template>
  <PulsePlayer
    :tracks="tracks"
    variant="midnight"
    ambient-eq
    @play="({ track }) => console.log(track.title)"
  />
  <button @click="toggle">{{ isPlaying ? 'Pause' : 'Play' }} {{ track?.title }}</button>
  <p>{{ state.currentTime.toFixed(0) }}s</p>
  <PulseFab placement="bottom-start" pulso />
</template>
```

- `PulsePlayer` / `PulseFab` accept every element option as a prop (camelCase or kebab-case) and emit `play`, `pause`, `trackchange`, `ended`, `error` (and `resize` for the player). The default slot is forwarded, so `<pulse-track>` children and `slot="actions"` content work.
- `usePulseAudio({ engine?, session? })` returns `state` (a shallow ref of the immutable snapshot), computed `track`, `tracks`, `progress`, `isPlaying`, the `engine` and every action. The subscription is released with the component.
- No Pinia or plugin required.

Using the raw elements in your own templates? Tell the Vue compiler they are custom elements:

```ts
// vite.config.ts
vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('pulse-') } } })
```

## React

```bash
npm i @pulse-music/react
```

```tsx
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse-music/react'

export function Player({ tracks }) {
  const { isPlaying, track, toggle } = usePulseAudio()
  return (
    <>
      <PulsePlayer
        tracks={tracks}
        variant="aurora"
        ambientEq
        onTrackChange={({ track }) => setTitle(track.title)}
      />
      <button onClick={toggle}>{isPlaying ? 'Pause' : 'Play'}</button>
      <PulseFab pulso />
    </>
  )
}
```

- Works with React 18 and 19. Values are passed as DOM **properties**, so arrays, objects and booleans arrive intact on both versions; callbacks are always the latest ones without re-subscribing.
- `usePulseAudio()` is built on `useSyncExternalStore`: tearing-free in concurrent rendering, and the returned actions are stable across renders.
- Server components: render the players from a client component (`'use client'`). See [Next.js](./integrations/next-app-router.md).

## Svelte

```bash
npm i @pulse-music/svelte
```

```svelte
<script lang="ts">
  import { usePulseAudio } from '@pulse-music/svelte'
  export let tracks

  const audio = usePulseAudio()
</script>

<pulse-player {tracks} variant="sunset" ambient-eq on:pulse-play={(e) => console.log(e.detail)}></pulse-player>
<button on:click={audio.toggle}>{$audio.isPlaying ? 'Pause' : 'Play'} {$audio.track?.title}</button>
<pulse-fab pulso></pulse-fab>
```

Svelte renders Custom Elements natively and sets their properties, so no component wrapper is needed. `usePulseAudio()` returns a readable store (`$audio`) plus the actions; it works in Svelte 4 and 5 (with runes, use `onpulse-play={…}` instead of `on:pulse-play`).

## Angular

```bash
npm i @pulse-music/web-component
```

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import '@pulse-music/web-component'
import type { Track } from '@pulse-music/web-component'

@Component({
  selector: 'app-player',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <pulse-player
      [tracks]="tracks"
      variant="vinyl"
      (pulse-trackchange)="onTrack($event)"
    ></pulse-player>
    <pulse-fab [pulso]="true"></pulse-fab>
  `,
})
export class PlayerComponent {
  tracks: Track[] = [{ title: 'Protofunk', src: '/protofunk.mp3' }]
  onTrack(e: Event) {
    console.log((e as CustomEvent).detail.track.title)
  }
}
```

Angular binds `[property]` to element properties and `(event)` to DOM events, which is all Pulse needs. For reactive state, wrap the engine in a signal:

```ts
import { signal } from '@angular/core'
import { getSharedEngine } from '@pulse-music/web-component'

const engine = getSharedEngine()
export const pulseState = signal(engine.state)
engine.onStateChange((s) => pulseState.set(s))
```

## Plain HTML

Nothing to learn beyond the [element reference](./reference/elements.md):

```html
<pulse-player variant="light" accent-color="#0e8f7c">
  <pulse-track src="/a.mp3" title="A" cover="/a.jpg"></pulse-track>
</pulse-player>
<script type="module">
  import '@pulse-music/web-component'
  document
    .querySelector('pulse-player')
    .addEventListener('pulse-play', (e) => console.log(e.detail.track))
</script>
```

## React Native (experimental)

`@pulse-music/react-native` is a separate native renderer (Expo AV, Reanimated, react-native-svg) that shares the `Track` / variant contract. It is released independently of the web packages and is not yet at feature parity — see its [README](../packages/react-native/README.md).
