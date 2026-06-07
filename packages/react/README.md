# @pulse/react

React wrapper for pulse-player. Hooks + JSX components built on top of `@pulse/web-component`.

## Usage (once implemented)

```tsx
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse/react'

export function App() {
  const { isPlaying, toggle } = usePulseAudio()

  return (
    <>
      <PulsePlayer variant="midnight" ambientEq onPlay={({ track }) => console.log(track.title)} />
      <PulseFab pulso />
      <button onClick={toggle}>{isPlaying ? 'Pause' : 'Play'}</button>
    </>
  )
}
```

## Architecture

This package is a **thin adapter**: rendering is handled by `<pulse-player>` (Lit Custom Element from `@pulse/web-component`), and `@pulse/react` just maps React conventions onto the underlying DOM events / attributes. Each component is ~30-60 lines.

React 19+ has native Custom Elements support (camelCase → kebab-case + event listeners just work). For React 18, the wrapper handles the attribute / event bridging.

## Status

⏳ **Scaffold** — implementation lands in v3.0.0-alpha.3, after `@pulse/core` (alpha.1) and `@pulse/web-component` (alpha.2).

## License

MIT.
