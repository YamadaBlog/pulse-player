# Changelog

All notable changes to **pulse-player** are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Tags: every release listed below is pinned to a signed git tag of the same name (`vX.Y.Z`) and surfaced as a GitHub Release.

## Unreleased

Tracked separately in [the v2.0.0 audit branch](https://github.com/YamadaBlog/pulse-player/issues?q=is%3Aissue+label%3Av2.0.0).

## 3.0.0-alpha.1.1 — 2026-06-07

Tests for `@pulse/core`. 27 unit tests ported from the validated v2.3.4 `tests/useAudioStore.test.ts` (22) + 5 new tests for the PulseEngine-specific surface (`onStateChange`, `setAmbientEq`, idempotent `dispose`).

- `packages/core/vitest.config.ts` — jsdom env + `root` pinned to `packages/core/` so the include glob doesn't leak into the root Pinia tests.
- `packages/core/tests/setup.ts` — port of the v2.3.4 setup (StubAudioContext, StubAnalyserNode, rAF polyfill, HTMLMediaElement.play stub).
- `packages/core/tests/PulseEngine.test.ts` — covers initial state, `toggle()` counters + emit, `loadTrack` / `next` / `prev` + the 3-second prev boundary, `subscribe` lifecycle + crash isolation + double-unsubscribe noop, `open` / `close` / `fmt` / `progress` / `ambientEq` / `registerAmbientView`, `onStateChange`, `dispose` idempotence.
- Root `npm run test:core` script runs the package suite. `npm run ci` now gates on `test:packages` too.

Quality gate:

```
type-check       → clean
lint             → 0 errors, 0 warnings
tests (root)     → 33 / 33    (Vue Pinia store + useDemoTour)
tests (core)     → 27 / 27    (PulseEngine, NEW)
build (demo)    → 48 kB gzip
audit            → 0 vulnerabilities
v2.3.4 demo      → bit-for-bit identical
```

## 3.0.0-alpha.1 — 2026-06-07

`@pulse/core` and `@pulse/tokens` land with real code. **Vue v2.3.4 codebase at `src/lib/` is still untouched** — the audio engine is now reimplemented as a plain TypeScript class in parallel, and the validated Vue Pinia store keeps running the demo.

### `@pulse/core` — framework-agnostic audio engine

`packages/core/src/PulseEngine.ts` (~340 LOC) — the `useAudioStore.ts` audio engine, ported to a plain TypeScript class. No Vue refs, no Pinia, no framework imports. Same behaviour bit-for-bit:

- Singleton `<audio>` + AudioContext + AnalyserNode (FFT 256, smoothing 0.5).
- Safari `webkitAudioContext` fallback.
- 4-bar focal FFT mutated in place every rAF tick — zero allocations per frame.
- 32-bar ambient FFT exposed as a stable hook (no-op since v1.0.2; ambient EQ is pure CSS).
- `safePlay()` catches autoplay rejections, rolls UI state back, emits a typed `'error'` event with reason `'play-rejected'`.
- Typed event bus: `subscribe<'play' | 'pause' | 'trackchange' | 'error'>(event, cb)` returns an `Unsubscribe`. Listener errors are caught + logged so a bad consumer can't break the engine.
- Privacy-friendly per-session counters (`playCount`, `pauseCount`, `trackChangeCount`).
- `track` getter clamps to a valid index — calling `setAudioTracks([smallerList])` mid-playback can't crash consumers.
- `dispose()` tear-down for SPA shells.

Consumer model changes from "reactive store" → "imperative class + observer callbacks":

```ts
const engine = new PulseEngine(tracks)
const unsub = engine.onStateChange((state) => projectIntoVueRefs(state))
const offPlay = engine.subscribe('play', ({ track, time }) => {
  analytics.track('play', { id: track.title, time })
})
engine.toggle()
// ...later
unsub()
offPlay()
engine.dispose()
```

Framework wrappers (`@pulse/vue` once migrated, `@pulse/react`, `@pulse/svelte`, `@pulse/angular`, `@pulse/react-native`) each consume the class and project the state into their framework's reactivity primitive via `onStateChange()`.

### `@pulse/tokens` — CSS design tokens

Three real CSS files now ship in `packages/tokens/src/`:

- **`variants.css`** — verbatim copy of `src/lib/shared/variants.css` (the four mood gradients sunset / midnight / aurora / vinyl with their accent RGB triplets, declared on `[data-variant='X']` attribute selectors so the tokens cascade into any surface).
- **`base.css`** — the `--pulse-scale` system. One CSS variable propagating into 13 derived measurements (artwork, title, icons, padding, gaps, radii, shadows, EQ-bar geometry). Scoped to `[data-pulse-root]` so consumers explicitly opt in.
- **`animations.css`** — every `@keyframes` (`mp-ambient-wave`, `pulso-heartbeat`, `pulso-wave-lub`, `pulso-wave-dub`) extracted from MusicPlayer.vue + MiniPlayer.vue, with the same timing notes carried over (pulso cycle map, "waves emit at peaks, not before" comment). Includes the `prefers-reduced-motion` guard.

`@pulse/tokens` is imported as a side-effect from any web renderer.

### Tooling

- `packages/` and `apps/` workspace folders are now excluded from the root ESLint + Prettier ignore list. Each package gets its own lint config when it reaches alpha-ready status; until then the root toolchain keeps gating the validated Vue v2.3.4 codebase under `src/` only.
- `packages/core/tsconfig.json` + `packages/types/tsconfig.json` — minimal per-package configs that respect the workspace structure (`@pulse/types` path mapping).

### Vue v2.3.4 — unchanged

The validated Vue codebase at `src/lib/` is bit-for-bit identical. Quality gate confirms:

```
type-check    → clean
lint          → 0 errors, 0 warnings
format        → pass
tests         → 33 / 33
build (demo)  → 129 kB JS + 42 kB CSS → 48 kB gzip
build:lib     → ~14 kB gzip total
audit         → 0 vulnerabilities
v2.3.4 demo   → bit-for-bit identical, no behaviour change
```

### What's still ahead

- v3.0.0-alpha.2 → `@pulse/web-component` (Lit-based `<pulse-player>` + `<pulse-fab>`), Playwright visual regression vs the v2.3.4 demo.
- v3.0.0-alpha.3 → `@pulse/vue` migration (`src/lib/` → `packages/vue/`), refactored to wrap `@pulse/web-component`.
- v3.0.0-alpha.4 → `@pulse/react`.
- v3.0.0-alpha.5 → `@pulse/react-native`.
- v3.0.0 → stable, npm publish.

## 3.0.0-alpha.0 — 2026-06-07

First alpha of the multi-framework architecture. **No Vue code moved yet.** The validated `v2.3.4` codebase at `src/lib/` keeps shipping the `pulse-player` npm package bit-for-bit identical. This alpha lays the monorepo foundation around it.

What lands:

- **Monorepo enabled.** `pnpm-workspace.yaml`, `turbo.json`, and a `workspaces` field in the root `package.json`. Contributors can use pnpm, npm or yarn — the workspace layout is shared.
- **9 package scaffolds** under `packages/`:
  - `@pulse/types` — shared TypeScript types (real, ships now). `Track`, `PulseVariant`, `ALL_VARIANTS`, `EventMap`, `AudioEvent`, `EventListener<E>`, `Unsubscribe`, `PulseState`. Zero runtime, zero risk.
  - `@pulse/core` — framework-agnostic audio engine. SCAFFOLD; implementation in alpha.1.
  - `@pulse/tokens` — CSS variables, variant gradients, animation keyframes. SCAFFOLD; populated in alpha.1.
  - `@pulse/web-component` — Lit-based universal `<pulse-player>` / `<pulse-fab>`. SCAFFOLD; implementation in alpha.2.
  - `@pulse/vue` — Vue 3 wrapper. Pre-migration scaffold; the v2.3.4 code at `src/lib/` moves here in alpha.3 with a refactor to wrap the new web-component layer.
  - `@pulse/react` — React 18 / 19 wrapper. SCAFFOLD; alpha.4.
  - `@pulse/react-native` — RN implementation (separate renderer, no DOM). SCAFFOLD; alpha.5.
  - `@pulse/angular` — Angular 17+ wrapper. SCAFFOLD; v3.1.0.
  - `@pulse/svelte` — Svelte 5 wrapper. SCAFFOLD; v3.1.0.
- **Multi-framework documentation:**
  - `docs/universal/ARCHITECTURE.md` — dependency graph, package responsibilities, why the layered design.
  - `docs/universal/ROADMAP.md` — phase-by-phase migration plan (Phase 0 → Phase 7).
  - `docs/frameworks/{vue,react,react-native,web-component,angular,svelte}.md` — per-framework usage pages (forward-looking specs for the ones that haven't shipped yet).

What's **explicitly not** in this alpha:

- No code is moved out of `src/lib/`. The current Vue v2.3.4 implementation remains the validated reference and continues to be the package consumers install today (`pulse-player`, not `@pulse/*`).
- No new framework wrapper is functional yet. Every `@pulse/*` package other than `@pulse/types` is a scaffold with READMEs and stub `src/index.ts` files.
- No npm publishes yet. The `@pulse/*` namespace is reserved for v3.0.0 stable.
- The visual regression tests against the v2.3.4 Vue demo (which will gate the alpha.3 Vue refactor) land in alpha.2 alongside `@pulse/web-component`.

Quality gate after alpha.0 scaffold:

```
type-check    → clean
lint          → 0 errors, 0 warnings
format        → pass
tests         → 33 / 33
build (demo)  → 129 kB JS + 42 kB CSS → 48 kB gzip
build:lib     → ~14 kB gzip total
audit         → 0 vulnerabilities
```

The Vue v2.3.4 codebase is untouched. Visual rendering, ambient EQ behaviour, FAB drag, pulso, demo tour, spotlight system — all bit-for-bit identical to the tagged `v2.3.4`.

## 2.3.4 — 2026-06-07

**Fix / refactor** — closes the four code items the v2.3.2 audit flagged.

- `useDemoSpotlight`: scroll + resize handlers now coalesce into a single `requestAnimationFrame` callback. The previous implementation called `getBoundingClientRect()` on every wheel / touchmove tick — a forced layout per event. The rAF wrapper batches every pending re-aim into ONE rect read per frame, matching the browser's natural render cadence. Critical during the 6-second `inOutQuart` scroll tweens in steps 4 and 5.
- `useDemoSpotlight`: returned refs (`active`, `x`, `y`, `radius`, `soft`) are now `Readonly<Ref<…>>`. The composable writes; consumers read. Prevents accidental mutation from outside.
- `useDemoSpotlight`: dropped the dead `watch(active, …)` safety branch. The fallback path it covered is already handled by `focus()` itself, and the `window.innerWidth` read inside the watcher made the composable SSR-unsafe for no benefit.
- `.demo-spotlight` mask comment in `src/App.vue` now honestly describes the asymmetric feather (1.5 × soft, biased toward the dim side) and explains why the asymmetry is intentional (tight clear edge, longer fade into dim). Previous comment claimed a `soft`-wide feather, which was a lie.

**Docs** — `docs/DEMO.md` gains a "Multi-step spotlight" section covering the composable API, the CSS plumbing (`@property` registration + `mask: radial-gradient`), browser support, and a per-step wiring example.

## 2.3.3 — 2026-06-07

**Fix** — Cover artwork no longer lags during the demo's scripted resize. v1.0.0 added a `body.tour-running .mp__art { transition-duration: 0.55s !important }` override; v1.0.8 then tightened the native `.mp__art` transition to 0.30 s but forgot to update the tour override. The artwork was therefore almost 2× slower during the demo than during manual drag — visible as the image continuing to resize for ~250 ms after the wrapper had settled. The override is gone; the artwork falls back to its native 0.30 s in both paths.

## 2.3.2 — 2026-06-07

**Fix** — Demo steps 3 (Container-aware) and 4 (Drag-to-resize) now frame the **whole** section instead of just the inner stage. Both `<section>` elements gained `id="section-resize"` and `id="section-drag"`; the scroll + spotlight retarget to the section parent with `offset: window.innerHeight * 0.08`, so the heading + description + stage all stay in frame.

## 2.3.1 — 2026-06-07

**Fix** — Spotlight overlay now cuts a TRUE hole at the focused target via CSS `mask`. v2.3.0 used a `radial-gradient` background that went transparent in the centre — visually correct for the dim layer, but `backdrop-filter: blur(2px)` still applied across the entire element, so the focused target was blurred too. The overlay now has a uniform dim + a `mask` that makes the target region literally not render. Step 9 (Pulso) plays its double-thump TWICE in a row instead of once, so the user sees the four heartbeat ripples and can count along with the caption.

## 2.3.0 — 2026-06-07

**Feat** — Multi-step demo spotlight (`useDemoSpotlight` composable). Every demo step now aims the overlay at its own element via reactive CSS variables registered with `@property`; transitions between targets interpolate on the GPU compositor. `prefers-reduced-motion` honoured.

**Refactor** — `src/lib/shared/variants.css` (audit P2 #8). The four mood gradients (sunset / midnight / aurora / vinyl) and their accent RGB triplets now live in one shared module, exposed as CSS variables on `[data-variant='X']`. MusicPlayer and MiniPlayer reference the same source.

## 1.0.12 — 2026-06-07

**Fix** — Spotlight blur stays active during the Pulso demo step (the toggle is lifted above the spotlight via z-index, the same way the FAB is). Boost scroll to the FAB section is 1.5× slower (`outQuint`, distance-aware), so the transition between "Pick a mood" and "Floating FAB" reads cleanly.

## 1.0.11 — 2026-06-07

**UX** — `Options` divider between the variant colour chips and the action buttons (`Show FAB` / `Hide FAB` / `Pulso`) in the FAB section.

## 1.0.10 — 2026-06-07

**Fix** — `.resize-stage` and `.drag-stage` now have a stable `min-width: 680px; min-height: 233px;` baseline. The stages never shrink below those dimensions when the inline player goes compact / FAB, but they still grow past the baseline when the player is dragged or sized larger.

## 1.0.9 — 2026-06-07

**Fix** — Pick-a-mood framing tightened. The first row anchors so its bottom sits at 85 % of the viewport (whole row readable). The descent stops where the `Pick a mood.` heading is still fully visible — title never disappears.

## 1.0.8 — 2026-06-07

**Fix** — Pick-a-mood lands with the section header and description visible, only the top edge of row 1 peeking. `mp__art` resize transition shortened to 300 ms so the artwork lands a touch ahead of the wrapper.

## 1.0.7 — 2026-06-07

**Fix** — Single continuous `inOutCubic` tween from start to end for the Pick-a-mood descent: no more velocity discontinuity at the handoff between `scrollTo` and the linear tween, no sub-pixel jitter.

## 1.0.6 — 2026-06-07

**Fix** — Pulso waves now emerge AT the heartbeat thump peaks (300 ms drift removed). Maximum opacity nudged to 0.45 for a cleaner "pop", maximum scale 1.6.

## 1.0.5 — 2026-06-07

**Fix** — Bullet-proof pulso centring: `box-sizing: border-box` on the pseudo-elements plus `top: 50% / left: 50%` anchoring (no more 1.5 px right-down drift). Demo step 9 surfaces the Pulso toggle with a one-shot green wave indicator.

## 1.0.4 — 2026-06-07

**Fix** — Pulso rings actually centred on the FAB after pinning `.fab` to `--fab-size`. Pick-a-mood now slow-descends the gallery instead of holding on row 1.

## 1.0.3 — 2026-06-07

**Perf** — Ambient EQ compositor cost capped: 12 bars (down from 32), 2.6 s cycle (up from 1.7 s), single GPU layer per `.mp__ambient` via `transform: translateZ(0)`.

## 1.0.2 — 2026-06-07

**Perf** — Ambient EQ rewritten as a pure-CSS `@keyframes` animation: zero JS per frame, zero Vue patches per frame, zero reactive broadcasts. The 64-bin FFT pipeline retired in favour of a shared compositor animation.

## 1.0.1 — 2026-06-07

**Perf** — Dropped `will-change: transform` from the ambient EQ bars (had been creating ~960 dedicated compositor layers on the demo page). Tightened the transition to 50 ms. IntersectionObserver gated the FFT compute on visibility.

## 1.0.0 — 2026-06-07

**Major** — Production-ready release.

- CI matrix (Node 18 / 20 / 22 on ubuntu-latest) covering type-check → lint → format → test → build → audit.
- ESLint flat config + Prettier + Husky pre-commit + lint-staged.
- Vitest setup with 30 unit tests (`useAudioStore` and `useDemoTour` covered; stubs for AudioContext / ResizeObserver / requestAnimationFrame).
- Shared `PulseVariant` type module — single source of truth for the variant union (no more drift between `MusicPlayer` and `MiniPlayer`).
- `CONTRIBUTING.md` with the full quality-gate definition + commit-style cheat sheet.
- npm-publish-ready `package.json` (exports map, peer dependencies, `files` allowlist, `sideEffects` declaration).

## 0.14.0 — 2026-06-06

**Feat** — Opt-in event bus (`store.subscribe(event, callback)` with `play` / `pause` / `trackchange`) + privacy-friendly per-session counters (`playCount`, `pauseCount`, `trackChangeCount`). No third-party tracking, no network calls in the default code path. Documentation overhaul (`docs/API.md`, `docs/EVENTS.md`, refreshed `docs/RESPONSIVE.md`, retired the redundant `docs/USAGE.md`).

## 0.13.0 — 2026-06-06

**Hardening** — Audit-driven cleanup. Cancellable rAF EQ loop tied to play state. `prefers-reduced-motion` honoured across CSS + demo tour. `webkitAudioContext` Safari fallback. `ResizeObserver` feature-test. Zero-allocation EQ (`shallowRef` + `triggerRef`). `longPressTimer` cleared on `MiniPlayer` unmount. `AMBIENT_BAR_STYLES` hoisted to module level.

## 0.12.x — 2026-06-06

EQ bars GPU-composited (`transform: scaleY()` + `contain: layout style paint`). Demo tour gains Pause / Resume + per-step jump + true centred FAB drag + fit-content stages.

## 0.11.x — 2026-06-06

Guided demo tour ("Watch demo") with sticky pill controls and fullscreen. Pick-a-mood section + Vinyl/Aurora FAB showcase.

## 0.10.x — 2026-06-06

`ambientEq` global toggle on the store. 64-bar Spotify-style ambient visualiser. EQ bars locked to Spotify green for brand consistency.

## 0.9.x — 2026-06-06

Resize handle (mouse + touch + stylus) on `MusicPlayer`. Drag-to-resize. FAB transformation at 110 px. Three-threshold morph (narrow / compact / FAB).

## 0.8.x — 2026-06-06

Pulso heartbeat ripple around the FAB (only while audio is playing). Subtle radial waves with reduced-motion gate.

## 0.7.x — 2026-06-06

Noise grain overlay across every variant. `auto` cover-blur backdrop. Resize handle pointer-events. FAB drag persistence to `localStorage`.

## 0.6.0 — 2026-06-06

Transparent variant restored with the original dashboard gradient + noise. Clean element-level screenshots (no browser chrome).

## 0.5.0 — 2026-06-06

Compact mode (< 240 px) — the player collapses gracefully while staying usable. Slim product README. Docs split.

## 0.4.0 — 2026-06-06

Mermaid architecture diagram. Premium product README.

## 0.3.x — 2026-06-06

`--pulse-scale` system. `ResizeObserver` auto-scale. Interactive size slider.

## 0.2.x — 2026-06-06

Variant system (9 themes). ResizeObserver-driven responsive design. First screenshots.

## 0.1.0 — 2026-06-06

Initial release.
