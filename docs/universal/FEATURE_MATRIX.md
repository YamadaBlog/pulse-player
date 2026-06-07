# Pulse Universal — Feature matrix

Honest comparison of every Pulse feature across every framework wrapper. Updated through v3.0.0-alpha.11.

## Legend

| Symbol | Meaning |
| --- | --- |
| ✅ | Implemented and tested |
| ⚠️ | Implemented but with a documented caveat (substituted API, partial parity) |
| 🛡 | Reserved / planned — not yet shipped |
| ❌ | Cannot be supported (platform constraint) |
| — | Not applicable to this surface |

## Audio engine

| Feature | Vue v2.3.4 | React | Svelte | Angular | Web Components | React Native | Vanilla HTML |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Play / pause | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Next / prev | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Seek | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| FFT visualisation | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 (via `react-native-audio-api`) | ✅ |
| Custom playlist | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Typed event bus (`play`, `pause`, `trackchange`, `error`) | ✅ | ✅ | ✅ | ✅ | ✅ (as `CustomEvent`) | 🛡 | ✅ |
| Privacy-friendly counters | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| `dispose()` tear-down | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Safari `webkitAudioContext` fallback | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |

## Theming

| Feature | Vue | React | Svelte | Angular | Web Components | React Native | Vanilla HTML |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 mood variants (auto, transparent, solid, dark, light, sunset, midnight, aurora, vinyl) | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| `custom` variant slot | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| `accentColor` / `accent-color` override | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Variant tokens at `[data-variant='X']` cascade | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ |

## Visual chrome

| Feature | Vue | React | Svelte | Angular | Web Components | React Native | Vanilla HTML |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ambient EQ background (12 bars, pure CSS) | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 (Reanimated) | ✅ |
| Pulso heartbeat ring | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 (Reanimated) | ✅ |
| 3 responsive states (220 / 130 / 110 thresholds) | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ (RN has no DOM resize) | ✅ |
| `data-fab` morph state | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| `mp__bg` blur cover backdrop | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ (`react-native-blur`) | ✅ |
| `mp__noise` SVG noise overlay | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 (`react-native-svg`) | ✅ |
| Real GitHub + Spotify SVG icons | ✅ | ✅ | ✅ | ✅ | ✅ (alpha.10) | 🛡 | ✅ |
| Prev / next ghost buttons on inline card | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Time read-out | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |

## Interactions

| Feature | Vue | React | Svelte | Angular | Web Components | React Native | Vanilla HTML |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Keyboard shortcuts (`Space`/`K` toggle, `J`/`←` prev, `L`/`→` next) | ✅ | ✅ | ✅ | ✅ | ✅ (alpha.10) | 🛡 | ✅ |
| Click-to-play on cover art | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Click-to-seek on progress bar | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Drag-to-resize handle (`resizable`) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (no DOM resize on mobile native) | ✅ |
| FAB drag-to-reposition (`draggable`) | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 (`react-native-gesture-handler`) | ✅ |
| `localStorage` position persist | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 (`AsyncStorage`) | ✅ |
| FAB radial menu (`show-menu`: palette + Pulso + Fullscreen) | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Fullscreen API | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (mobile native — fullscreen is the default) | ✅ |
| `prefers-reduced-motion` guard | ✅ | ✅ | ✅ | ✅ | ✅ | 🛡 (`AccessibilityInfo`) | ✅ |

## Architecture

| Feature | Vue | React | Svelte | Angular | Web Components | React Native | Vanilla HTML |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Backed by `@pulse/core` audio engine | ✅ (via wrapping, alpha.10+ soft) | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Singleton engine across all instances | ✅ (Pinia) | ✅ | ✅ | ✅ | ✅ | 🛡 | ✅ |
| Framework-native hook / store / service | ✅ `useAudioStore` | ✅ `usePulseAudio` | ✅ `usePulseAudio` | ✅ `getSharedEngine` | — | 🛡 | ✅ `getSharedEngine` |
| Shadow DOM isolation | — (Vue SFC) | — | — | — | ✅ | — | ✅ |
| Side-effect Custom Element registration | — | ✅ (via `@pulse/web-component`) | ✅ | ✅ | ✅ | — | ✅ |

## Library / out-of-scope features

| Feature | Vue | React | Svelte | Angular | Web Components | React Native | Vanilla HTML |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Guided demo tour** | ✅ (in `App.vue` consumer, NOT library) | — | — | — | — | — | — |

The guided demo tour is a property of the **`App.vue` demo page** at the repo root. It's deliberately not part of the `@pulse/*` library surface because:

1. It coordinates layout-specific scroll positions, fullscreen, and `useDemoTour` composable — assumptions a generic library can't bake in
2. Every consumer's tour requirements differ — a fixed tour API would constrain too much
3. The composable (`src/composables/useDemoTour.ts`) is still consultable as a reference if someone wants to build their own

Consumers who want a "watch demo" feature should fork the composable and tailor it to their layout.

## Tests count per package

| Package | Test count | Coverage type |
| --- | --- | --- |
| `pulse-player` (root, Vue v2.3.4) | 33 | Pinia store + `useDemoTour` composable |
| `@pulse/core` | 27 | `PulseEngine` class |
| `@pulse/tokens` | 11 | Contract: variants, base, RGB triplets pinned |
| `@pulse/web-component` | 22 | Lit element lifecycle + 13 attribute behaviour tests |
| `@pulse/react` | 16 | `<PulsePlayer />` + `<PulseFab />` + `useDomEvent` |
| `@pulse/svelte` | 8 | Classic-store contract |
| `@pulse/angular` | 5 | Smoke (registration + re-export + module construct) |
| `@pulse/react-native` | 10 | Parity matrix + sentinel runtime |
| **TOTAL unit** | **132** | — |
| Playwright visual regression | 2 | Vue v2.3.4 demo `hero` + `home-fold` |
| **TOTAL** | **134** | — |

## See also

- [`docs/universal/API.md`](./API.md) — full canonical API reference
- [`docs/universal/ARCHITECTURE.md`](./ARCHITECTURE.md) — dependency graph
- [`docs/universal/BLOCKERS.md`](./BLOCKERS.md) — what isn't done and why
- [`docs/frameworks/`](../frameworks/) — per-framework integration guides
