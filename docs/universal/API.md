# Pulse Universal — API reference

Canonical API surface shared across every framework wrapper. Every `@pulse/*` package exposes the same shapes — only the **idiomatic syntax** changes (Vue refs vs React hooks vs Svelte stores vs Angular services).

## Components

### `<PulsePlayer />` / `<pulse-player>` — inline card

| Prop / Attribute               | Type           | Default        | Meaning                                                                                                  |
| ------------------------------ | -------------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `variant`                      | `PulseVariant` | `'auto'`       | Mood: `auto`, `transparent`, `solid`, `dark`, `light`, `sunset`, `midnight`, `aurora`, `vinyl`, `custom` |
| `accentColor` / `accent-color` | `string`       | inherits theme | CSS colour — overrides `--pulse-accent`                                                                  |
| `tracks`                       | `Track[]`      | engine default | Playlist override                                                                                        |
| `ambientEq` / `ambient-eq`     | `boolean`      | `false`        | 12-bar pure-CSS EQ behind chrome                                                                         |
| `dataFab` / `data-fab`         | `boolean`      | `false`        | Force the disc shape regardless of width                                                                 |
| `resizable`                    | `boolean`      | `false`        | Bottom-right drag-to-resize handle                                                                       |
| `githubUrl` / `github-url`     | `string`       | —              | Turns the GitHub icon into a link                                                                        |
| `spotifyUrl` / `spotify-url`   | `string`       | —              | Turns the Spotify icon into a link                                                                       |

### `<PulseFab />` / `<pulse-fab>` — floating action button

| Prop / Attribute             | Type           | Default           | Meaning                                       |
| ---------------------------- | -------------- | ----------------- | --------------------------------------------- |
| `variant`                    | `PulseVariant` | `'auto'`          | Same as `<PulsePlayer />`                     |
| `pulso`                      | `boolean`      | `false`           | Heartbeat ring while audio plays              |
| `showMenu` / `show-menu`     | `boolean`      | `false`           | Palette + Pulso/Fullscreen popover            |
| `draggable`                  | `boolean`      | `false`           | Pointer drag to reposition                    |
| `persistKey` / `persist-key` | `string`       | `'pulse-fab-pos'` | `localStorage` key for the persisted position |

### Events (typed `EventMap` from `@pulse/types`)

| Event         | Payload                                                   | Fired by                                                                                                               |
| ------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `play`        | `{ track: Track, time: number }`                          | `engine.toggle()` when transitioning to playing                                                                        |
| `pause`       | `{ track: Track, time: number }`                          | `engine.toggle()` when transitioning to paused                                                                         |
| `trackchange` | `{ from: number, to: number, track: Track }`              | `engine.next()`, `engine.prev()`, `engine.loadTrack(i)`                                                                |
| `error`       | `{ track: Track, reason: ErrorReason, detail?: unknown }` | autoplay rejection (`'play-rejected'`), `<audio>` error event (`'media-error'`), `<audio>` stalled event (`'stalled'`) |

| Framework                | Listener syntax                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------- |
| Vue 3                    | `@play="…"`, `@pause="…"`, `@trackchange="…"`, `@error="…"`                             |
| React                    | `onPlay={…}`, `onPause={…}`, `onTrackChange={…}`, `onError={…}`                         |
| Svelte 5                 | `onpulse-play={…}` (property) or `on:pulse-play={…}` (directive)                        |
| Angular                  | `(pulse-play)="…"`, `(pulse-pause)="…"`, `(pulse-trackchange)="…"`, `(pulse-error)="…"` |
| Web Components / vanilla | `el.addEventListener('pulse-play', …)`                                                  |

## Keyboard shortcuts (host element with focus)

| Key          | Action              |
| ------------ | ------------------- |
| `Space`, `K` | Toggle play / pause |
| `J`, `←`     | Previous track      |
| `L`, `→`     | Next track          |

