# Architecture

```
                 @pulse-music/types        shared data contract (Track, PulseState, events)
                        │
        ┌───────────────┼────────────────┐
        │               │                │
 @pulse-music/core   @pulse-music/tokens │     engine · design tokens
        │               │                │
        └──────┬────────┘                │
               │                         │
   @pulse-music/web-component            │     <pulse-player> <pulse-fab> <pulse-track> (Lit)
               │                         │
   ┌───────────┼────────────┐            │
   │           │            │            │
 vue         react        svelte    @pulse-music/react-native (separate native renderer)

 Angular, Astro, Solid, plain HTML → the Custom Elements directly
```

## Principles

**One engine.** `PulseEngine` owns the `<audio>` element, the Web Audio graph, the Media Session bridge and an immutable state snapshot. The element is the source of truth: the engine listens to its native events, so anything that pauses playback — OS media keys, a headset, another tab's policy — is reflected everywhere.

**One renderer.** The UI is a single Lit implementation. Framework packages never re-implement chrome; they map framework conventions (props, events, reactivity) onto the elements and the engine. A fix lands once and reaches every framework.

**CSS does the layout.** The player is a size container; its layout tiers and fluid scale come from container queries and `cqi` units, not from JavaScript measuring. Script only runs for what CSS can't do: audio, the visualiser and gestures.

**Idle means idle.** The visualiser is one shared `requestAnimationFrame` loop that runs only while audio plays, only for players that are on screen, and never under reduced motion. Paused players cost nothing per frame.

## Packages

| Package                  | Responsibility                                            | Depends on                       |
| ------------------------ | --------------------------------------------------------- | -------------------------------- |
| `types`                  | `Track`, `PulseState`, `EventMap`, `AudioFrame`, variants | —                                |
| `core`                   | Engine, sessions, formatting                              | `types`                          |
| `tokens`                 | Theme and motion tokens as data + CSS generators          | `types`                          |
| `web-component`          | The elements, styles, controllers                         | `core`, `tokens`, `types`, `lit` |
| `vue`, `react`, `svelte` | Framework bindings                                        | `web-component`, `core`, `types` |
| `react-native`           | Native renderer (experimental, released separately)       | `types`                          |

## Repository layout

```
packages/        published libraries (+ test-utils, private)
apps/site        the showcase deployed to GitHub Pages (Astro, dogfoods the elements and @pulse-music/vue)
apps/demo-*      minimal React, Svelte and plain-HTML apps; demo-vanilla/lab.html is the component lab
e2e/             Playwright + axe-core tests for the site and the lab
scripts/         package checks, consumer smoke test, asset provenance check
docs/            this documentation
```

## Quality gates

Every pull request runs formatting, ESLint, type checks, 120+ unit tests (Vitest, happy-dom) with coverage thresholds, publint and are-the-types-wrong on every package, bundle-size budgets, an asset-licence check, a _real consumer_ test (packed tarballs installed outside the monorepo, imported on the server and built with Vite), end-to-end and accessibility tests in Chromium, and CodeQL. The deployed site is smoke-tested after every deploy.
