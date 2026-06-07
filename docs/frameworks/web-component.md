# Pulse Web Component (`@pulse/web-component`)

Universal Custom Elements. The renderer every framework wrapper consumes.

> ✅ **Honest status (v3.0.0-alpha.10):** `<pulse-player>` and `<pulse-fab>` are real Lit elements that work in every modern framework. **Chrome parity vs Vue v2.3.4 is ~95 %**. Working today: play / pause, title, cover art, progress bar, time read-out, 8 mood variants, **ambient EQ**, **pulso heartbeat**, **`--pulse-scale` ResizeObserver** (container-aware), three responsive states (220 / 130 / 110 thresholds), prev / next ghost buttons, **real GitHub + Spotify SVG icons** (linkable via `github-url` / `spotify-url`), `data-fab` morph state, `mp__bg` blur backdrop, `mp__noise` SVG noise overlay, **drag-to-resize handle** (`resizable`), **FAB drag-to-reposition** with `localStorage` persist (`draggable` + `persist-key`), **FAB radial menu** (palette + Pulso/Fullscreen toggles, `show-menu`), **fullscreen API**, **keyboard shortcuts** (Space/K toggle, J/← prev, L/→ next), `prefers-reduced-motion` guard. **Not implemented (deliberately):** the v2.3.4 guided demo tour — it's a `App.vue` consumer concern, not a library primitive. If you need the guided tour, use the Vue version; if you want the library chrome, every wrapper works.

## Status

⏳ **Implementation lands in v3.0.0-alpha.2.**

## Planned API

```html
<!-- ES module, no framework required -->
<script type="module" src="https://unpkg.com/@pulse/web-component"></script>

<pulse-player variant="midnight" ambient-eq accent-color="#8B5CF6"></pulse-player>
<pulse-fab variant="vinyl" pulso></pulse-fab>
```

```ts
const player = document.querySelector('pulse-player')!
player.addEventListener('pulse-play', (e) => {
  const { track, time } = (e as CustomEvent).detail
  console.log('playing', track.title, time)
})
```

Works natively in:

- **React 19+** — native Custom Elements support, no wrapper needed
- **Vue 3** — same
- **Angular 17+** — `CUSTOM_ELEMENTS_SCHEMA`
- **Svelte 5** — native DOM, works out of the box
- **Solid** — same as React
- **Astro**, **Qwik** — partial hydration works because Custom Elements upgrade lazily
- **Vanilla HTML**, **plain JS**, **Lit** — direct usage

## Why Custom Elements

W3C standard, no framework lock-in. A bug fix in `@pulse/web-component` ships to every consumer simultaneously. New frameworks need only a ~50-LOC adapter, not a full re-implementation.

## See also

- [Architecture](../universal/ARCHITECTURE.md)
- [Lit documentation](https://lit.dev/)
