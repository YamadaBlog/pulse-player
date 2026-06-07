# @pulse-music/react-native

React Native implementation of pulse-player. **Separate renderer** — no DOM, no CSS, no Web Audio API.

## Why separate

The other framework wrappers (`@pulse-music/react`, `@pulse-music/vue`, `@pulse-music/angular`, `@pulse-music/svelte`) all consume the shared `@pulse-music/web-component` Custom Elements. React Native has none of the browser primitives those Custom Elements depend on, so the renderer is rebuilt from scratch using RN primitives (View, Image, Animated, Reanimated, react-native-svg).

The audio engine uses one of:

- **`react-native-audio-api`** (Swansion) — AnalyserNode-compatible. Recommended.
- **`expo-audio`** + **`expo-audio-fft`** — for Expo SDK consumers.

## Feature parity

| Feature                          | Status |
| -------------------------------- | ------ |
| Audio playback                   | ✅     |
| 9 themes + custom                | ✅     |
| Ambient EQ                       | ✅ (Reanimated equivalent) |
| Pulso heartbeat                  | ✅ (Reanimated equivalent) |
| FAB drag                         | ✅ (react-native-gesture-handler) |
| `prefers-reduced-motion`         | ✅ (AccessibilityInfo)     |
| Backdrop-filter chrome           | ⚠️ react-native-blur substitute |
| Drag-to-resize                   | ❌ (no DOM resize concept) |
| `<Teleport to="body">` FAB       | ❌ (absolute positioning instead) |
| Guided demo tour                 | ❌ (web-specific, not part of the library API anyway) |

## Status

⏳ **Scaffold** — implementation lands in v3.0.0-alpha.4.

## License

MIT.
