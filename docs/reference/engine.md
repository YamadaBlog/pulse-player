# Engine reference

`@pulse-music/core` is the framework-agnostic audio engine behind every player. It is plain TypeScript, has no dependencies besides the shared types, and is safe to import on the server: nothing touches the DOM until `prepare()` or `play()`.

```ts
import { PulseEngine, getSharedEngine, formatTime } from '@pulse-music/core'
```

You rarely need it directly — the elements and wrappers use it for you — but it is the place for page-level logic: analytics, custom controls, your own visualiser.

## Creating an engine

```ts
const engine = new PulseEngine({
  tracks: [
    {
      title: 'Projector Screen',
      artist: 'HoliznaCC0',
      src: '/projector-screen.mp3',
      cover: '/projector-screen.jpg',
    },
  ],
  volume: 0.8,
  repeat: 'all',
})
```

| Option         | Type                               | Default      | Description                                                                                                                     |
| -------------- | ---------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `tracks`       | `Track[]`                          | `[]`         | Initial playlist (may be empty).                                                                                                |
| `volume`       | number `0..1`                      | `0.8`        | Initial volume.                                                                                                                 |
| `repeat`       | `'none' \| 'all' \| 'one'`         | `'all'`      | What happens when a track ends.                                                                                                 |
| `crossOrigin`  | `'anonymous' \| 'use-credentials'` | —            | Declare that cross-origin audio is served **with** CORS headers — required for the real spectrum on another origin (see below). |
| `visualizer`   | boolean                            | `true`       | Route audio through an `AnalyserNode` for the visualiser.                                                                       |
| `mediaSession` | boolean                            | `true`       | Publish metadata and handle OS media keys via the Media Session API.                                                            |
| `preload`      | `'none' \| 'metadata' \| 'auto'`   | `'metadata'` | `<audio preload>` hint; `metadata` shows durations before playback.                                                             |
| `bands`        | number                             | `24`         | Number of bands in each visualiser frame.                                                                                       |
| `createAudio`  | `() => HTMLAudioElement`           | —            | Custom media element factory (tests, custom elements).                                                                          |

`new PulseEngine(tracks)` (a bare array) is also accepted.

### Cross-origin audio and the visualiser

A media element captured by Web Audio outputs **silence** when its source is cross-origin and was not fetched with CORS. The engine therefore only routes same-origin, `data:` and `blob:` sources through the analyser. Cross-origin sources still play; the visualiser then runs on synthesised motion (`frame.synthetic === true`). If your CDN sends `Access-Control-Allow-Origin`, pass `crossOrigin: 'anonymous'` to get the real spectrum.

## Shared sessions

```ts
getSharedEngine() // the page-wide 'default' session, created on first use
getSharedEngine('podcast') // a named session
setSharedEngine(engine) // install your own engine for 'default'
setSharedEngine(engine, 'podcast')
```

Sessions live on `globalThis`, so two copies of the package in one bundle still share them.

## State

`engine.state` is an immutable, frozen snapshot; a new object is published on every change, so reference equality tells you whether anything changed.

| Field                                         | Type                  | Description                                                                                     |
| --------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------- |
| `currentTrack`                                | number                | Index in the playlist.                                                                          |
| `isPlaying`                                   | boolean               | Playing or about to play. Follows the real element, so OS media keys and headsets stay in sync. |
| `isLoading`                                   | boolean               | Waiting for data (initial load, buffering, seeking).                                            |
| `currentTime`                                 | number (s)            | Position.                                                                                       |
| `duration`                                    | number (s)            | `0` until known, `Infinity` for live streams.                                                   |
| `buffered`                                    | number `0..1`         | Buffered-ahead fraction.                                                                        |
| `volume`, `muted`                             | number, boolean       | Output level.                                                                                   |
| `repeat`                                      | `RepeatMode`          | Current repeat mode.                                                                            |
| `error`                                       | `ErrorReason \| null` | Last error, cleared when playback succeeds.                                                     |
| `isVisible`                                   | boolean               | Whether the floating player should show (set on play, cleared by `close()`).                    |
| `hasBeenOpened`                               | boolean               | Playback has started at least once.                                                             |
| `ambientEq`                                   | boolean               | App-wide default for the ambient equaliser.                                                     |
| `playCount`, `pauseCount`, `trackChangeCount` | number                | Local counters — never transmitted.                                                             |

Getters: `track` (`Track | null`), `tracks`, `progress` (`0..100`), `hasLiveSpectrum`.

## Actions

| Method                                               | Description                                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `play(): Promise<void>`                              | Start playback. Rejections by the autoplay policy roll the state back and emit `error`.      |
| `pause()`, `toggle()`                                |                                                                                              |
| `next()`, `prev()`                                   | `prev()` restarts the track when past 3 s. Both wrap around.                                 |
| `load(index, { autoplay? })`                         | Switch track; keeps playing if it was playing unless `autoplay` says otherwise.              |
| `seek(fraction)`, `seekTo(seconds)`, `seekBy(delta)` | Clamped; no-ops until the duration is known.                                                 |
| `setVolume(v)`, `setMuted(m)`, `toggleMute()`        |                                                                                              |
| `setRepeat(mode)`                                    |                                                                                              |
| `setTracks(tracks, { startIndex? })`                 | Replace the playlist. If the playing track is still in it, playback continues uninterrupted. |
| `setAmbientEq(on)`                                   |                                                                                              |
| `open()`, `close()`                                  | Show the floating player / stop and hide it.                                                 |
| `prepare()`                                          | Create the media element and preload metadata without playing.                               |
| `dispose()`                                          | Release the element, the audio graph and the OS media controls. The engine stays usable.     |
| `fmt(seconds)`                                       | Same as `formatTime`.                                                                        |

## Events

```ts
const off = engine.subscribe('trackchange', ({ from, to, track }) => {
  analytics.track('song_changed', { title: track.title })
})
off() // unsubscribe
```

| Event         | Payload                                                       |
| ------------- | ------------------------------------------------------------- |
| `play`        | `{ track, time }`                                             |
| `pause`       | `{ track, time }`                                             |
| `trackchange` | `{ from, to, track }`                                         |
| `ended`       | `{ track }`                                                   |
| `error`       | `{ track, reason: 'play-rejected' \| 'media-error', detail }` |

`engine.onStateChange(state => …)` fires on every state change — it is what the framework wrappers build on. A throwing listener is logged and isolated; it never breaks the engine or the other listeners.

## Visualiser frames

```ts
const off = engine.onFrame(({ bands, energy, synthetic }) => {
  // bands: Float32Array of log-spaced levels, bass → treble, each 0..1
  // energy: overall loudness proxy, 0..1
  draw(bands, energy)
})
```

One `requestAnimationFrame` loop serves every subscriber. It runs only while at least one listener is attached **and** audio plays (plus a short release so bars settle smoothly after a pause), then stops by itself. The arrays are reused between frames — copy values you want to keep.

## Utilities

`formatTime(seconds)` → `'3:07'` or `'1:02:05'`; non-finite input gives `'0:00'`. `clamp(value, min, max)`.
