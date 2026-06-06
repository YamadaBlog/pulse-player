# Guided demo tour

[← back to README](../README.md)

Pulse ships with a **Watch demo** button on the landing page. Click it and the page enters fullscreen (when the browser allows it), the music starts, the page guides itself through every feature, and a discreet floating control pill at the bottom lets the viewer scrub between steps or stop at any time.

## What it looks like

When the tour is running you get two on-screen elements only:

1. A **Netflix-style subtitle** anchored ~36 px above the bottom of the viewport. No background, just clean white type with a soft shadow. Each step's message fades in / out as it changes.
2. A small **glass control pill** below it, holding:
   - **← Prev** arrow
   - **• • • ● • • • •** dot progress (the current step stretches into an accent-coloured bar)
   - **→ Next** arrow
   - **`5 / 10`** step counter
   - **■ Stop** button

The whole overlay is on `pointer-events: none` so the page stays clickable through it — only the pill's controls intercept clicks.

## Anatomy

| Piece | Where |
|---|---|
| Composable | [`src/composables/useDemoTour.ts`](../src/composables/useDemoTour.ts) — async/await timeline controller with a two-tier `AbortController` (tour-wide + per-step), `tween`, `scrollTo`, `delay`, `setMessage` helpers, plus `goToStep` / `next` / `prev` jump primitives. Zero dependencies. |
| Scenario | [`src/App.vue`](../src/App.vue) → `demoSteps` — ten declarative steps. |
| Overlay | `.demo-overlay` block in `src/App.vue` — subtitle caption + glass control pill. |
| Hero CTA | `cta--primary` "Watch demo" button in the hero. Disabled while the tour runs. |
| Fullscreen | `requestFullscreen()` is called on the document element when the tour starts and `exitFullscreen()` runs from the `onStop` cleanup. Both are best-effort: if the browser refuses (mobile Safari, embedded frames, some kiosks), the tour still runs without it. |

## Run it

Local dev:

```bash
npm run dev      # → http://localhost:5174
```

Open the page. Click **Watch demo** in the hero. The browser asks (or silently grants) fullscreen, the page scrolls itself, themes cycle, the ambient EQ lights up across every player, the drag-stage player resizes itself, the FAB slides to the centre of the viewport, vinyl and aurora variants are demoed, and pulso plays out. Click **Stop**, click a dot to jump steps, or use the arrows to step manually — all of it cleans up the same way.

## Scenario (10 steps, ~75 s)

| # | Title | What it shows |
|---|---|---|
| 1 | Welcome | Slow scroll-in on the hero, intro caption. |
| 2 | Press play | Starts audio so the FFT bars come alive. |
| 3 | Container-aware | **Short.** One tap on the `S` size preset on "Resize it. Everything follows.", then back to `M`. ~5 s. |
| 4 | Drag-to-resize | **The real resize show.** Scrolls slow to "Grab the corner. Resize it yourself.", flips ambient EQ on, then tweens the drag-stage player width 90 → 700 → 320 px with `outQuart` / `inOutQuart`. ~15 s. |
| 5 | Pick a mood | Slow scroll to the variants grid, two captions, ~7 s. |
| 6 | Floating FAB | A **boost** scroll (`speed: 'fast'`) down to the FAB section. |
| 7 | Drag anywhere | Tweens the FAB position from its corner to the centre of the viewport. |
| 8 | Vinyl & Aurora | Cycles `activeFabVariant` through `vinyl` → `aurora` (3.2 s each). |
| 9 | Pulso | Turns the heartbeat ripple on for ~5 s. |
| 10 | You're in | Glides the FAB back to its corner, slow scroll back to the hero, exits fullscreen. |

## Controls — `useDemoTour` API

```ts
const tour = useDemoTour()
tour.start(steps, { onStop: cleanupFn })   // run the timeline
tour.stop()                                 // abort cleanly, fire cleanup
tour.next()                                 // jump forward 1 step
tour.prev()                                 // jump back 1 step
tour.goToStep(4)                            // jump to step index 4
```

