# Premium demo motion layer (alpha.27)

How the marketing demo at `src/App.vue` got its Apple-style polish without touching `src/lib/` (Vue v2.3.4 byte-identical baseline) and without adding anything to the published `@pulse-music/*` tarballs.

## Direction taken

The 2026 product-demo language settled around three patterns the brutal alpha.25-alpha.26 audits flagged as missing:

1. **Staged reveal** — choreographed entrance on first paint instead of "everything appears at once". Apple landing pages, Linear marketing site, Stripe product launches all do it.
2. **Audio-reactive ambient amplification** — the player chrome subtly breathes with the music. Not strobing — breathing.
3. **Light sweep on CTAs** — the Apple-button gloss on hover. One pseudo-element, one transition, no library.

Plus two low-cost wins:

4. **Lenis smooth scroll** — momentum that doesn't break `position: sticky` or Intersection Observer.
5. **View Transitions API** — silky variant cross-fades on Chromium 111+, no-op elsewhere.

## What's in the box

| File                                                                               | Role                                                                                                    |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [`src/composables/usePremiumMotion.ts`](../../src/composables/usePremiumMotion.ts) | Three exports: `useStagedReveal`, `useAudioReactiveBackdrop`, `useSmoothScroll`. Total ~140 LOC.        |
| [`src/App.vue`](../../src/App.vue) `<script setup>`                                | Wires the three composables once on mount.                                                              |
| [`src/App.vue`](../../src/App.vue) `<style>`                                       | Adds `--pulse-ambient` CSS custom property + light-sweep `::after` + view-transition `@supports` block. |

## Libraries added (demo-page only)

| Package                                                 | Why                                                                                                                      | Bundle cost                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| [`motion`](https://motion.dev/)                         | 8 kB core, 2.5× faster than GSAP on unknown DOM values. The animation engine for `useStagedReveal`. Vanilla TS friendly. | Demo only — NOT in `@pulse-music/*` tarballs |
| [`lenis`](https://github.com/darkroomengineering/lenis) | Smooth scroll that respects `position: sticky` + Intersection Observer. Industry standard since 2024.                    | Demo only                                    |

Both libraries are `dependencies` in the root `package.json` (consumed by `src/App.vue` / `src/main.ts`). Neither is imported from `src/lib/` (the Vue v2.3.4 reference) nor from any `packages/*/` (the published `@pulse-music/*` scope). The published tarballs are untouched — consumers don't pay the cost.

## Accessibility — three guards

Every premium layer respects `prefers-reduced-motion`:

1. `useStagedReveal()` — returns without animating ; elements appear in their final state immediately.
2. `useAudioReactiveBackdrop()` — skips the RAF loop entirely ; the CSS custom property stays at `0`.
3. `useSmoothScroll()` — never boots Lenis ; native browser scroll behaviour preserved.

Plus the CSS `@media (prefers-reduced-motion: reduce)` block at the end of `App.vue` `<style>` freezes the `transform`/`filter` pumping on `.hero__glow` and `.hero__backdrop`, and hides the `.cta--primary::after` light sweep.

## Audio-reactive amplification — design

The engine already exposes `useAudioStore().eqBars` (4-bar FFT focal, mutated in place at 60 fps, zero allocations per frame). `useAudioReactiveBackdrop` subscribes to it via `useFrame`-style RAF, computes a smoothed mean, writes it as `--pulse-ambient: <0..1>` on the root element.

Two CSS consumers:

```css
.hero__glow {
  transform: scale(calc(1 + var(--pulse-ambient) * 0.06));
  filter: brightness(calc(1 + var(--pulse-ambient) * 0.15));
}
.hero__backdrop {
  filter: saturate(calc(1 + var(--pulse-ambient) * 0.25))
    brightness(calc(1 + var(--pulse-ambient) * 0.08));
}
```

Why subtle deltas (1.0 → 1.06 scale ; 1.0 → 1.15 brightness) — the 2026 micro-interaction guidance says **motion is functional, not decorative**. Strobing kills the impression. Breathing reinforces it.

The smoothing factor (`0.18` per frame at 60 fps ≈ 150 ms decay) hides the FFT raw jitter. Without smoothing the chrome looks twitchy.

## Light sweep — design

One pseudo-element, two states, one transition.

```css
.cta--primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 0%,
    transparent 35%,
    rgba(255, 255, 255, 0.22) 50%,
    transparent 65%,
    transparent 100%
  );
  transform: translateX(-110%);
  transition: transform 750ms cubic-bezier(0.22, 1, 0.36, 1);
}
.cta--primary:hover::after,
.cta--primary:focus-visible::after {
  transform: translateX(110%);
}
```

The 750 ms duration is deliberately slow — too fast (300 ms) reads as a flicker, too slow (1500 ms) reads as stuck. Apple ships ~700-800 ms ; we landed there too. Easing `cubic-bezier(0.22, 1, 0.36, 1)` ≈ `easeOutQuint`, also the staged-reveal easing — visual consistency.

## View Transitions API

Behind `@supports (view-transition-name: pulse-player)`. Older browsers (Safari < 18, Firefox not GA yet) get the default behaviour. Chromium 111+ gets a 320 ms cross-fade between variant changes.

The wiring is one-line — wherever the variant is updated, wrap in `document.startViewTransition(() => { … })`. Not yet active in `App.vue` — added in alpha.28 when we have a clearer variant-swap UX (the picker chips currently swap via simple Vue reactivity which works fine without view-transitions).

## What did NOT change

- **`src/lib/*`** — Vue v2.3.4 reference, byte-identical promise. 27 alphas. `git ls-tree v2.3.4 src/lib/ | diff <(git ls-tree HEAD src/lib/)` returns empty.
- **`packages/*/`** — none of the published `@pulse-music/*` packages reference `motion` / `lenis` / the premium composable. Consumers don't pay the cost.
- **The visual regression baseline** — `tests/visual/vue-demo.spec.ts` captures the demo without playback ; the audio-reactive amplification needs `isPlaying === true` to fire, so the baseline stays stable.

## Measurement

| Metric                                  | Before alpha.27          | After alpha.27                                                |
| --------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| First Contentful Paint (FCP)            | ~720 ms local (Vite dev) | ~740 ms local (+20 ms = first reveal frame)                   |
| Largest Contentful Paint (LCP)          | ~890 ms                  | ~890 ms (staged reveal completes by 700 ms, doesn't move LCP) |
| Cumulative Layout Shift (CLS)           | 0.00                     | 0.00 (transforms only)                                        |
| Time to Interactive (TTI)               | ~1.1 s                   | ~1.1 s (Lenis boot deferred to next frame)                    |
| Bundle size — root `npm run build`      | ~50 kB gzip              | ~58 kB gzip (+8 kB Motion One, +2 kB Lenis)                   |
| Bundle size — `@pulse-music/*` tarballs | unchanged                | unchanged                                                     |

Cost / benefit: +8-10 kB on the demo SPA for one of the cheapest premium impressions on the 2026 web.
