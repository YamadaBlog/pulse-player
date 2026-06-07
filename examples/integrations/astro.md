# Pulse in Astro 4+

Astro is content-first — pages are static HTML by default with islands of interactivity. Pulse's Web Component (`<pulse-player>` from `@pulse/web-component`) fits this model naturally: declare the tag in an Astro page and Astro ships the Pulse runtime only on routes that include it.

## Install

```bash
npm install @pulse/web-component @pulse/core
```

You don't need a per-framework wrapper — Astro pages can render any Custom Element directly.

## The component island

`src/components/MusicPlayer.astro`:

```astro
---
// No JS here — this is a static template. Pulse's runtime loads
// from the client-side <script type="module"> block below.
---

<pulse-player
  variant="midnight"
  ambient-eq
  resizable
  github-url="https://github.com/your-org/your-repo"
></pulse-player>

<pulse-fab variant="vinyl" pulso draggable show-menu></pulse-fab>

<script>
  // The import is the side-effect call that registers <pulse-player>
  // and <pulse-fab> with the browser's Custom Elements registry.
  // Astro auto-bundles this into the client-side hydration script
  // and code-splits it per-page.
  import '@pulse/web-component'
</script>
```

## Use it from a page

`src/pages/index.astro`:

```astro
---
import Layout from '../layouts/Layout.astro'
import MusicPlayer from '../components/MusicPlayer.astro'
---

<Layout title="My Astro site">
  <main>
    <h1>My site</h1>
    <MusicPlayer />
  </main>
</Layout>
```

That's it. No `client:load`, no `client:visible` directive needed — the `<script>` block inside `MusicPlayer.astro` already gets bundled per Astro's island model.

## When to add a client directive

The Web Component itself doesn't need an Astro client directive — the `<script>` tag handles the runtime. But if you want to use a framework wrapper (e.g. `<PulsePlayer />` from `@pulse/react` inside an Astro `.astro` file), then:

```astro
---
import { PulsePlayer } from '@pulse/react'
---

<PulsePlayer client:load variant="midnight" ambientEq />
```

`client:load` ships the React runtime + the wrapper immediately. `client:visible` defers until the player scrolls into view (cheaper if your page has many islands).

## Persistent FAB

If you want the FAB to survive Astro's full-page transitions:

`src/layouts/Layout.astro`:

```astro
---
const { title } = Astro.props
---

<html lang="en">
  <head>
    <title>{title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <slot />

    <pulse-fab variant="vinyl" pulso draggable show-menu></pulse-fab>

    <script>
      import '@pulse/web-component'
    </script>
  </body>
</html>
```

If you use Astro's `<ViewTransitions />` API, the FAB respects it natively because it's a normal Custom Element — no extra wiring needed.

## Tested against

- Astro 4.x + 5.x
- Node 20 + 22

## What this snippet doesn't cover

- Per-collection theming (e.g. a different variant per blog category — compute the variant in the frontmatter, pass it as a prop).
- Multi-language audio sources (Astro's i18n routing + Pulse's `setAudioTracks()` work transparently together).
- Image optimisation for cover art — Astro's `<Image />` component works for static `cover` URLs; for dynamic playlists, pre-process the covers at build time.

For the canonical Web Component API see [`docs/frameworks/web-component.md`](../../docs/frameworks/web-component.md).
