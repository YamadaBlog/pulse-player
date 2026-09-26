# @pulse-music/core

The framework-agnostic audio engine behind [Pulse](https://github.com/YamadaBlog/pulse-player): playback state that mirrors the real `<audio>` element, a Web Audio spectrum for visualisers, Media Session integration and typed events. Plain TypeScript, SSR-safe, no dependencies besides `@pulse-music/types`.

```bash
npm i @pulse-music/core
```

```ts
import { PulseEngine } from '@pulse-music/core'

const engine = new PulseEngine({
  tracks: [{ title: 'Projector Screen', artist: 'HoliznaCC0', src: '/projector-screen.mp3' }],
})

engine.onStateChange((state) => render(state)) // immutable snapshots
engine.subscribe('trackchange', ({ track }) => console.log(track.title))
engine.onFrame(({ bands, energy }) => draw(bands, energy)) // runs only while playing

playButton.onclick = () => engine.toggle()
```

You usually get it through `@pulse-music/web-component` or a framework package; use it directly for custom UIs and page-level logic.

**Docs:** [engine reference](https://github.com/YamadaBlog/pulse-player/blob/main/docs/reference/engine.md)

MIT © YamadaBlog
