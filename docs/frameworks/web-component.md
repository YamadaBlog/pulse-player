# Pulse Web Component (`@pulse/web-component`)

Universal Custom Elements. The renderer every framework wrapper consumes.

> ⚠️ **Honest status (v3.0.0-alpha.3):** `<pulse-player>` and `<pulse-fab>` are real Lit elements that work in every modern framework. **But the chrome is a SKELETON** — about 15 % of the Vue v2.3.4 reference's feature set. Working today: play / pause, title, cover art, progress bar, time read-out, 8 mood variants, ambient EQ + pulso heartbeat (added in alpha.4). **Not yet implemented:** drag-to-resize, three responsive states (220 / 130 / 110 thresholds), social icons, prev / next on the inline card, FAB drag-to-reposition, FAB radial menu, fullscreen FAB chrome, `mp__bg` blur backdrop, `mp__noise` SVG filter. Read this page as a forward-looking spec and the [CHANGELOG](../../CHANGELOG.md) for what shipped per alpha. If you need the full premium chrome today, use **`pulse-player` (Vue, v2.3.4)** instead.

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
