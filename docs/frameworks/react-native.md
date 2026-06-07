# Pulse for React Native (`@pulse/react-native`)

React Native implementation. **Separate renderer** — no DOM, no CSS, no Web Audio API.

## Status

⏳ **Implementation lands in v3.0.0-alpha.5.** This page is a forward-looking spec.

## Feature parity

React Native is the one consumer that DOESN'T share `@pulse/web-component`'s rendering — it has none of the browser primitives those Custom Elements depend on. The renderer is rebuilt from scratch using RN primitives.

| Feature                          | Status | Notes |
| -------------------------------- | ------ | ----- |
| Audio playback                   | ✅ | via `react-native-audio-api` (Swansion) or `expo-audio` |
| FFT visualisation                | ✅ | `react-native-audio-api` ships an AnalyserNode-compatible API |
| 9 themes + custom                | ✅ | StyleSheet equivalents of the CSS gradients |
| Ambient EQ                       | ✅ | Reanimated equivalent of the CSS keyframes |
| Pulso heartbeat                  | ✅ | Reanimated |
| FAB drag                         | ✅ | `react-native-gesture-handler` |
| `prefers-reduced-motion`         | ✅ | `AccessibilityInfo.isReduceMotionEnabled()` |
| Backdrop-filter chrome           | ⚠️ | `react-native-blur` substitute |
| Drag-to-resize                   | ❌ | No DOM resize concept on mobile native — single-size component |
| `<Teleport to="body">` FAB       | ❌ | Use absolute positioning at the navigation root instead |
| Guided demo tour                 | ❌ | Web-specific. Not part of the library API anyway. |

## Planned API

```tsx
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse/react-native'

export function App() {
  const { isPlaying, toggle } = usePulseAudio()
  return (
    <View style={{ flex: 1 }}>
      <PulsePlayer variant="midnight" ambientEq />
      <PulseFab pulso style={{ position: 'absolute', bottom: 32, right: 16 }} />
    </View>
  )
}
```

The data contract (props, events, payloads) is identical to the web wrappers because both share `@pulse/types`.

## See also

- [Architecture](../universal/ARCHITECTURE.md)
- [react-native-audio-api docs](https://docs.swmansion.com/react-native-audio-api/)
- [Expo audio docs](https://docs.expo.dev/versions/latest/sdk/audio/)
