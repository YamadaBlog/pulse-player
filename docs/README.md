# Pulse — Documentation index

This folder is the canonical entry point for every Pulse documentation page. The `README` at the repo root is the marketing surface; `docs/` is the technical reference.

## Choose your path

| You are… | Start here |
| --- | --- |
| A **first-time visitor** evaluating Pulse | [README.md](../README.md) → [`docs/universal/SANDBOXES.md`](./universal/SANDBOXES.md) |
| A **Vue 3 developer** ready to integrate | [`docs/frameworks/vue.md`](./frameworks/vue.md) → [`docs/API.md`](./API.md) → [`docs/ADVANCED_USAGE.md`](./ADVANCED_USAGE.md) |
| A **React** developer | [`docs/frameworks/react.md`](./frameworks/react.md) → [`docs/universal/API.md`](./universal/API.md) |
| A **Svelte** developer | [`docs/frameworks/svelte.md`](./frameworks/svelte.md) → [`docs/universal/API.md`](./universal/API.md) |
| An **Angular** developer | [`docs/frameworks/angular.md`](./frameworks/angular.md) → [`docs/universal/API.md`](./universal/API.md) |
| A **React Native** developer | [`docs/frameworks/react-native.md`](./frameworks/react-native.md) (read the parity matrix first) |
| Building with **vanilla HTML / Solid / Astro / Qwik** | [`docs/frameworks/web-component.md`](./frameworks/web-component.md) |
| **Comparing** frameworks before choosing | [`docs/universal/FEATURE_MATRIX.md`](./universal/FEATURE_MATRIX.md) |
| Curious about the **architecture** | [`docs/universal/ARCHITECTURE.md`](./universal/ARCHITECTURE.md) |
| **Migrating** from `pulse-player` v2.3.4 | (v2.3.4 keeps working — see [`docs/frameworks/vue.md`](./frameworks/vue.md)) |
| **Contributing** | [`CONTRIBUTING.md`](../CONTRIBUTING.md) |
| Looking for the **changelog** | [`CHANGELOG.md`](../CHANGELOG.md) |
| Looking for the **licence** | [`LICENSE`](../LICENSE) + [`docs/universal/LICENSING.md`](./universal/LICENSING.md) |
| Reporting a **security issue** | [`SECURITY.md`](../SECURITY.md) |

## Universal documentation (`docs/universal/`)

Everything that applies to every framework wrapper:

- [`ARCHITECTURE.md`](./universal/ARCHITECTURE.md) — dependency graph, package responsibilities, build orchestration
- [`ROADMAP.md`](./universal/ROADMAP.md) — phase plan from v3.0.0-alpha.0 through stable
- [`API.md`](./universal/API.md) — canonical multi-framework API reference (props, events, engine class, types, tokens)
- [`FEATURE_MATRIX.md`](./universal/FEATURE_MATRIX.md) — what works in each framework, honest comparison
- [`SANDBOXES.md`](./universal/SANDBOXES.md) — StackBlitz / CodeSandbox playgrounds (live once `@pulse/*` is on npm)
- [`LICENSING.md`](./universal/LICENSING.md) — why MIT, monetisation patterns, trademark notes
- [`BLOCKERS.md`](./universal/BLOCKERS.md) — what isn't done and why (honest deferral log)

## Per-framework documentation (`docs/frameworks/`)

Integration guides per framework:

- [`vue.md`](./frameworks/vue.md) — Vue 3 (the reference implementation)
- [`react.md`](./frameworks/react.md) — React 18 / 19 + hooks
- [`svelte.md`](./frameworks/svelte.md) — Svelte 5 + classic-store contract
- [`angular.md`](./frameworks/angular.md) — Angular 17+ + `CUSTOM_ELEMENTS_SCHEMA`
- [`react-native.md`](./frameworks/react-native.md) — React Native (interface-only, real renderer deferred)
- [`web-component.md`](./frameworks/web-component.md) — vanilla `<pulse-player>` / `<pulse-fab>` for any DOM-respecting framework

## Vue v2.3.4 reference documentation (legacy)

Everything below documents the **`pulse-player` v2.3.4 Vue reference** that still ships from `src/lib/`. After v3.0.0 stable, the same content will live under `docs/frameworks/vue/`.

- [`API.md`](./API.md) — `MusicPlayer` / `MiniPlayer` props + `useAudioStore` actions + keyboard surface
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — `useAudioStore` + `<audio>` + FFT analyser graph
- [`CUSTOMIZATION.md`](./CUSTOMIZATION.md) — variants, accent colours, CSS variables, custom backgrounds
- [`RESPONSIVE.md`](./RESPONSIVE.md) — `--pulse-scale` envelope, three responsive states, drag-to-resize
- [`ADVANCED_USAGE.md`](./ADVANCED_USAGE.md) — replace the playlist, custom controls, multiple players, hide on routes
- [`DEMO.md`](./DEMO.md) — the guided demo tour — scenario, controls, custom steps
- [`EVENTS.md`](./EVENTS.md) — typed `subscribe()` API + per-session counters
- [`PERFORMANCE.md`](./PERFORMANCE.md) — bundle map, runtime cost per hot path, `prefers-reduced-motion` behaviour
- [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) — autoplay rejection, 404s, EQ silent, FAB persistence, hydration mismatch

## Screenshots (`docs/screenshots/`)

12 PNG assets used by the root README. Hero + per-variant + per-responsive-state. Replace with your own when forking; the demo placeholders are documented in [`NOTICE.md`](../NOTICE.md).
