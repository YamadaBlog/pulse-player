# `@pulse-music/react-native` — Setup procedure for the real renderer

Today `@pulse-music/react-native` ships interface types + a sentinel runtime that throws an actionable error pointing at this doc and the web wrappers (see [BLOCKERS.md](./BLOCKERS.md) #1). This document is the maintainer's step-by-step plan to ship the **real** renderer in a v3.X.0 dedicated sprint.

## Scope decision (read first)

React Native cannot share rendering code with the web wrappers — there's no DOM, no `<audio>`, no `backdrop-filter`, no CSS resize. The path is **a separate renderer** that consumes the same `@pulse-music/core` audio engine API plus RN-native primitives for chrome.

The feature-parity matrix in [`docs/frameworks/react-native.md`](../frameworks/react-native.md) flags what's transferable and what isn't:

- ✅ Audio playback + FFT + themes + ambient EQ + pulso (animated via Reanimated)
- ⚠️ Backdrop blur (substitute: `@react-native-community/blur`)
- ❌ Drag-to-resize handle (no DOM resize concept on mobile native)
- ❌ Fullscreen API (mobile fullscreen is the default mode anyway)

Read that matrix before writing any code so the scope is explicit before the sprint starts.

## Prerequisites — RN dev environment

The renderer needs an actual RN dev box. Pick one path:

### Path A — Expo SDK (recommended for first iteration)

```bash
# Install Expo CLI globally
npm install -g expo

# Create the demo app inside the monorepo
cd apps/
npx create-expo-app demo-react-native --template blank-typescript
cd demo-react-native
```

This gets you a runnable app + Metro bundler + the iOS Simulator (on macOS) or Android Emulator (cross-platform) without dealing with Xcode + CocoaPods + Gradle directly.

### Path B — Bare React Native CLI

```bash
npx react-native@latest init PulseRN --template react-native-template-typescript
```

Needed when you want full native module access (custom Swift / Kotlin code). Heavier setup (CocoaPods on iOS, Gradle on Android), but no Expo runtime overhead.

For Pulse, **Path A is the right call** — `react-native-audio-api` (Swansion) supports Expo from SDK 50+ and we don't need custom native modules.

## Required RN dependencies

Add these to `packages/react-native/package.json`:

```json
{
  "peerDependencies": {
    "react": "^18 || ^19",
    "react-native": "^0.74",
    "react-native-audio-api": "^0.5",
    "react-native-reanimated": "^3.10",
    "react-native-gesture-handler": "^2.16",
    "react-native-svg": "^15.2",
    "@react-native-async-storage/async-storage": "^1.23",
    "@react-native-community/blur": "^4.4"
  }
}
```

Why each one:

- `react-native-audio-api` — Web Audio API parity (gives you AudioContext + AnalyserNode for the FFT visualiser, same shapes as `@pulse-music/core` consumes today)
- `react-native-reanimated` — drives the ambient EQ + pulso heartbeat at 60 fps off the UI thread
- `react-native-gesture-handler` — pan handler for FAB drag-to-reposition
- `react-native-svg` — chrome SVG icons (GitHub Octocat, streaming icon)
- `@react-native-async-storage/async-storage` — `persist-key` localStorage replacement
- `@react-native-community/blur` — replacement for the web's `backdrop-filter`

## Implementation sequence

### Step 1 — Renderer scaffold

```bash
mkdir -p packages/react-native/src/{components,hooks,utils}
```

Files to create (in this order — each one depends on the previous):

1. `src/utils/audioEngine.ts` — adapter that wraps `react-native-audio-api`'s `AudioContext` to look like the `@pulse-music/core` engine's shape. No new public API, just the bridge.
2. `src/hooks/usePulseAudio.ts` — replaces the sentinel currently at `packages/react-native/src/index.ts`. Returns the same shape as the web `usePulseAudio` hook (engine snapshot + actions + `subscribe`).
3. `src/components/PulsePlayer.tsx` — RN renderer using `View` / `Animated.View` / `Text` / `Pressable` + the components from step 4-7.
4. `src/components/AmbientEQ.tsx` — Reanimated `useDerivedValue` driving 12 bars.
5. `src/components/Pulso.tsx` — Reanimated heartbeat using a single shared value.
6. `src/components/CoverArt.tsx` — `react-native-svg` + `Image` with the same aspect-ratio logic as the web version.
7. `src/components/PulseFab.tsx` — `react-native-gesture-handler` PanGestureHandler for drag, `AsyncStorage` for persist.

### Step 2 — Demo app

```bash
cd apps/demo-react-native
npm install @pulse-music/react-native @pulse-music/core @pulse-music/types
```

`apps/demo-react-native/App.tsx`:

```tsx
import { useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native'
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse-music/react-native'

export default function App() {
  const [variant, setVariant] = useState<'midnight' | 'sunset' | 'vinyl'>('midnight')
  const { isPlaying, track, toggle } = usePulseAudio()

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <PulsePlayer variant={variant} ambientEq />
      </ScrollView>
      <PulseFab variant={variant} pulso draggable showMenu />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05050a' },
  content: { padding: 16 },
})
```

### Step 3 — Test environment

Use the existing `@pulse-music/test-utils` for any shared mocks, then add RN-specific testing via `@testing-library/react-native`:

```bash
cd packages/react-native
npm install -D @testing-library/react-native react-test-renderer
```

`packages/react-native/tests/PulsePlayer.test.tsx`:

```tsx
import { render } from '@testing-library/react-native'
import { PulsePlayer } from '../src'

it('renders without crashing', () => {
  const { getByTestId } = render(<PulsePlayer variant="midnight" testID="player" />)
  expect(getByTestId('player')).toBeTruthy()
})
```

Aim for ≥ 5 tests covering: render + variant prop + pulso + ambient EQ + state subscription. Match the parity of the web `@pulse-music/react` test count (16/16).

### Step 4 — Update parity matrix

Once the renderer lands:

- `docs/universal/FEATURE_MATRIX.md` — flip the React Native column from "🚫 0%" to actual percentages per row.
- `docs/frameworks/react-native.md` — replace the deferred-status banner with an installation + quick-start guide.
- `packages/react-native/README.md` — same.
- `docs/universal/BLOCKERS.md` #1 — mark RESOLVED with the renderer commit SHA.

### Step 5 — npm publish

The `@pulse-music/react-native` package follows the same publish procedure as the web ones — see [PUBLISH_CHECKLIST.md](./PUBLISH_CHECKLIST.md). It joins the dependency chain at the same level as `@pulse-music/react` (both depend on `@pulse-music/core` + `@pulse-music/types`; neither depends on `@pulse-music/web-component`).

## Timeline estimate

- Step 1 (renderer scaffold): **2-3 days** (most of the work)
- Step 2 (demo app): **0.5 day**
- Step 3 (tests): **1 day**
- Step 4 (docs sweep): **0.5 day**
- Step 5 (publish): **30 min**

**Total ~1 working week** for a maintainer with RN tooling installed. Currently blocked because the maintainer's environment doesn't have Xcode + CocoaPods (iOS) and Android Studio + SDK + emulator (Android).

## What if the sprint slips?

The interface-types-only package shipping today is a deliberate compromise: consumers can write their RN integration code against the planned API and the sentinels make it explicit at runtime that the renderer isn't there yet. The MIT-licensed RN audio space is also moving fast — `react-native-track-player` reached v4 in 2025, `react-native-audio-api` (Swansion) is the modern bet. If either of these forks the API in 2026-2027, this doc gets updated; the v3.X.0 sprint can target the new shape.

The maintainer's current stance: **ship the web stack first** (Vue + React + Svelte + WC + Angular all at parity), publish, get usage signal, **then** decide whether RN is the right next investment or whether the user base actually wants something else (Solid full integration, Astro islands, Lit-only…).
