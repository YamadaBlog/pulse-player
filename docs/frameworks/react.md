# Pulse for React (`@pulse/react`)

React 18 / 19 wrapper. Hooks + JSX components built on top of `@pulse/web-component`.

## Status

⏳ **Implementation lands in v3.0.0-alpha.4.** This page is a forward-looking spec — once the package ships, expect ~80 LOC per component (the heavy lifting happens in the underlying Lit Custom Element).

## Planned API

```tsx
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse/react'

export function App() {
  const { isPlaying, currentTrack, toggle, next, subscribe } = usePulseAudio()

  return (
    <>
      <PulsePlayer
        variant="midnight"
        ambientEq
        accentColor="#8B5CF6"
        onPlay={({ track, time }) => analytics.track('play', { id: track.title, time })}
        onError={({ reason, detail }) => {
          if (reason === 'play-rejected') toast.warn('Tap to start')
        }}
      />
      <PulseFab pulso />
      <button onClick={toggle}>{isPlaying ? '⏸' : '▶'}</button>
    </>
  )
}
```

## Architecture

`@pulse/react` is a **thin adapter**. Rendering is handled by `<pulse-player>` and `<pulse-fab>` Custom Elements from `@pulse/web-component`. The React layer:

- Maps camelCase props → kebab-case attributes
- Maps DOM events → React synthetic-event-style props (`onPlay`, `onError`, …)
- Manages component lifecycle via `useEffect` (listener attach + cleanup)
- Provides `usePulseAudio()` — a React hook over `@pulse/core`'s state machine + event bus

React 19+ supports Custom Elements natively (no wrapping needed for prop / event binding). React 18 needs the wrapper for attribute and event bridging — the package handles both transparently.

## See also

- [Architecture](../universal/ARCHITECTURE.md)
- [Roadmap](../universal/ROADMAP.md)