Reactive state: `isRunning`, `currentStep`, `totalSteps`, `title`, `message`, `progress`.

## Stop & Jump semantics

The controller maintains two `AbortController`s:

- **Tour-level** — aborted by `stop()`. The for-loop exits, `onStop` cleanup runs, the overlay disappears.
- **Step-level** — aborted by `goToStep` / `next` / `prev`. The current step's in-flight `delay` / `tween` / `scrollTo` reject with `AbortError`, the loop catches it, reads the pending jump index, and continues from there. The tour stays running.

If `next()` is called on the last step it ends the tour (same as Stop). All the helpers use `AbortSignal.any([tourSignal, stepSignal])` (with a polyfill fallback for browsers that don't ship it).

On stop, `onStop` restores the snapshot taken at the start of the tour — `userScale`, `heroVariant`, `heroAccent`, `activeFabVariant`, `fabPulso`, FAB visibility, and the new programmatic levers `tourDragWidth` and `tourFabPos`. Ambient EQ is kept on after a successful tour (it's the highlight) and restored to its pre-tour value if the user stopped early (`progress < 0.85`).

## Fullscreen handling

- `enterFullscreen()` calls `document.documentElement.requestFullscreen()` inside a try/catch. Any failure is silent — the demo carries on without it.
- The `restoreFromDemo` cleanup calls `exitFullscreen()` whether the tour ended naturally or was aborted, so you never get stuck in fullscreen.
- A `fullscreenchange` listener on `document` keeps `isFullscreen` accurate, in case the user hits `Esc` to leave fullscreen manually. The demo keeps running in that case — leaving fullscreen is treated as a user preference, not a stop signal.

## Adding a step

Open `src/App.vue`, find `demoSteps`, and insert a new entry anywhere in the array. A step is `{ title, run(ctx) }` where `run` is async.

```ts
const demoSteps: DemoStep[] = [
  // …existing steps…
  {
    title: 'My new step',
    run: async (ctx) => {
      ctx.setMessage('What this step shows.')
      await ctx.scrollTo('.my-section', { speed: 'slow' })
      await ctx.tween((v) => { mySliderRef.value = v }, 0, 100, 1200, 'outQuart')
      await ctx.delay(800)
    },
  },
]
```

`ctx` exposes:

- `signal` — the abort signal (combined tour + step). Every helper already respects it.
- `delay(ms)` — abortable `setTimeout`.
- `tween(setter, from, to, ms, easing?)` — abortable rAF tween. Default easing is `'outQuart'`.
- `scrollTo(selector | Element, { speed, easing, offset }?)` — abortable smooth scroll. `speed` is `'gentle' | 'fast' | 'slow'` (default `gentle`).
- `setMessage(string)` — updates the subtitle.

## Why a custom controller (and not driver.js / Shepherd.js / Intro.js)

Those libraries are excellent product-tour tooltips for SaaS onboarding — a list of DOM selectors with numbered tooltips and Next/Back buttons. This is a different shape: a **scripted timeline** coordinating Vue refs, audio state, smooth scroll, number tweens and a fullscreen request. A plain `async/await` loop is the right primitive:

- Zero deps. ~+2 kB gzip overhead instead of 10–25 kB.
- Direct Vue reactivity. No bridge between a third-party controller and refs.
- Clean abort via `AbortController`. Every helper rejects immediately on stop or jump.
- Steps are declarative — easy to read, easy to reorder, easy to add to.

## Known limits

- `prefers-reduced-motion` is **not yet wired** — the tweens currently ignore it. Easy follow-up: detect it in `useDemoTour` and snap setters to the final value instead of rAF-tweening.
- Fullscreen requests from a non-user-gesture context (e.g. programmatic re-trigger after Stop) will be refused by the browser — that's a Fullscreen API rule, not a bug.
- On very small viewports (under ~360 px), the pill collapses its label / counter / divider via the `@media (max-width: 640px)` rule. The dots stay tappable.
