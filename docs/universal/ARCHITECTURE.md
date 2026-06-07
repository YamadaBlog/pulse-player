# Pulse Universal — Architecture

How the multi-framework monorepo is laid out, what each package owns, and how a fix in the core reaches every consumer at once.

## TL;DR

- **One audio engine** (`@pulse/core`) — TypeScript class, no DOM, no framework.
- **One renderer** (`@pulse/web-component`) — Lit-based Custom Elements `<pulse-player>` and `<pulse-fab>`. Works in every framework that respects the DOM.
- **Five thin wrappers** (`@pulse/vue`, `@pulse/react`, `@pulse/angular`, `@pulse/svelte`, future `@pulse/solid`) — ~50–100 lines each, mapping framework conventions onto the Custom Elements' attributes and DOM events.
- **One separate native implementation** (`@pulse/react-native`) — shares the data contract via `@pulse/types`, ships its own renderer using RN primitives.
- **Shared design tokens** (`@pulse/tokens`) — CSS variables, variant gradients, animations.
- **Shared types** (`@pulse/types`) — pure TypeScript, no runtime.

## Why this shape

Without this architecture you'd maintain 5+ parallel implementations of the same audio engine, the same state machine, the same CSS gradients, the same accessibility wiring. A fix in one framework would have to be re-applied to every other. **Drift is inevitable** in that model.

With the layered design above, a fix in `@pulse/core` automatically benefits every wrapper. A tweak in `@pulse/tokens` updates the theming for every web renderer. The wrappers are small enough to be reviewed in a single sitting.

## Dependency graph

```
                       @pulse/types
                            ▲
              ┌─────────────┼─────────────┐
              │             │             │
        @pulse/core   @pulse/tokens   @pulse/react-native
              ▲             ▲
              │             │
              └──────┬──────┘
                     │
              @pulse/web-component
                     ▲
   ┌────────┬────────┼────────┬──────────┐
   │        │        │        │          │
@pulse/  @pulse/  @pulse/  @pulse/  @pulse/
  vue     react   svelte   angular   solid
                                  (future)
```

`@pulse/react-native` deliberately bypasses `@pulse/web-component` because React Native has no DOM. It still depends on `@pulse/types` so the data contract stays identical.

## Package responsibilities

| Package                | Owns                                                                                                         | Depends on                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `@pulse/types`         | `Track`, `PulseVariant`, `EventMap`, `PulseState`, `Unsubscribe`                                             | (nothing)                                                                           |
| `@pulse/core`          | `PulseEngine` class — `<audio>`, `AudioContext`, `AnalyserNode`, state machine, typed event bus, all actions | `@pulse/types`                                                                      |
| `@pulse/tokens`        | CSS variables, variant gradients, `@keyframes`, base palette                                                 | (nothing)                                                                           |
| `@pulse/web-component` | `<pulse-player>` + `<pulse-fab>` Custom Elements (Lit), CSS imports from `@pulse/tokens`                     | `@pulse/core`, `@pulse/tokens`, `@pulse/types`, `lit`                               |
| `@pulse/vue`           | Vue 3 wrapper — `<MusicPlayer />`, `<MiniPlayer />`, `useAudioStore()`                                       | `@pulse/types`, `@pulse/web-component` (after alpha.1 migration), `vue`, `pinia`    |
| `@pulse/react`         | React wrapper — `<PulsePlayer />`, `<PulseFab />`, `usePulseAudio()`                                         | `@pulse/types`, `@pulse/web-component`, `react`                                     |
| `@pulse/svelte`        | Svelte 5 wrapper — `<PulsePlayer />`, `<PulseFab />`, runes store                                            | `@pulse/types`, `@pulse/web-component`, `svelte`                                    |
| `@pulse/angular`       | Angular 17+ wrapper — `PulseModule`, components                                                              | `@pulse/types`, `@pulse/web-component`, `@angular/core`                             |
| `@pulse/react-native`  | RN native implementation — separate renderer using View / Image / Animated / Reanimated                      | `@pulse/types`, `react`, `react-native`, `react-native-audio-api` (or `expo-audio`) |

