# Contributing to pulse-player

Thanks for taking a look at the source. The library aims to ship a small surface, hold a 10/10 quality bar, and keep its design language consistent. The notes below cover what we hold ourselves to so you can match the bar on a PR.

## Monorepo layout (v3.0.0-alpha.9+)

The repo is a workspace monorepo. Vue v2.3.4 still lives at `src/lib/` (the validated reference); the multi-framework architecture lands under `packages/`:

```
src/lib/                  ← Vue v2.3.4 reference implementation (UNTOUCHED)
src/App.vue               ← the demo page
src/composables/          ← demo-only composables (useDemoTour, etc.)
packages/
  ├── types/              ← shared TS types (no runtime)
  ├── core/               ← framework-agnostic audio engine (27 tests)
  ├── tokens/             ← CSS variants + base + animations (single source)
  ├── web-component/      ← Lit-based <pulse-player> + <pulse-fab> (22 tests)
  ├── react/              ← React 18/19 hooks + JSX components (16 tests)
  ├── svelte/             ← Svelte 5 classic-store hook (8 tests)
  ├── angular/            ← Angular 17+ PulseModule
  ├── react-native/       ← interface types + sentinel runtime (renderer deferred)
  ├── vue/                ← soft re-export from src/lib/
  └── test-utils/         ← shared vitest stubs
apps/
  ├── demo-vanilla/       ← HTML standalone (no framework)
  ├── demo-react/         ← Vite + React
  └── demo-svelte/        ← Vite + Svelte 5
tests/
  └── visual/             ← Playwright baselines vs Vue v2.3.4 demo
docs/
  ├── universal/          ← multi-framework architecture, roadmap, blockers
  └── frameworks/         ← per-framework usage pages
```

## Setup

```bash
git clone https://github.com/YamadaBlog/pulse-player.git
cd pulse-player
npm install
npm run dev          # http://localhost:5174  (Vue v2.3.4 demo)
```

Node 18+ required. The workspaces field in `package.json` resolves every `@pulse/*` package via symlinks, so changes in `packages/*/src/` reflect immediately.

To run a per-framework demo:

```bash
npm run dev --workspace=@pulse/demo-vanilla  # http://localhost:5180  (no framework)
npm run dev --workspace=@pulse/demo-react    # http://localhost:5181
npm run dev --workspace=@pulse/demo-svelte   # http://localhost:5182
```

## The quality gate

Every PR has to pass `npm run ci`, which is exactly what GitHub Actions runs:

```bash
npm run type-check       # vue-tsc --noEmit
npm run lint             # eslint, no warnings, no errors
npm run test             # vitest — 33 / 33 Vue Pinia + useDemoTour
npm run test:packages    # vitest — 60+ tests across 4 framework wrappers
npm run build            # vite — Vue demo
npm run build:lib        # vite library mode — Vue lib
npm run build:packages   # tsup — 6 framework packages
npm run audit            # production dependencies, moderate or higher
```

A pre-commit hook (via `husky` + `lint-staged`) auto-fixes formatting and lint issues on staged files so most of this is invisible day-to-day.

Visual regression runs in a separate workflow (`.github/workflows/visual.yml`):

```bash
npm run test:visual          # Playwright vs Vue v2.3.4 demo (2 baselines)
npm run test:visual:update   # regenerate baselines after intentional change
```

## Adding a new framework wrapper

The pattern (mirrors `@pulse/react`, `@pulse/svelte`, `@pulse/angular`):

1. Create `packages/<framework>/` with `package.json`, `README.md`, `src/index.ts`, `tsup.config.ts`, `tsconfig.json`.
2. Declare `peerDependencies` on the framework and `dependencies` on `@pulse/types` + `@pulse/web-component`.
3. The wrapper imports `<pulse-player>` and `<pulse-fab>` Custom Elements (side-effect-registered by importing `@pulse/web-component`) and exposes a framework-native component plus an audio hook over the singleton `PulseEngine`.
4. Add tests under `packages/<framework>/tests/` using `@pulse/test-utils` for the shared stubs.
5. Update the README framework picker table + add `docs/frameworks/<framework>.md`.

Reference: `packages/react/` is ~110 LOC + 16 tests + tsup config — that's the canonical size of a new wrapper.

## What ships in `src/lib/`

That folder is the published package — everything in it is part of the public API surface.

- **`MusicPlayer.vue`** and **`MiniPlayer.vue`** are the two components.
- **`useAudioStore.ts`** is the Pinia store — single source of audio truth.
- **`shared/types.ts`** is the canonical `PulseVariant` union. New themes go there.
- **`index.ts`** re-exports the public surface. **Anything not re-exported here is internal.** Don't `import` from deeper paths in app code.

`src/composables/useDemoTour.ts` is also part of the public surface (re-exported via `index.ts`) but is general-purpose enough to be reused outside the player.

`src/App.vue` is the demo / landing page. **Not** part of the published package.

## Adding a feature

1. Open an issue first if it's non-trivial — that gives us a chance to discuss the design.
2. Tests: anything that touches `useAudioStore` or `useDemoTour` must have unit tests in `tests/`. Vue components are covered by smoke tests in the demo and (for now) by interactive review.
3. Docs: a feature isn't done until its prop is in `docs/API.md`, its example in `docs/CUSTOMIZATION.md`, and its mention in the README highlights (if user-facing).
4. Accessibility: any animation must respect `prefers-reduced-motion`. Any new control must have an `aria-label`. Keyboard focus order should be obvious.
5. Performance: avoid `height: %` on bars (use `transform: scaleY`). Anything that fires per-frame must use the `shallowRef` + `triggerRef` pattern shown in `useAudioStore.ts`.
6. Privacy: no third-party requests in the default code path. The opt-in event bus is the only telemetry surface — don't add a second one.

## Commit style

Conventional Commits, lower-case scopes. Examples:

```
feat(api): add `width` prop on MusicPlayer
fix(player): keep FAB position inside viewport on window resize
perf(eq): GPU-composite the ambient bars
docs(events): subscribe() patterns
chore(deps): bump pinia
```

The release commit message ends up being a near-verbatim copy of the CHANGELOG entry, so write it for humans.

## Code style cheatsheet

- **Comments earn their place** by explaining _why_. If a comment restates _what_ the code does, delete it.
- **No magic numbers** without a one-line comment next to them — every threshold (`110`, `130`, `220`, etc.) should be a named constant or carry a comment that explains the constraint.
- **No `any`** in new code (the existing surface has a few — eslint warns, doesn't error, because removing them mid-flight isn't worth the churn).
- **No `console.log`** in shipping code. `console.warn` / `console.error` are allowed for actual operator-facing problems.
- **CSS:** prefer `transform` / `opacity` over `height` / `width` for anything animated. `contain: layout style paint` on visualiser containers.

## Releasing

1. `npm version <patch|minor|major>` bumps `package.json` and creates a tag.
2. Update the CHANGELOG section in the README.
3. `git push --follow-tags`.
4. (When the package is on npm: `npm publish --access public`.)

## License

MIT — see [`LICENSE`](./LICENSE). By contributing you agree your changes are released under the same terms.
