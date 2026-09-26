# Getting started

## Install

Pick the package for your stack — each one brings the Web Components and the engine along:

| Stack                                    | Install                            |
| ---------------------------------------- | ---------------------------------- |
| Plain HTML, Angular, Astro, Solid, Qwik… | `npm i @pulse-music/web-component` |
| Vue 3                                    | `npm i @pulse-music/vue`           |
| React 18 / 19                            | `npm i @pulse-music/react`         |
| Svelte 4 / 5                             | `npm i @pulse-music/svelte`        |

No build step? Load it from a CDN — see [vanilla-cdn.md](./integrations/vanilla-cdn.md).

The packages are ESM-only and target evergreen browsers (last two versions of Chrome, Edge, Firefox, Safari).

## Your first player

```html
<script type="module">
  import '@pulse-music/web-component'
</script>

<pulse-player>
  <pulse-track
    src="/audio/intro.mp3"
    title="Intro"
    artist="You"
    cover="/covers/intro.jpg"
  ></pulse-track>
  <pulse-track src="/audio/outro.mp3" title="Outro" artist="You"></pulse-track>
</pulse-player>
```

That's it: a themed, keyboard-accessible player with a live equaliser. The card takes the width of its container — try it in a sidebar, then in a hero.

## Playlists

Three equivalent ways to set the tracks — use whichever fits:

```html
<!-- 1. Markup -->
<pulse-player><pulse-track src="/a.mp3" title="A"></pulse-track></pulse-player>
```

```js
// 2. The element property
document.querySelector('pulse-player').tracks = [{ title: 'A', src: '/a.mp3' }]

// 3. The engine, once for the whole page
import { getSharedEngine } from '@pulse-music/web-component'
getSharedEngine().setTracks([{ title: 'A', src: '/a.mp3' }])
```

A `Track` is `{ title, src, artist?, album?, cover?, coverPos?, coverScale? }`. Without a `cover`, the player draws a gradient derived from the title.

## One session, many players

Every player on the page shares one audio session by default. Put a compact player in your header, a big one on the album page and the floating `<pulse-fab>` at the root of your app: they all control the same music, and playback survives client-side route changes as long as the page isn't reloaded.

```html
<pulse-fab></pulse-fab>
<!-- appears once music starts -->
```

Need independent streams? Use named sessions: `<pulse-player session="podcast">`. See [sessions](./reference/elements.md#sessions).

## Reacting to playback

```js
const player = document.querySelector('pulse-player')
player.addEventListener('pulse-trackchange', (e) =>
  console.log('now playing', e.detail.track.title),
)
```

Or at page level, independent of any element:

```js
import { getSharedEngine } from '@pulse-music/web-component'
getSharedEngine().subscribe('play', ({ track }) => analytics.track('play', { title: track.title }))
```

## Server-side rendering

Importing any Pulse package on the server is safe: nothing touches `window` or `document` at module load, and the elements upgrade on the client. Players render nothing meaningful until hydration, so reserve space if layout shift matters:

```css
pulse-player:not(:defined) {
  display: block;
  min-height: 132px;
}
```

Framework-specific notes: [Next.js](./integrations/next-app-router.md) · [Nuxt](./integrations/nuxt.md) · [SvelteKit](./integrations/sveltekit.md) · [Astro](./integrations/astro.md).

## Autoplay

Browsers only allow sound after a user gesture. Call `play()` from a click (the built-in buttons do). If a programmatic `play()` is refused, the player rolls back to paused and fires `pulse-error` with `reason: 'play-rejected'` — show a hint and let the user press play.

## Next steps

- [Web Components reference](./reference/elements.md) — every attribute, event, slot and CSS hook
- [Theming](./theming.md) — variants, accent colours and custom styles
- [Frameworks](./frameworks.md) — Vue, React, Svelte and Angular specifics