Handler ignores keypresses when the target is an `<input>`, `<textarea>`, or `contenteditable` element. The host defaults to `tabIndex="0"`; set `tabindex="-1"` to skip in tab order.

## Engine — `@pulse/core` `PulseEngine`

The framework-agnostic class every wrapper consumes via the shared singleton (`getSharedEngine()` / `setSharedEngine()`).

### State (`PulseState`)

```ts
interface PulseState {
  currentTrack: number // index into the playlist
  isPlaying: boolean
  currentTime: number // seconds
  duration: number // seconds
  isVisible: boolean // FAB visibility flag (used by MiniPlayer)
  hasBeenOpened: boolean // sticky once true
  ambientEq: boolean // ambient EQ visualisation toggle
  playCount: number // privacy-friendly per-session counter
  pauseCount: number
  trackChangeCount: number
}
```

### Computed

```ts
engine.track // Track — clamped to a valid index
engine.progress // number — 0..100 percentage of duration
```

### Actions

```ts
engine.toggle()                      // play / pause
engine.next()                        // → next track (loops)
engine.prev()                        // → previous OR restart current if >3s in
engine.loadTrack(index: number)      // jump to a specific track
engine.seek(fraction: number)        // 0..1 of duration
engine.setAudioTracks(tracks: Track[]) // replace the playlist
engine.setAmbientEq(on: boolean)     // flip the EQ flag
engine.open()                        // show the FAB
engine.close()                       // pause + hide the FAB
engine.dispose()                     // tear down audio graph + listeners
engine.fmt(seconds: number): string  // → '0:42'
```

### Event bus

```ts
import type { EventMap } from '@pulse/types'

const off = engine.subscribe<'play'>('play', ({ track, time }) => {
  analytics.track('play', { id: track.title, time })
})
// later:
off()
```

`subscribe<E extends keyof EventMap>(event: E, cb: (payload: EventMap[E]) => void): Unsubscribe`

Listener errors are caught + logged so a bad consumer can't break the engine.

### State change subscription (framework adapters)

```ts
const off = engine.onStateChange((state: Readonly<PulseState>) => {
  // Project into Vue refs / React state / Svelte runes / Angular signal
})
```

Used by the framework wrappers internally; consumers usually use the framework-specific hook (`usePulseAudio()`).

## Types — `@pulse/types`

Re-exported by every wrapper:

```ts
import type {
  Track,
  PulseVariant, // 'auto' | 'transparent' | 'solid' | 'dark' | 'light' | 'sunset' | 'midnight' | 'aurora' | 'vinyl' | 'custom'
  PulseState,
  EventMap,
  AudioEvent, // keyof EventMap
  EventListener,
  ErrorReason, // 'play-rejected' | 'media-error' | 'stalled'
  Unsubscribe, // () => void
} from '@pulse/<framework>'

import { ALL_VARIANTS } from '@pulse/<framework>'
```

## Theming — `@pulse/tokens`

CSS variables exposed at the `[data-variant='X']` attribute level. Both the Vue v2.3.4 chrome (uses the bare CSS file) and the Web Component Shadow DOM (consumes via Lit's `unsafeCSS(variantsCss)`) read the same source of truth.

```ts
import { variantsCss, baseCss } from '@pulse/tokens'

// String exports for Shadow DOM consumers (Lit, Stencil, …)
```

```css
/* Document-level consumers */
@import '@pulse/tokens/variants.css';
@import '@pulse/tokens/base.css';
@import '@pulse/tokens/animations.css';
```

## See also

- [`docs/universal/ARCHITECTURE.md`](./ARCHITECTURE.md) — dependency graph, build orchestration
- [`docs/universal/FEATURE_MATRIX.md`](./FEATURE_MATRIX.md) — what works in each framework
- [`docs/universal/BLOCKERS.md`](./BLOCKERS.md) — what isn't done and why
- [`docs/frameworks/`](../frameworks/) — per-framework integration guides
