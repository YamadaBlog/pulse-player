# @pulse-music/demo-react-native

Expo demo app for the React Native renderer that ships in `@pulse-music/react-native@3.0.0-rc.1`. Boots a single screen with a 3-theme picker + `<PulsePlayerRN ambientEq />` + `<PulseFabRN pulso />`.

## Boot procedure

```bash
# 1. From the repo root — install the JS deps shared across the monorepo.
cd /path/to/pulse-player
npm install

# 2. From inside this app dir — let Expo align the RN peer deps with
#    the current SDK. This is the Expo-recommended way; pinning
#    versions in package.json drifts as SDKs evolve.
cd apps/demo-react-native
npm run setup       # → npx expo install …

# 3. Boot.
npm run android     # Android emulator (Pixel_8a AVD recommended)
npm run web         # Expo Web target — works on any OS
npm run ios         # macOS only (requires Xcode + CocoaPods)
```

## What you should see

- Title `Pulse RN demo` + subtitle `@pulse-music/react-native · v3.0.0-rc.1`.
- 3 theme chips: `midnight` / `sunset` / `vinyl` — tap to switch the player's variant.
- An inline `<PulsePlayerRN />` card with cover art + title + prev/play/next + ambient EQ bars (animate while playing).
- A floating `<PulseFabRN />` bottom-right with cover + pulso heartbeat ring (animates while playing).

## What's NOT in this rc.1 demo

Deferred to subsequent patches (documented in `packages/react-native/README.md`):

- **Real FFT** — bars use a pseudo-synth, not real audio analysis. Real FFT lands when `react-native-audio-api` reaches stable iOS support.
- **Backdrop blur** — solid background colour for now. `expo-blur` integration next patch.
- **FAB drag-to-reposition** — basic FAB only; `PanGestureHandler` integration next patch.
- **`prefers-reduced-motion`** — animations always run for now; `AccessibilityInfo` listener next patch.

## Tested environments

- Windows 11 + Node 20 + Android SDK 35 + Pixel_8a AVD ✅
- Expo SDK 56 + React Native 0.85 + React 19.2 ✅
- iOS: deferred (no macOS / Xcode in the current dev environment)

## Troubleshooting

- **`Unable to resolve module …`** — run `npm run setup` from this dir, then restart Metro: `npx expo start --clear`.
- **Audio doesn't play** — check the emulator's volume + media output settings. iOS simulators sometimes need a manual unmute.
- **Reanimated says "you need to add the babel plugin"** — Expo SDK 56+ handles this automatically; if you're on a bare RN project, follow the [Reanimated docs](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started).
