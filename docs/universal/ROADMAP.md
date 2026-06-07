# Pulse Universal — Roadmap

How we go from the validated Vue v2.3.4 monolith to a true multi-framework library, without breaking anything along the way.

## Phase 0 — Scaffold (v3.0.0-alpha.0) ✅

Lays the monorepo foundation. **No code moved.** The v2.3.4 Vue codebase at `src/lib/` continues to work bit-for-bit identical.

What lands:

- `pnpm-workspace.yaml` + `npm workspaces` configuration in root `package.json`
- `turbo.json` for build orchestration (optional — installs only with `pnpm add -D turbo`)
- `packages/` with 9 scaffolds: `types`, `core`, `tokens`, `web-component`, `vue`, `react`, `react-native`, `angular`, `svelte`
- `@pulse/types` is the only package with real code in this alpha — it ships the shared TypeScript types (zero runtime, zero risk)
- `docs/universal/ARCHITECTURE.md`, `docs/universal/ROADMAP.md`, per-framework doc placeholders
- Vue demo + tests verified to still pass after the workspaces field is added

What doesn't land:

- Actual code migration. The Vue code stays at `src/lib/`.
- No new framework wrappers are implemented yet.
- No CI changes (existing matrix continues to gate `pulse-player` root package).

## Phase 1 — Extract core + tokens (v3.0.0-alpha.1)

- `@pulse/core` — port `src/lib/useAudioStore.ts` into a plain TypeScript `PulseEngine` class. Strip Vue refs / Pinia plumbing. Re-publish the same actions (`toggle`, `next`, `prev`, `loadTrack`, `seek`, `setAudioTracks`, `dispose`) and the typed event bus (`subscribe<E>`).
- `@pulse/tokens` — move `src/lib/shared/variants.css` here verbatim. Add `base.css` (the `--pulse-scale` system, shadows) and `animations.css` (the `@keyframes` from `MusicPlayer.vue` / `MiniPlayer.vue`).
- Add Vitest tests against `@pulse/core` (port the existing tests in `tests/useAudioStore.test.ts`).
- Validation gate: `@pulse/vue`'s `useAudioStore` continues to import from the local file (no change for the demo).

## Phase 2 — Web Component renderer (v3.0.0-alpha.2)

- `@pulse/web-component` — write the Lit-based `<pulse-player>` and `<pulse-fab>` Custom Elements. Markup, CSS variables, animations — all copied from the validated v2.3.4 MusicPlayer.vue / MiniPlayer.vue. Lit reactive controllers replace Vue refs.
- Set up Playwright visual regression: render the v2.3.4 demo, render an equivalent page built on `<pulse-player>`, diff at the pixel level. Goal: zero meaningful diff.
- Add browser support note: Lit needs Custom Elements v1 (every evergreen browser since 2018) + ES2019.

## Phase 3 — Vue refactor (v3.0.0-alpha.3)

- `@pulse/vue` becomes a thin adapter: `<MusicPlayer />` and `<MiniPlayer />` now embed `<pulse-player>` and `<pulse-fab>` from `@pulse/web-component` instead of owning their own template. `useAudioStore()` projects `@pulse/core`'s state into a Pinia store for API parity.
- Move `src/lib/*` into `packages/vue/src/` and update the import paths in the demo.
- Visual regression must show **zero pixel diff** against tagged v2.3.4. If anything moves, the refactor blocks until it's identical.
- v2.3.4 stays tagged on `main` so downstream users can pin to it during their own migration.

## Phase 4 — React (v3.0.0-alpha.4)

- `@pulse/react` — `<PulsePlayer />`, `<PulseFab />`, `usePulseAudio()`. ~80 LOC each.
- `apps/demo-react/` — equivalent of the Vue demo, same scenario, same scripted tour.
- Examples ported from `examples/` to `examples/react-*/`.

## Phase 5 — React Native (v3.0.0-alpha.5)

- `@pulse/react-native` — separate renderer using React Native primitives. Audio engine wraps `react-native-audio-api` (Swansion) for AnalyserNode compatibility.
- `apps/demo-react-native/` — Expo demo.
- Document feature parity matrix honestly. Drag-to-resize is dropped (no DOM resize concept on mobile native).

## Phase 6 — Public release (v3.0.0)

- All four primary wrappers stable: Vue, React, Web Components (direct), React Native.
- npm publish for every package under `@pulse/` scope.
- GitHub Pages docs site published.

## Phase 7 — Long tail (v3.1.x, v3.2.x)

- `@pulse/angular` (v3.1.0)
- `@pulse/svelte` (v3.1.0)
- `@pulse/solid` (v3.2.0)
- Future: Qwik, Lit re-export, vanilla JS examples.

## Non-goals (deliberately not pursued)

- Flutter / Swift / Kotlin native ports. The audio engine surface alone would take more effort than the rest of the project combined.
- A jQuery wrapper. The Custom Elements work directly in any DOM.
- A "no-build" CDN bundle. The library mode build already targets that use case (`<script type="module" src="https://unpkg.com/@pulse/web-component">`).

## Why this sequence

Each phase ships a **shippable artefact** without breaking previous phases:

- The Vue demo continues to render identically through phases 0–3 because the visual regression gate enforces zero diff.
- Each new framework wrapper is additive — it doesn't touch the others.
- React Native is last among the primary targets because its renderer is the most foreign, and waiting until everything else is stable means we can borrow architecture patterns from the other wrappers.
