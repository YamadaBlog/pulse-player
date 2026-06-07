/**
 * @pulse/react-native — React Native implementation.
 *
 * IMPORTANT: this is the ONE package where the renderer is rebuilt
 * from scratch rather than wrapping `@pulse/web-component`. React
 * Native has no DOM, no CSS, no Web Audio API, no
 * `ResizeObserver` / `IntersectionObserver` / `backdrop-filter` /
 * `Teleport`. We share `@pulse/types` for the data contract and
 * mirror the action / event surface, but the rendering uses RN
 * primitives (View, Image, Animated, Reanimated, react-native-svg)
 * and the audio engine uses one of:
 *
 *   - `react-native-audio-api` (Swansion) — AnalyserNode-compatible,
 *     recommended.
 *   - `expo-audio` + `expo-audio-fft` — for Expo SDK users.
 *
 * Feature parity matrix:
 *
 *   ✅ Audio playback + 9 themes + ambient EQ + pulso
 *   ✅ FAB drag (via react-native-gesture-handler)
 *   ✅ `prefers-reduced-motion` (via AccessibilityInfo)
 *   ⚠️  Backdrop-filter chrome → `react-native-blur` substitute
 *   ⚠️  Pulso heartbeat → Reanimated equivalent
 *   ❌ Drag-to-resize (no DOM resize concept)
 *   ❌ `<Teleport to="body">` FAB (uses absolute positioning instead)
 *   ❌ Guided demo tour (web-specific)
 *
 * Status: SCAFFOLD. Implementation lands in v3.0.0-alpha.4.
 */
export {} // placeholder export
