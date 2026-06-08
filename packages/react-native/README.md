# @pulse-music/react-native

React Native wrapper for [pulse-player](https://github.com/YamadaBlog/pulse-player). v3.0.0-rc.1 — first real renderer (was interface-only through alpha.21).

```bash
npm install @pulse-music/react-native @pulse-music/core
npx expo install expo-av react-native-reanimated react-native-gesture-handler react-native-svg @react-native-async-storage/async-storage
```

## Usage

```tsx
import { SafeAreaView } from 'react-native'
import { PulsePlayerRN, PulseFabRN } from '@pulse-music/react-native'

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#05050A' }}>
      <PulsePlayerRN variant="midnight" ambientEq />
      <PulseFabRN variant="vinyl" pulso />
    </SafeAreaView>
  )
}
```

## What ships in rc.1

- **Audio playback** via `expo-av` Audio.Sound — play / pause / next / prev / seek
- **9 mood themes** mirrored from `@pulse-music/tokens`
- **Ambient EQ** — 12 bars animated via Reanimated, off the UI thread
- **Pulso heartbeat** — concentric rings around the FAB
- **`usePulseAudioRN()` hook** with the same shape as the web `usePulseAudio`
- **Direct engine access** via `PulseEngineRN` / `getSharedEngineRN` / `setSharedEngineRN`
- **Typed event bus** — `play` / `pause` / `trackchange` / `error`

## Known limitations (deferred to rc.2 / rc.3)

- FFT visualisation uses a pseudo-bar synth, not real audio FFT. Real FFT lands when `react-native-audio-api` (Swansion) reaches stable iOS support.
- Backdrop blur not yet ported. `expo-blur` integration in the next patch.
- FAB drag-to-reposition deferred. `PanGestureHandler` integration in the next patch.
- `prefers-reduced-motion` wiring deferred. `AccessibilityInfo` listener next patch.

## Intentionally absent

- **Drag-to-resize** — no DOM resize concept on mobile native.
- **Fullscreen API** — mobile fullscreen is the default mode anyway.
- **Guided demo tour** — `App.vue` consumer concern, not part of the library surface.

## Demo

A runnable Expo demo lives at `apps/demo-react-native/` in the monorepo. Boot it with:

```bash
git clone https://github.com/YamadaBlog/pulse-player.git
cd pulse-player && npm install
npm run android --workspace=@pulse-music/demo-react-native
```

Tested boot path: Expo SDK 56, React Native 0.85, Android emulator (Pixel_8a AVD). iOS deferred until macOS / Xcode access.

## API

See [`docs/universal/API.md`](https://github.com/YamadaBlog/pulse-player/blob/main/docs/universal/API.md) for the canonical multi-framework API reference. The RN wrapper exposes the same props and the same event payload shapes — only the imports differ.

## Roadmap

- **rc.2** — real FFT via `react-native-audio-api` once Swansion's iOS GA lands.
- **rc.3** — backdrop blur via `expo-blur`, FAB drag-to-reposition via `PanGestureHandler`, `prefers-reduced-motion` wiring.
- **stable v3.0.0** — all of the above + iOS validated on a Mac (or community contribution).

## License

MIT — see [LICENSE](https://github.com/YamadaBlog/pulse-player/blob/main/LICENSE).
