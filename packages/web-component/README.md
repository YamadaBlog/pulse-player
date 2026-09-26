# @pulse-music/web-component

The Pulse music player as standard Custom Elements — `<pulse-player>`, `<pulse-fab>` and `<pulse-track>`. Works in plain HTML and every framework that renders to the DOM.

```bash
npm i @pulse-music/web-component
```

```html
<script type="module">
  import '@pulse-music/web-component'
</script>

<pulse-player variant="auto" ambient-eq>
  <pulse-track
    src="/song.mp3"
    title="Projector Screen"
    artist="HoliznaCC0"
    cover="/cover.jpg"
  ></pulse-track>
</pulse-player>

<pulse-fab></pulse-fab>
```

- Container-aware layout: full card → compact → round disc, driven by CSS container queries
- Nine themes, accent colours, CSS custom properties, `::part()` and `:state()` hooks
- Live FFT equaliser, cover-sampled accent, spring micro-interactions — all off under reduced motion
- Keyboard shortcuts, accessible seek slider, Media Session (OS media keys, lock screen)
- SSR-safe import, ~23 kB brotli including Lit and the engine
- Ships a [Custom Elements Manifest](./custom-elements.json) for editor tooling

**Docs:** [element reference](https://github.com/YamadaBlog/pulse-player/blob/main/docs/reference/elements.md) · [getting started](https://github.com/YamadaBlog/pulse-player/blob/main/docs/getting-started.md) · [live demo](https://yamadablog.github.io/pulse-player/)

MIT © YamadaBlog
