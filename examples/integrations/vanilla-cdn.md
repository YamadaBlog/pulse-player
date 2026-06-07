# Pulse in Vanilla HTML via CDN

The fastest possible Pulse integration — one HTML file, one `<script type="module">` line, no build step at all. Good for prototypes, CodePen demos, presentation slides, and any static site (Jekyll / Hugo / Eleventy) where you don't want to introduce a JS toolchain just for an audio widget.

## The single file

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My audio prototype</title>
    <script type="module" src="https://unpkg.com/@pulse/web-component@latest"></script>
  </head>
  <body>
    <h1>Listen to this</h1>

    <pulse-player variant="midnight" ambient-eq resizable></pulse-player>

    <pulse-fab variant="vinyl" pulso draggable show-menu></pulse-fab>
  </body>
</html>
```

Open the file in any modern browser. Both Custom Elements register, the audio engine boots on the first interaction, the chrome renders. No `npm install`, no `node_modules`, no Vite, no Webpack.

## Why this works

- `<script type="module">` loads ES modules natively in every browser shipped after 2019.
- unpkg.com mirrors every published npm package at `https://unpkg.com/<package>@<version>`. We use `@latest` for prototypes; for production, pin to a specific version so an upstream patch doesn't change your demo overnight.
- `@pulse/web-component` is the package that ships the Custom Elements. Its only runtime dependency is Lit, which unpkg resolves transitively — you don't need to install Lit yourself.

## Pin the version (production-safe)

```html
<script type="module" src="https://unpkg.com/@pulse/web-component@3.0.0-rc.0"></script>
```

Pinning is the difference between "my prototype broke because they shipped a patch" and "my prototype works exactly as I left it 6 months ago".

## Use your own audio + cover

The shipped demo playlist won't work in your prototype if you load Pulse from a CDN — the cover + audio assets are bundled relative to the dev demo's path. Pass your own:

```html
<pulse-player id="player" variant="midnight" ambient-eq></pulse-player>

<script type="module">
  import '@pulse/web-component'

  const player = document.querySelector('#player')
  player.tracks = [
    {
      title: 'My track',
      artist: 'My name',
      src: 'https://my-cdn.example.com/audio/track.webm',
      cover: 'https://my-cdn.example.com/covers/track.webp',
    },
  ]
</script>
```

Setting `tracks` as a JS array on the element is the documented way to supply a playlist — HTML attributes can't carry array values.

## CSS theming

To override the accent colour:

```html
<style>
  pulse-player,
  pulse-fab {
    --pulse-accent: #ff0080;
  }
</style>
```

Every Pulse CSS variable is documented in [`docs/CUSTOMIZATION.md`](../../docs/CUSTOMIZATION.md). The Shadow DOM root accepts inherited custom properties — set them on the host element (or any ancestor) and they cascade in.

## CodePen / JSFiddle / StackBlitz template

Copy the single file above into a new pen. Pulse is live in your browser within ~2 seconds (unpkg cold-start latency + Lit cold-cache).

For a saved StackBlitz workspace template, see [`docs/universal/SANDBOXES.md`](../../docs/universal/SANDBOXES.md) — those links will go live once `@pulse/*` is published to npm.

## Tested against

- Chromium 110+ (every Chrome / Edge / Brave / Arc / Opera since early 2023)
- Firefox 115+
- Safari 17+ (16+ works with the `webkitAudioContext` fallback Pulse ships transparently)

## What this snippet doesn't cover

- HMR or build-time tree-shaking — you ship the whole `@pulse/web-component` bundle (~50 kB gzip including Lit). Acceptable for a prototype; for production, use Vite / Astro / Next.

For the canonical Web Component API see [`docs/frameworks/web-component.md`](../../docs/frameworks/web-component.md).
