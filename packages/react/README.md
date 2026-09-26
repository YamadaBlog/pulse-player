# @pulse-music/react

React 18 / 19 bindings for [Pulse](https://github.com/YamadaBlog/pulse-player): typed `<PulsePlayer />` / `<PulseFab />` components and a `usePulseAudio()` hook built on `useSyncExternalStore`.

```bash
npm i @pulse-music/react
```

```tsx
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse-music/react'

const tracks = [
  { title: 'Protofunk', artist: 'Kevin MacLeod', src: '/protofunk.mp3', cover: '/protofunk.jpg' },
]

export function Player() {
  const { isPlaying, track, toggle } = usePulseAudio()
  return (
    <>
      <PulsePlayer
        tracks={tracks}
        variant="aurora"
        ambientEq
        onTrackChange={({ track }) => console.log(track.title)}
      />
      <button onClick={toggle}>
        {isPlaying ? 'Pause' : 'Play'} {track?.title}
      </button>
      <PulseFab pulso />
    </>
  )
}
```

Values reach the element as DOM properties on both React 18 and 19; callbacks are always the latest ones. In Next.js, render the players from a client component.

**Docs:** [React guide](https://github.com/YamadaBlog/pulse-player/blob/main/docs/frameworks.md#react) · [element reference](https://github.com/YamadaBlog/pulse-player/blob/main/docs/reference/elements.md)

MIT © YamadaBlog
