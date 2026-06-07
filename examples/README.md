# Examples

Three ready-to-fork integrations covering the cases we get asked about
most often. Each example is **independent of the main repo's build** —
you can copy any folder out, run `npm install`, and use it directly.

| Example                                                          | Use case                                                                                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`01-vite-spa`](./01-vite-spa)                                   | The minimum drop-in: a Vite + Vue 3 + Pinia SPA with `<MusicPlayer />` in the page and `<MiniPlayer />` mounted at root. |
| [`02-custom-playlist`](./02-custom-playlist)                     | Swap the default playlist via `setAudioTracks()` before mount, render a custom controls strip.                          |
| [`03-event-subscriptions`](./03-event-subscriptions)             | Wire the opt-in event bus (`store.subscribe('play', …)`) into your analytics layer + show per-session counters.         |

Every example uses the **same `src/lib/`** as the main repo. If you
install pulse-player from npm (`npm i pulse-player`), the imports
become `import { … } from 'pulse-player'` — no other change.

## Running an example locally

```bash
# From the repo root, point any example at the lib build:
cd examples/01-vite-spa
npm install
npm run dev   # http://localhost:5175
```

The example reads its components from `../../src/lib/` so you can edit
the library and see the change live in the example tab.

## What each example is *not*

These are integration sketches, not production templates. They skip:

- routing, persistence, SSR
- a real CI / lint / test pipeline (the main repo has those — the
  examples deliberately stay minimal)
- a custom design system (the components use the default themes)

If you want a production starter, fork the main repo instead.