## What changes vs the v2.3.4 monolith

The validated Vue v2.3.4 codebase at `src/lib/` owns BOTH the audio engine AND the rendering. v3.0.0-alpha.1 splits those concerns:

| v2.3.4 (today)                         | v3.0.0+ (split)                                                        |
| -------------------------------------- | ---------------------------------------------------------------------- |
| `src/lib/useAudioStore.ts`             | `@pulse/core` (audio engine) + `@pulse/vue` (Pinia adapter)            |
| `src/lib/MusicPlayer.vue` markup + CSS | `@pulse/web-component` `<pulse-player>` + `@pulse/tokens` variants.css |
| `src/lib/MiniPlayer.vue` markup + CSS  | `@pulse/web-component` `<pulse-fab>` + same tokens                     |
| `src/lib/shared/types.ts`              | `@pulse/types`                                                         |
| `src/lib/shared/useProgressRing.ts`    | Internal to `@pulse/web-component` (Lit reactive controller)           |
| `src/lib/shared/variants.css`          | `@pulse/tokens/variants.css`                                           |

The Vue consumer-facing API (`import { MusicPlayer, MiniPlayer, useAudioStore } from '@pulse/vue'`) stays pixel-perfect identical to v2.3.4. Visual regression tests in CI enforce that.

## Build orchestration — npm workspaces, not Turborepo

The monorepo uses **plain `npm` workspaces** for build orchestration. `npm run build:packages` runs `tsup` sequentially across the 6 publishable packages:

```bash
npm run build:packages
# Internally:
#   npm run build --workspace=@pulse/types
#   npm run build --workspace=@pulse/core
#   npm run build --workspace=@pulse/tokens
#   npm run build --workspace=@pulse/web-component
#   npm run build --workspace=@pulse/react
#   npm run build --workspace=@pulse/svelte
```

Total wall-clock: ~5 seconds. The dependency order is linear (`types → core/tokens → web-component → wrappers`) so sequential build catches dependency-graph regressions immediately.

**Why not Turborepo?** Turbo adds value at scale (10+ packages with deep dependency graphs, builds taking minutes, distributed caching). For 6 packages with a linear graph and a 5-second sequential build, the install cost (~100 MB of binaries) plus the cache-management discipline outweigh the benefit. We can revisit if the package count crosses ~12 or per-package build time crosses 30 seconds.

## Versioning

All `@pulse/*` packages share the same major.minor (cohesion). Patches are independent.

- v3.0.0-alpha.0 → THIS commit. Scaffold only — no code moved yet.
- v3.0.0-alpha.1 → `@pulse/types` extracted (already complete in alpha.0), `@pulse/core` extracted from `useAudioStore.ts`, `@pulse/tokens` populated from current CSS.
- v3.0.0-alpha.2 → `@pulse/web-component` (Lit) lands. Renders pixel-perfect to v2.3.4 (visual regression validated).
- v3.0.0-alpha.3 → `@pulse/vue` refactored to wrap `@pulse/web-component`. v2.3.4 demo continues to render identically.
- v3.0.0-alpha.4 → `@pulse/react` + `apps/demo-react/`.
- v3.0.0-alpha.5 → `@pulse/react-native` + Expo demo.
- v3.0.0 → public release.
- v3.1.x → `@pulse/angular` + `@pulse/svelte`.
- v3.x → long tail (Solid, Qwik, Lit re-export).

## How to add a new framework wrapper

1. Create `packages/<framework>/` with `package.json` declaring `peerDependencies` on the framework and a workspace dep on `@pulse/web-component`.
2. Write a thin component that embeds `<pulse-player>` / `<pulse-fab>`, maps framework events to DOM events, maps framework props to attributes.
3. Write a state hook / store that subscribes to `@pulse/core`'s event bus and projects into the framework's reactivity primitive.
4. Build a demo under `apps/demo-<framework>/`.
5. Document in `docs/frameworks/<framework>.md`.

Each wrapper is genuinely small (~30–80 LOC). The hard work is already done in `@pulse/core` and `@pulse/web-component`.
