# Guided demo tour

[← back to README](../README.md)

Pulse ships with a **Watch demo** button on the landing page. It plays a ~50-second scripted tour that walks visitors through the whole component — audio, responsive scaling, the nine themes, the global ambient EQ, the floating FAB and the pulso effect — without them needing to know what to click.

## Anatomy

| Piece | Where |
|---|---|
| Composable | [`src/composables/useDemoTour.ts`](../src/composables/useDemoTour.ts) — async/await timeline controller with an `AbortController`, `tween`, `scrollTo`, `delay` and `setMessage` helpers. Zero dependencies. |
| Scenario | [`src/App.vue`](../src/App.vue) → `demoSteps` — seven declarative steps, each an async function receiving the helpers. |
| Banner | `<Transition name="demo-banner">` in `src/App.vue` — sticky top, blurred backdrop, caption, step counter, progress bar, **Stop** button. |
| Hero CTA | `cta--primary` "Watch demo" button in the hero section. Disabled while the tour runs. |

## Run it

Local dev:

```bash
npm run dev      # → http://localhost:5174
```

Open the page. Click **Watch demo** in the hero. The banner slides down, the page scrolls itself, the player resizes, themes cycle, the ambient EQ lights up and the FAB demonstrates pulso. Click **Stop** at any point.

## Scenario (7 steps, ~50 s)

| # | Title | What it shows |
|---|---|---|
| 1 | Welcome | Hero focus + intro caption |
| 2 | Press play | Starts audio so the FFT bars come alive |
| 3 | Responsive scaling | Tweens the `--pulse-scale` slider 1.0 → 0.75 → 1.7 → 1.0 |
| 4 | Themes | Cycles `auto → midnight → sunset → aurora → vinyl → auto` on the hero player |
| 5 | Ambient EQ | Flips `store.ambientEq = true` — 64 spectrum-coloured bars on every player |
| 6 | Floating FAB | Scrolls to the FAB section and flips `pulso` on/off |
| 7 | You're in | Returns to the hero and invites the user to explore |

## Why a custom controller (and not driver.js / Shepherd.js / Intro.js)

Those libraries are excellent product-tour tooltips for SaaS onboarding. They expect a list of DOM selectors and attach numbered tooltips with Next/Back buttons. This demo is a different shape — it's a **scripted timeline** that coordinates Vue refs, audio state, smooth scroll, and number tweens. A plain `async/await` loop is the right primitive:

- Zero dependencies → ~+1 kB gzip overhead instead of 10–25 kB.
- Direct Vue reactivity — no need to bridge a third-party controller back into refs.
- Clean abort via `AbortController` — every helper (`delay`, `tween`, `scrollTo`) respects the signal and rejects immediately on `Stop`.
- Steps are declarative, easy to read and easy to reorder.

## Adding a step

Open `src/App.vue`, find `demoSteps`, and append a new entry. A step is `{ title, run }` where `run(ctx)` is an async function.

```ts
const demoSteps: DemoStep[] = [
  // …existing steps…
  {
    title: 'My new step',
    run: async (ctx) => {
      ctx.setMessage('What this step shows.')
      await ctx.scrollTo('.my-section')
      await ctx.tween((v) => { mySliderRef.value = v }, 0, 100, 1200)
      await ctx.delay(800)
    },
  },
]
```

`ctx` exposes:

- `signal` — the `AbortSignal`; every helper already respects it. If your step does its own async work, check `signal.aborted` before mutating refs.
- `delay(ms)` — abortable `setTimeout`.
- `tween(setter, from, to, duration, easing?)` — abortable rAF-driven number tween. Default easing is `cubic-in-out`.
- `scrollTo(selector | Element)` — abortable smooth scroll.
- `setMessage(string)` — caption shown in the banner.

## Stop behaviour

`Stop` calls `controller.abort()`. The current step's awaited helper rejects with `AbortError`, the for-loop exits, and the `finally` block fires the `onStop` cleanup registered when the tour started.

In this demo, cleanup restores:

- `userScale` → pre-demo value
- `heroVariant` + `heroAccent` → pre-demo
- `store.ambientEq` → off (unless the user was already past the ambient step — heuristic on `progress`)
- `fabPulso` → off
- `store.close()` → only if FAB wasn't visible before the tour

Audio is left in whatever state the user reached — pausing it on stop felt punitive.

## Disabling the demo

If you fork pulse-player into a project where you don't want the guided tour, just delete the `cta--primary` button and the `<Transition name="demo-banner">…</Transition>` block from `src/App.vue`. The `useDemoTour` composable can stay or be removed — it has no side effects on import.

## Known limits

- The tour assumes the page is mounted at scroll position 0 when it starts. If the user scrolled deep before clicking **Watch demo**, the first scroll-to is a long way up — still smooth, just a little longer.
- Mobile viewports under ~480 px get a more compact banner (caption wraps, step counter is hidden). The tour still runs.
- `prefers-reduced-motion` is **not yet wired** — the tweens currently ignore it. Easy follow-up: detect it in `useDemoTour` and snap setters to the final value instead of running the rAF loop.
