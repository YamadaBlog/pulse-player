# Changelog

All notable changes to **pulse-player** are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Tags: every release listed below is pinned to a signed git tag of the same name (`vX.Y.Z`) and surfaced as a GitHub Release.

## Unreleased

Tracked separately in [the v2.0.0 audit branch](https://github.com/YamadaBlog/pulse-player/issues?q=is%3Aissue+label%3Av2.0.0).

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
