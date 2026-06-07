# Changelog

All notable changes to **pulse-player** are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Tags: every release listed below is pinned to a signed git tag of the same name (`vX.Y.Z`) and surfaced as a GitHub Release.

## Unreleased

Tracked separately in [the v2.0.0 audit branch](https://github.com/YamadaBlog/pulse-player/issues?q=is%3Aissue+label%3Av2.0.0).

## 3.0.0-alpha.6 — 2026-06-07

Closes 6 of the v3.0.0-alpha.5 audit items: **docs honesty refresh**, **`@pulse/tokens/base.css` actually consumed** (closes P2 dead code), **three responsive states + prev/next + social icons in `<pulse-player>`** (chrome parity Phase 2), **`@pulse/test-utils` extracted** (kills 4× setup.ts duplication), **`useDomEvent` hook in `@pulse/react`** (kills 8× `useEffect` duplication), and **GitHub Actions CI gates `test:packages` + `build:packages`**.

Chrome parity vs Vue v2.3.4 moves from ~45 % to ~**60 %**. Vue v2.3.4 codebase bit-for-bit identical.

### P3 #1 — Docs honesty refresh

`docs/frameworks/web-component.md` banner updated from "~15-30 % skeleton" to **"~45 % parity, with ambient EQ + pulso + `--pulse-scale` ResizeObserver landed"** (and the bullet list of what's still missing).

`docs/frameworks/react.md` banner updated to note "tests landed (8 / 8 RTL)" + the `apps/demo-react/` runnable example.

`docs/universal/ROADMAP.md` gains a "Current state" preamble that summarises the alpha.5 deliverables instead of treating Phase 0 as the latest news.

### P2 #1 — `@pulse/tokens/base.css` actually consumed

The `--pulse-scale` system was declared in **two places**: once in `packages/tokens/src/base.css` (scoped to `[data-pulse-root]`, which nothing on the page ever was) and once inlined as a `TOKENS` string in `packages/web-component/src/styles.ts`. The CSS file was dead.

`packages/tokens/src/base.ts` (NEW) — same tokens, `:host` selector, exported as a TypeScript string. `packages/web-component/src/styles.ts` now imports `baseCss` from `@pulse/tokens` and folds it via `unsafeCSS(baseCss)`. The inlined `TOKENS` string is gone.

Both files (`base.css` and `base.ts`) stay manually in sync — the file is ~30 lines, and the dual-export pattern matches what variants did in alpha.5. Touch both when adding a new token.

### P1 #1 — Chrome parity Phase 2

`<pulse-player>` ships three new chrome elements + the morph state system that v2.3.4 has:

- **`NOW PLAYING` eyebrow** (the all-caps subtitle above the title).
- **Prev / Next ghost buttons** flanking the play button. Wired to `engine.prev()` and `engine.next()`.
- **Social icons row** (GitHub + Spotify placeholders) right of the time read-out.
- **Three responsive states** driven by a `data-size` attribute set in render() from the ResizeObserver tick. Same thresholds as v2.3.4:
  - `narrow` < 220 px → eyebrow + social icons hide
  - `compact` < 130 px → prev/next + time hide
  - `fab` < 110 px → morph into disc shape, only art + play remain on hover

CSS is shipped alongside in `packages/web-component/src/styles.ts` — additive rules, no behaviour change for the existing 9 / 9 web-component tests (they still pass).

### P3 #2 — `@pulse/test-utils` (kills 4× setup.ts duplication)

Four packages had nearly-identical `tests/setup.ts` files (80 lines each, ~95 % the same content). `packages/test-utils/` (NEW, `private: true`) exposes:

- `installAudioStubs()` — `AudioContext`, `AnalyserNode`, `MediaElementSourceNode` stubs
- `installRafStubs()` — `requestAnimationFrame` / `cancelAnimationFrame` setTimeout-backed polyfill
- `installMediaStubs()` — `HTMLMediaElement.play` / `pause` / `load` stubs
- `installAllStubs()` — one-call helper for the common case

Each of the 4 setup files now collapses to:

```ts
import { beforeEach, vi } from 'vitest'
import { installAllStubs } from '@pulse/test-utils'
installAllStubs()
beforeEach(() => vi.clearAllMocks())
```

320 LOC removed across the 4 setup files; replaced by 1 file with 130 LOC + 4 × 8 LOC consumer files. Net win + drift impossible.

### P3 #3 — `useDomEvent` hook (kills 8× `useEffect` duplication)

`<PulsePlayer />` and `<PulseFab />` each carried **4** copies of the same `useEffect` block (one per `onPlay` / `onPause` / `onTrackChange` / `onError`). Same pattern every time — attach listener, return unsubscribe, re-run on handler change.

`packages/react/src/useDomEvent.ts` (NEW) — single typed hook:

```ts
useDomEvent<EventMap['play']>(ref, 'pulse-play', onPlay)
```

`<PulsePlayer />` and `<PulseFab />` now each have 4 one-liners instead of 4 useEffect blocks. The hook is also exported from `@pulse/react` for advanced consumers needing to bridge non-pulse Custom Events.

8 / 8 React RTL tests still pass — no behaviour change.

### P1 #2 — GitHub Actions CI gates `test:packages` + `build:packages`

`.github/workflows/ci.yml` now runs **after** the Vue tests pass:

```yaml
- npm run test:packages    # 52 tests across @pulse/{core,web-component,react,svelte}
- npm run build:lib        # Vue library
- npm run build:packages   # 6 @pulse/* packages via tsup
```

The matrix (Node 18 / 20 / 22) gates on the full monorepo, not just the Vue v2.3.4 reference. Regression on any `@pulse/*` package blocks the PR.

### Quality gate

```
type-check               → clean
lint                     → 0 errors, 0 warnings (--max-warnings=0)
tests (root, Vue Pinia)  → 33 / 33
tests (@pulse/core)      → 27 / 27
tests (@pulse/web-comp)  →  9 /  9
tests (@pulse/react)     →  8 /  8
tests (@pulse/svelte)    →  8 /  8
TOTAL                    → 85 / 85
build (Vue demo)         → 48 kB gzip (UNCHANGED)
build:lib (Vue lib)      → 14 kB gzip (UNCHANGED)
build:packages           → 6 packages — ESM + CJS + .d.ts
audit (prod-only)        → 0 vulnerabilities
Vue v2.3.4 demo          → bit-for-bit identical
src/lib/                 → ZERO file modified
```

### What's still ahead

- v3.0.0-alpha.7 → Playwright visual regression vs the v2.3.4 demo (gates the Vue migration).
- v3.0.0-alpha.8 → Chrome Phase 3 (`data-fab` morph state on `<pulse-fab>`, drag-to-resize handle, FAB drag-to-reposition, FAB radial menu, `mp__bg` cover blur, `mp__noise` SVG filter).
- v3.0.0-alpha.9 → Vue migration `src/lib/` → `packages/vue/`.
- v3.0.0 → stable, `npm publish @pulse/*`.

## 3.0.0-alpha.5 — 2026-06-07

Closes 4 of the v3.0.0-alpha.4 audit follow-ups: **`@pulse/react` RTL tests**, **`@pulse/svelte` tests**, **Constructable StyleSheet refactor** (single source of truth for variants), and **`apps/demo-react/`** (runnable React example).

Monorepo test count goes from **69 / 69 to 85 / 85**. Vue v2.3.4 codebase at `src/lib/` is bit-for-bit identical.

### `@pulse/react` — 8 RTL tests landed

`packages/react/tests/PulsePlayer.test.tsx` covers the wrapper contract:

- Renders a `<pulse-player>` Custom Element into the DOM.
- `variant` prop maps to the kebab-case attribute.
- `accentColor` maps to `accent-color`.
- `onPlay` is invoked with `{ track, time }` when the engine emits play.
- `onPause` is invoked on the second toggle.
- `onTrackChange` is invoked with `{ from, to, track }` on `engine.next()`.
- Handlers are detached on unmount (no leak).
- `className` passes through.

Stack: `vitest` + `@testing-library/react` + `jsdom`. Setup file ports the Web Audio / rAF stubs from `@pulse/core`.

`beforeEach` resets the singleton via `setSharedEngine(new PulseEngine())` so state doesn't leak between tests — same pattern the web-component suite uses.

### `@pulse/svelte` — 8 tests landed

`packages/svelte/tests/usePulseAudio.test.ts` covers the Svelte classic-store contract:

- `subscribe(run)` fires `run(snapshot)` **synchronously** on subscription (matters for `$store` autosubscribe initial render).
- `subscribe(run)` fires again on every engine state change.
- The returned unsubscribe detaches the listener.
- The snapshot includes derived `track` and `progress` values.
- `toggle`, `next` etc. proxy to the engine.
- `audio.engine` is the shared singleton.
- `fmt(s)` formats m:ss.

These tests run as plain TypeScript — no Svelte compiler required, matching the alpha.4 plain-TS rewrite of the hook.

### Constructable StyleSheet refactor — single source of truth for variants

The previous design declared the 4 mood gradients **twice**:

- `packages/tokens/src/variants.css` — for document-level consumers (Vue v2.3.4, plain HTML).
- `packages/web-component/src/styles.ts` — as `:host([variant='X'])` rules for Shadow DOM consumers.

Drift inevitable. Closes audit item P2 from the v3.0.0-alpha.4 audit.

`packages/tokens/src/variants.ts` (NEW) exports the variants as a TypeScript string — the **canonical declaration**. The `.css` file is now a copy generated for plain-CSS consumers; the web-component package consumes the string via Lit's `unsafeCSS(variantsCss)` so the same gradients + accent RGB triplets land in both the document and the Shadow DOM.

`packages/web-component/src/styles.ts` drops the 8 duplicated `:host([variant='X'])` rules. The Lit element renders `<div class="mp" data-variant=${variant}>` inside Shadow DOM; the tokens stylesheet's `[data-variant='X']` selectors match that inner element and CSS variables (`--variant-bg-gradient`, `--variant-accent-rgb`) cascade down to the chrome.

Side effects:

- `@pulse/tokens` gets its first `tsup` build (was CSS-only before). 5 → 6 packages building.
- `package.json` `exports` adds `@pulse/tokens` (TS entry) alongside the existing `@pulse/tokens/variants.css` etc. file exports.
- 9 / 9 web-component tests still pass — no behaviour change.

### `apps/demo-react/` — runnable React app

A real React + Vite app proving `@pulse/react` works outside vitest:

- `<PulsePlayer />` with a live variant picker
- `<PulseFab pulso />` floating button
- `usePulseAudio()` driving a Prev / Play / Next transport row
- Live event log capturing every `onPlay`, `onPause`, `onTrackChange`, `onError`
- TypeScript + JSX

Vite config aliases every `@pulse/*` package to its workspace TS source so edits in `packages/*/src/` reflect immediately without rebuilding. Build size: 185 kB JS → **58 kB gzip** (includes React + react-dom + Pulse).

```bash
npm run dev --workspace=@pulse/demo-react
# → http://localhost:5181
```

### Quality gate

```
type-check               → clean
lint                     → 0 errors, 0 warnings
tests (root, Vue Pinia)  → 33 / 33
tests (@pulse/core)      → 27 / 27
tests (@pulse/web-comp)  →  9 /  9
tests (@pulse/react)     →  8 /  8   NEW
tests (@pulse/svelte)    →  8 /  8   NEW
TOTAL                    → 85 / 85 across the monorepo
build (Vue demo)         → 129 kB JS + 42 kB CSS → 48 kB gzip
build:lib (Vue lib)      → ~14 kB gzip
build:packages           → 6 packages — ESM + CJS + .d.ts each
build (demo-react)       → 185 kB JS → 58 kB gzip
audit (prod-only)        → 0 vulnerabilities
Vue v2.3.4 demo          → bit-for-bit identical
src/lib/                 → ZERO file modified
```

### What's still ahead

- v3.0.0-alpha.6 → Playwright visual regression vs the v2.3.4 demo (gates the Vue migration).
- v3.0.0-alpha.7 → Chrome parity Phase 2 (three responsive states, social icons, prev / next on inline, FAB drag, palette / menu, drag-to-resize) — closes the gap to ~95 %.
- v3.0.0-alpha.8 → Vue migration `src/lib/` → `packages/vue/`.
- v3.0.0 → stable, `npm publish @pulse/*`.

## 3.0.0-alpha.4 — 2026-06-07

Closes 4 of the P0 / P1 items the previous audit (note 6.5 / 10) flagged: **docs honesty**, **publishability** (every package now has a `tsup` build), **Svelte runtime safety**, and **chrome feature parity Phase 1** (ambient EQ + pulso heartbeat + ResizeObserver `--pulse-scale`). Vue v2.3.4 codebase at `src/lib/` is bit-for-bit identical.

### P0 #1 — Doc honesty (banners on every per-framework page)

Each `docs/frameworks/*.md` now opens with an **Honest status** banner:

- `web-component.md` — "Chrome is a SKELETON, ~15 % of Vue v2.3.4 reference. Working: play/pause/title/cover/progress/8 variants/ambient EQ/pulso. Not yet: drag-to-resize, three responsive states, social icons, prev/next, FAB drag, etc. If you need the full premium chrome today, use the Vue version."
- `react.md` — "Wrapper code shipped, underlying CE skeleton. Tests not yet."
- `svelte.md` — "Plain TypeScript hook. Custom Elements work directly in templates."
- `vue.md` — "Vue is the ONLY fully-featured version. Use it if you need the full chrome."

The universal `README.md` framework picker now shows **chrome parity % vs Vue v2.3.4** per framework (~30 % for React / Svelte / Web Components, 100 % for Vue, 0 % for Angular, N/A for React Native).

### P0 #2 — Build configs per publishable package (`tsup`)

Five packages now build to ESM + CJS + .d.ts via `tsup`:

| Package | ESM | CJS | Types | External deps |
| --- | --- | --- | --- | --- |
| `@pulse/types` | 0.5 KB | 0.7 KB | 2.5 KB | (none — pure types) |
| `@pulse/core` | 5.4 KB | 5.8 KB | 3.4 KB | `@pulse/types` |
| `@pulse/web-component` | 10 KB | 10 KB | 4.5 KB | `@pulse/core`, `@pulse/tokens`, `@pulse/types`, `lit` |
| `@pulse/react` | 4.7 KB | 5.1 KB | 4.6 KB | `@pulse/core`, `@pulse/web-component`, `react`, `react-dom` |
| `@pulse/svelte` | 1.3 KB | 1.4 KB | 2.6 KB | `@pulse/core`, `@pulse/web-component` |

Root script: `npm run build:packages` builds all five sequentially. Cross-package deps are marked `external` in each `tsup.config.ts` so the consumer's bundler does the linking — no nested duplication.

`package.json` `exports` field on every package now points at `./dist/{index.js,index.cjs,index.d.ts}` so consumers consuming the package via npm resolve the built artifacts, while the workspace setup keeps using the TS sources at `./src/*` for local dev (vitest, type-check).

@pulse/angular and @pulse/react-native stay scaffold-only (`private: true`, no peer deps, no build) until they reach implementation-ready status.

### P0 #3 — Feature parity Phase 1 (ambient EQ + pulso + ResizeObserver)

`<pulse-player>`:

- New `ambient-eq` reflected boolean attribute. Toggles a 12-bar pure-CSS ambient wave behind the chrome — staggered animation-delay, 0 JS / frame, matches the v2.3.4 implementation bit-for-bit.
- ResizeObserver computes `--pulse-scale` from the host's current width (linear map [110 px .. 680 px] → [0.30 .. 1.30]). Every chrome measurement (`--pulse-art`, `--pulse-title`, `--pulse-pad`, `--pulse-radius`, …) breathes from this single variable — the v2.3.4 container-aware signature, now in Custom Element form.
- Disconnects the observer in `disconnectedCallback` — zero leak.

`<pulse-fab>`:

- Full pulso heartbeat keyframes: `pulso-heartbeat` (lub at 6 %, dub at 20 %, rest 34 %→100 %), `pulso-wave-lub` and `pulso-wave-dub` rings fire AT the peak (not before), `prefers-reduced-motion` guard. Copied verbatim from the validated v2.3.4 `MiniPlayer.vue`.

`@pulse/web-component` 9-test suite still passes 9/9.

### P1 #1 — Svelte runtime safety

The previous `usePulseAudio.svelte.ts` used Svelte 5 `$state` + `$effect` runes. Those require the Svelte 5 compiler in the consumer's toolchain — and the monorepo doesn't bundle one for its own packages. The file's runtime behaviour was suspect (audit flag).

It is now **plain TypeScript** (`usePulseAudio.ts`) following the Svelte classic-store contract:

```ts
export function usePulseAudio() {
  return {
    subscribe(run) { /* … */ return engine.onStateChange(/* … */) },
    toggle, next, prev, seek, setAudioTracks, setAmbientEq, fmt, engine,
  }
}
```

Svelte 4 + Svelte 5 both honour the `$store` autosubscribe on any object exposing `subscribe(callback)`. No compiler dependency, works in every Svelte project today.

### P1 #2 — `apps/demo-vanilla/` (runnable example, zero framework)

`apps/demo-vanilla/index.html` is a single static HTML file that imports `@pulse/web-component`'s built bundle, mounts `<pulse-player ambient-eq>` and `<pulse-fab pulso>`, wires a variant picker, and logs every DOM `CustomEvent` into a live console panel. Serves on `http-server` — no bundler, no framework. Proves the package works as advertised in a vanilla page.

### Quality gate

```
type-check               → clean
lint                     → 0 errors, 0 warnings (--max-warnings=0)
tests (root, Vue Pinia)  → 33 / 33
tests (@pulse/core)      → 27 / 27
tests (@pulse/web-comp)  →  9 /  9
TOTAL                    → 69 / 69 across the monorepo
build (Vue demo)         → 129 kB JS + 42 kB CSS → 48 kB gzip
build:lib (Vue lib)      → ~14 kB gzip
build:packages           → 5 packages — ESM + CJS + .d.ts each
audit (prod-only)        → 0 vulnerabilities
v2.3.4 demo              → bit-for-bit identical
```

### Vue v2.3.4 — non-regression validated

```
Vue Pinia tests          → 33 / 33 (unchanged)
useDemoTour tests        → included above
Vue demo gzip            → 48 KB (unchanged from v3.0.0-alpha.3)
Vue lib gzip             → 14 KB (unchanged)
src/lib/                 → ZERO file modified
```

### What's still ahead

- v3.0.0-alpha.5 → `@pulse/react` RTL tests + `@pulse/svelte` plain-TS tests; `apps/demo-react/`.
- v3.0.0-alpha.6 → Playwright visual regression vs the v2.3.4 demo (gates the Vue migration).
- v3.0.0-alpha.7 → Chrome parity Phase 2 (three responsive states, social icons, prev / next, FAB drag, palette / menu, drag-to-resize) — closes the gap to ~95 %.
- v3.0.0-alpha.8 → Vue migration `src/lib/` → `packages/vue/`.
- v3.0.0 → stable, npm publish.

## 3.0.0-alpha.3 — 2026-06-07

`@pulse/react`, `@pulse/svelte`, and 9 new `@pulse/web-component` tests land with real code. **Pulse now ships for Vue 3 (today's v2.3.4 reference), React 18 / 19, Svelte 5 and every other framework that respects the DOM**, all sharing the same `@pulse/core` audio engine bit-for-bit. Vue v2.3.4 at `src/lib/` is untouched.

### `@pulse/react` — React 18 / 19 wrapper

`packages/react/` ships:

- **`<PulsePlayer />`** (`PulsePlayer.tsx`, ~110 LOC) — thin adapter around `<pulse-player>`. Maps React conventions onto the Custom Element:
  - camelCase props → kebab-case attributes (`accentColor` → `accent-color`)
  - `on{Event}` props (`onPlay`, `onPause`, `onTrackChange`, `onError`) → DOM `CustomEvent` listeners via `useRef` + `useEffect`
  - Listener cleanup on every prop change AND unmount — zero leak
  - `tracks` prop (Track[]) pushed into the element's property channel
- **`<PulseFab />`** (`PulseFab.tsx`, ~90 LOC) — same pattern for the floating button. `pulso` boolean is imperatively set/removed since React 18 doesn't reliably serialise `false` to "remove the attribute".
- **`usePulseAudio()`** (`usePulseAudio.ts`, ~80 LOC) — React hook over the shared PulseEngine. Returns the state (re-rendering on every `onStateChange` fire) + stable action callbacks wrapped in `useCallback` + the typed `subscribe` + `fmt`. Equivalent to Vue's `useAudioStore` projected through React primitives.
- **`jsx-elements.d.ts`** — global JSX augmentation so `<pulse-player>` and `<pulse-fab>` are typed in TSX without `// @ts-expect-error`. Works for React 18 (which doesn't ship Custom Element typings) and React 19 (which does, but doesn't know about our specific elements).

Usage:

```tsx
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse/react'

export function App() {
  const { isPlaying, track, progress, fmt, toggle } = usePulseAudio()

  return (
    <>
      <PulsePlayer
        variant="midnight"
        accentColor="#8B5CF6"
        onPlay={({ track, time }) => analytics.track('play', { id: track.title, time })}
      />
      <PulseFab pulso />
      <p>{isPlaying ? `▶ ${track.title} — ${fmt(progress)}%` : 'Paused'}</p>
    </>
  )
}
```

### `@pulse/svelte` — Svelte 5 wrapper

`packages/svelte/` ships:

- **`usePulseAudio()`** (`usePulseAudio.svelte.ts`, ~80 LOC) — Svelte 5 runes wrapper. The `$state`-backed reactive snapshot updates in place (preserving identity for `$derived` consumers), `$effect` bridges the engine's `onStateChange` subscription with automatic cleanup. The `.svelte.ts` suffix tells the Svelte compiler to allow runes outside `.svelte` files.
- **Re-exports** — `PulseEngine`, `getSharedEngine`, `setSharedEngine`, every `@pulse/types` shape, `ALL_VARIANTS`. Consumers pull everything from one import.

No `<PulsePlayer />` / `<PulseFab />` Svelte components — Svelte's DOM-first philosophy means `<pulse-player>` and `<pulse-fab>` work **directly** in any template without wrapping. Shipping a Svelte SFC would be a single-line wrapper without adding DX, and would force a Svelte build step that complicates the npm-workspaces tooling. If consumer feedback asks for them later we can revisit.

Usage:

```svelte
<script lang="ts">
  import { usePulseAudio } from '@pulse/svelte'
  const audio = usePulseAudio()
</script>

<!-- Custom Elements work natively in Svelte 5 -->
<pulse-player variant="midnight" onpulse-play={(e) => console.log(e.detail.track.title)}></pulse-player>
<pulse-fab pulso></pulse-fab>

<p>Tracks played this session: {audio.state.playCount}</p>
```

### `@pulse/web-component` — 9 tests landed

`packages/web-component/tests/elements.test.ts` covers:

- Both elements register globally with the `customElements` registry.
- `connectedCallback` renders the Shadow DOM without throwing.
- The `variant` attribute reflects back to the host element.
- `disconnectedCallback` removes cleanly.
- `pulse-play` fires on engine play with `{ track, time }` detail.
- `pulse-pause` fires on the second toggle.
- `pulse-trackchange` fires on `engine.next()` with `{ from, to, track }`.
- `<pulse-fab>` shares the same engine + emits the same events.

`beforeEach` resets the singleton via `setSharedEngine(new PulseEngine())` so state from one test (`isPlaying`, counters) doesn't leak into the next.

### Universal README

`README.md` now leads with a **framework picker table**: Vue 3, React 18 / 19, Svelte 5, Web Components, Angular 17+, React Native, Vanilla HTML, Solid / Astro / Qwik — each with its install path, status, and one-line usage example. Makes it obvious within 5 seconds which package a new visitor wants.

### Tooling

- `workspace:*` deps are not supported by npm-workspaces (they're a pnpm-only protocol). All `@pulse/*` cross-package deps now use `"*"` (any workspace version), which works in npm + pnpm + yarn.
- Scaffold packages (`@pulse/angular`, `@pulse/react-native`) are marked `private: true` and their peerDependencies are dropped until they reach implementation-ready status — without this, `npm install` was pulling in vulnerable old Angular peer deps and inflating the audit count.
- New scripts: `npm run test:web-component` runs the Lit element suite. `npm run test:packages` now gates on `test:core && test:web-component`.

### Quality gate

```
type-check               → clean
lint                     → 0 errors, 0 warnings (--max-warnings=0)
tests (root)             → 33 / 33    (Vue Pinia store + useDemoTour)
tests (@pulse/core)      → 27 / 27    (PulseEngine)
tests (@pulse/web-comp)  →  9 /  9    (Lit elements + lifecycle + events)
TOTAL                    → 69 / 69    across the monorepo
build (demo)             → 129 kB JS + 42 kB CSS → 48 kB gzip
build:lib                → ~14 kB gzip
audit (prod-only)        → 0 vulnerabilities
v2.3.4 demo              → bit-for-bit identical
```

### Packages with REAL code in v3.0.0-alpha.3

| Package | LOC | Tests | Notes |
| --- | --- | --- | --- |
| `@pulse/types` | ~80 | (validated via consumer tests) | Shared TS shapes |
| `@pulse/core` | ~340 | 27 / 27 | Audio engine + state machine |
| `@pulse/tokens` | ~150 | (CSS — validated visually) | variants / base / animations |
| `@pulse/web-component` | ~430 | 9 / 9 | `<pulse-player>` + `<pulse-fab>` (Lit) |
| `@pulse/react` | ~280 | (pending — JSX rendering jsdom setup) | Hooks + JSX components |
| `@pulse/svelte` | ~80 | (pending — Svelte runes test runner) | Runes store + re-exports |

### What's still ahead

- v3.0.0-alpha.4 → Visual regression (Playwright) gates the Vue refactor.
- v3.0.0-alpha.5 → Vue migration (`src/lib/` → `packages/vue/` wrapping `<pulse-player>`).
- v3.0.0-alpha.6 → `@pulse/react-native` separate renderer.
- v3.0.0 → stable, npm publish.

## 3.0.0-alpha.2 — 2026-06-07

`@pulse/web-component` ships its first real Custom Elements. `<pulse-player>` and `<pulse-fab>` register globally on import and work natively in React 19+, Vue 3, Angular 17+, Svelte 5, Solid, vanilla HTML, Astro and Qwik. **Vue v2.3.4 codebase at `src/lib/` is still untouched.**

### `<pulse-player>` — universal inline card

`packages/web-component/src/PulsePlayer.ts` — Lit `LitElement` wrapping the singleton `PulseEngine`. ~140 LOC. Renders the minimum-viable inline card chrome (artwork, title, play / pause button, progress bar, time read-out) and emits DOM `CustomEvent`s for every state change:

- `pulse-play` — `detail: { track, time }`
- `pulse-pause` — `detail: { track, time }`
- `pulse-trackchange` — `detail: { from, to, track }`
- `pulse-error` — `detail: { track, reason, detail? }`

Events are configured `bubbles: true, composed: true` so a single parent listener catches them across Shadow DOM boundaries.

Attributes:

- `variant` (PulseVariant, reflected) — switches the mood gradient. 8 variants ship in alpha.2; `custom` arrives with the consumer styling hook in alpha.3.
- `accent-color` (CSS color string) — overrides `--pulse-accent` inline on the host.
- `tracks` (`Track[]`, property-only) — optional playlist override. Most consumers configure at engine level via `setSharedEngine(new PulseEngine(myTracks))`.

Accessibility wired up: cover art is `role="button"` with `aria-pressed`, the play button has `aria-label` reflecting `play`/`pause`, the progress bar is `role="slider"` with `aria-valuemin/max/now`. `prefers-reduced-motion` disables every transition.

### `<pulse-fab>` — universal floating action button

`packages/web-component/src/PulseFab.ts` — `LitElement` for the compact disc-shaped player. Same singleton engine, same event surface. Adds the `pulso` presence attribute for the heartbeat ring (full keyframes ship in alpha.2.1).

### Singleton engine

`packages/web-component/src/engine-singleton.ts` — module-level lazy singleton. The v2.3.4 Pinia store was a singleton; the Web Component layer mirrors that so `<pulse-player>` and `<pulse-fab>` on the same page share an audio session bit-for-bit.

Advanced consumers can override at module-init time:

```ts
import { setSharedEngine, PulseEngine } from '@pulse/web-component'
setSharedEngine(new PulseEngine(myCustomPlaylist))
```

### Public API surface

`packages/web-component/src/index.ts` re-exports:

```ts
export { PulsePlayerElement, PulseFabElement } from './…'
export { getSharedEngine, setSharedEngine } from './engine-singleton'
export { PulseEngine } from '@pulse/core'
export type { /* every @pulse/types export */ }
```

Importing the package side-effect-registers both Custom Elements with the global registry. Consumers that need lazy registration import the individual classes and call `customElements.define()` themselves.

### Shadow DOM styling strategy

`packages/web-component/src/styles.ts` declares the variant tokens at the `:host([variant='X'])` level instead of the document-level `[data-variant='X']` selectors from `@pulse/tokens`. Shadow DOM doesn't inherit document-level CSS variable cascades by default — the duplication is the cost of self-contained encapsulation. Both files stay in sync via the same RGB triplets / gradient stops, and the planned alpha.3 design-tokens-as-Constructable-StyleSheet refactor will let `@pulse/web-component` consume `@pulse/tokens` directly.

### Vue v2.3.4 — unchanged

```
type-check       → clean
lint             → 0 errors, 0 warnings
tests (root)     → 33 / 33    (Vue Pinia store + useDemoTour)
tests (core)     → 27 / 27    (PulseEngine)
TOTAL            → 60 / 60    across the monorepo
build (demo)     → 129 kB JS + 42 kB CSS → 48 kB gzip
audit            → 0 vulnerabilities
v2.3.4 demo      → bit-for-bit identical
```

### What's still ahead

- v3.0.0-alpha.2.1 → Playwright visual regression suite vs the v2.3.4 demo. Pixel-perfect parity required before alpha.3 can ship.
- v3.0.0-alpha.2.2 → Full chrome parity: ambient EQ, pulso heartbeat keyframes, drag-to-resize, three responsive states, social icons, next/prev controls.
- v3.0.0-alpha.3 → `@pulse/vue` migration (`src/lib/` → `packages/vue/`) refactored to wrap `<pulse-player>` / `<pulse-fab>`.

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
