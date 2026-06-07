# Pulse in SvelteKit 2+

SvelteKit is Svelte under the hood with SSR by default. Pulse's `@pulse/svelte` package ships as a plain TypeScript hook + a side-effect import that registers the Web Components. The integration is one of the smallest in the family — Svelte's compiler handles Custom Element binding natively.

## Install

```bash
npm install @pulse/svelte @pulse/core
```

## The component

`src/lib/components/MusicPlayer.svelte`:

```svelte
<script lang="ts">
  import { usePulseAudio } from '@pulse/svelte'
  import { onMount } from 'svelte'
  import type { Track } from '@pulse/svelte'

  const audio = usePulseAudio()

  const tracks: Track[] = [
    {
      title: 'Ambient Test',
      artist: 'You',
      src: '/audio/ambient-test.webm',
      cover: '/covers/ambient-test.webp',
    },
  ]

  onMount(() => {
    audio.setAudioTracks(tracks)
  })

  function onPlay(e: CustomEvent) {
    // wire your analytics here
    console.log('play', e.detail.track.title, e.detail.time)
  }
</script>

<pulse-player
  variant="midnight"
  ambient-eq
  resizable
  onpulse-play={onPlay}
></pulse-player>

<pulse-fab variant="vinyl" pulso draggable show-menu></pulse-fab>

<!-- Optional reactive overlay using the Svelte classic-store contract -->
<p>{$audio.isPlaying ? '▶' : '⏸'} {$audio.track.title}</p>
```

## Use it from a route

`src/routes/+page.svelte`:

```svelte
<script lang="ts">
  import MusicPlayer from '$lib/components/MusicPlayer.svelte'
</script>

<svelte:head>
  <title>My SvelteKit site</title>
</svelte:head>

<main>
  <h1>My site</h1>
  <MusicPlayer />
</main>
```

## SSR / hydration safety

Svelte's `customElements.define()` call happens at import time inside `@pulse/svelte`. On the SvelteKit server, `customElements` is undefined and the package skips registration — no crash, the server-rendered HTML is bare `<pulse-player>` tags. On the client, the registration fires, the Lit elements upgrade, and the chrome renders.

If you see a Svelte hydration warning about the Custom Element, wrap it in `{#if browser}`:

```svelte
<script lang="ts">
  import { browser } from '$app/environment'
</script>

{#if browser}
  <pulse-player variant="midnight" ambient-eq></pulse-player>
{/if}
```

This avoids server-render entirely for the player subtree. Trade-off: there's a flash before client-side hydration completes; the empty space sits there for ~50-200 ms.

## Persistent FAB across routes

Mount the FAB once at the root layout:

`src/routes/+layout.svelte`:

```svelte
<script lang="ts">
  import { browser } from '$app/environment'
  import '@pulse/svelte' // side-effect register the Custom Elements
</script>

<slot />

{#if browser}
  <pulse-fab variant="vinyl" pulso draggable></pulse-fab>
{/if}
```

The engine is a singleton — playback state survives navigations transparently.

## Configuration tweak

If your SvelteKit project uses Vite's `optimizeDeps` and you see warnings about `@pulse/svelte` not being in the optimizer's pre-bundle list, add it explicitly to `vite.config.ts`:

```ts
export default defineConfig({
  plugins: [sveltekit()],
  optimizeDeps: {
    include: ['@pulse/svelte', '@pulse/core', '@pulse/web-component'],
  },
})
```

## Tested against

- SvelteKit 2.x (Svelte 5)
- Node 20 + 22
- Vite 5+

## What this snippet doesn't cover

- Svelte stores beyond Pulse's own subscribe contract — the `$audio` syntax is the classic-store autosubscribe; for runes-style consumers, use `usePulseAudio()` directly and call `engine.onStateChange()`.
- Per-page variant theming via `$page.url.pathname` (just compute the variant string in the component's script).
- SvelteKit's `+page.ts` `load` function for server-side analytics — same pattern as Next.js / Nuxt: capture on client, POST to server route.

For the canonical Svelte API see [`docs/frameworks/svelte.md`](../../docs/frameworks/svelte.md).
