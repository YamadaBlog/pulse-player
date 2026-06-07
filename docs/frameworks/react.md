# Pulse for React (`@pulse/react`)

React 18 / 19 wrapper. Hooks + JSX components built on top of `@pulse/web-component`.

> ✅ **Honest status (v3.0.0-alpha.10):** the React wrapper code is shipped (`<PulsePlayer />`, `<PulseFab />`, `usePulseAudio()`, `useDomEvent()`) and **tested via Vitest + React Testing Library (16 / 16)**. The underlying `<pulse-player>` Custom Element is at **~95 % chrome parity** vs Vue v2.3.4. A real Vite + React demo runs at `apps/demo-react/` — `npm run dev --workspace=@pulse/demo-react` → http://localhost:5181.

## Install

```bash
npm install @pulse/react
# Peer deps: react ^18 || ^19, react-dom ^18 || ^19
```

`@pulse/react` side-effect-imports `@pulse/web-component`, which registers `<pulse-player>` and `<pulse-fab>` Custom Elements globally. You don't need a second import.

## Quick start

```tsx
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse/react'

export function App() {
  const { isPlaying, track, currentTime, fmt, toggle } = usePulseAudio()

  return (
    <>
      <PulsePlayer
        variant="midnight"
        accentColor="#8B5CF6"
        ambientEq
        resizable
        githubUrl="https://github.com/YamadaBlog/pulse-player"
        spotifyUrl="https://open.spotify.com/"
        onPlay={({ track, time }) => analytics.track('play', { id: track.title, time })}
        onError={({ reason }) => toast.warn(`Audio error: ${reason}`)}
      />

      <PulseFab variant="vinyl" pulso draggable showMenu />

      <p>
        {isPlaying ? '▶' : '⏸'} {track.title} · {fmt(currentTime)}
      </p>
      <button onClick={toggle}>Toggle</button>
    </>
  )
}
```

## `<PulsePlayer />` props

| Prop                 | Type                | Default        | Meaning                                                                                                          |
| -------------------- | ------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| `variant`            | `PulseVariant`      | `'auto'`       | Mood. One of: `auto`, `transparent`, `solid`, `dark`, `light`, `sunset`, `midnight`, `aurora`, `vinyl`, `custom` |
| `accentColor`        | `string?`           | inherits theme | CSS colour — overrides `--pulse-accent`                                                                          |
| `tracks`             | `Track[]?`          | engine default | Override the playlist                                                                                            |
| `ambientEq`          | `boolean`           | `false`        | Background EQ visualisation                                                                                      |
| `dataFab`            | `boolean`           | `false`        | Force the FAB disc shape regardless of width                                                                     |
| `resizable`          | `boolean`           | `false`        | Bottom-right drag-to-resize handle                                                                               |
| `githubUrl`          | `string?`           | —              | Turns the GitHub icon into a link                                                                                |
| `spotifyUrl`         | `string?`           | —              | Turns the Spotify icon into a link                                                                               |
| `onPlay`             | `(payload) => void` | —              | `{ track, time }` synchronous with `engine.toggle()`                                                             |
| `onPause`            | `(payload) => void` | —              | `{ track, time }`                                                                                                |
| `onTrackChange`      | `(payload) => void` | —              | `{ from, to, track }`                                                                                            |
| `onError`            | `(payload) => void` | —              | `{ track, reason, detail? }`, `reason ∈ { 'play-rejected', 'media-error', 'stalled' }`                           |
| `className`, `style` | passthrough         | —              | Standard React layout props                                                                                      |

## `<PulseFab />` props

| Prop                                                                  | Type           | Default           | Meaning                                                   |
| --------------------------------------------------------------------- | -------------- | ----------------- | --------------------------------------------------------- |
| `variant`                                                             | `PulseVariant` | `'auto'`          | Same as `<PulsePlayer />`                                 |
| `pulso`                                                               | `boolean`      | `false`           | Heartbeat ring while audio plays                          |
| `showMenu`                                                            | `boolean`      | `false`           | Chevron toggle opens palette + Pulso + Fullscreen popover |
| `draggable`                                                           | `boolean`      | `false`           | Pointer drag to reposition                                |
| `persistKey`                                                          | `string?`      | `'pulse-fab-pos'` | `localStorage` key for the persisted position             |
| `onPlay`, `onPause`, `onTrackChange`, `onError`, `className`, `style` | —              | —                 | Same as `<PulsePlayer />`                                 |

## `usePulseAudio()` hook

```tsx
const {
  // State (re-renders on change)
  isPlaying,
  currentTime,
  duration,
  isVisible,
  hasBeenOpened,
  ambientEq,
  playCount,
  pauseCount,
  trackChangeCount,
  currentTrack,
  // Computed
  track,
  progress,
  // Actions (stable identity)
  toggle,
  next,
  prev,
  seek,
  setAudioTracks,
  setAmbientEq,
  // Event bus
  subscribe, // typed: subscribe('play', ({ track, time }) => …)
  // Utility
  fmt, // (seconds: number) => '0:42'
} = usePulseAudio()
```

The hook is stable across renders (action callbacks wrapped in `useCallback`) — pass them to memoised children without forcing re-renders.

## Architecture

`<PulsePlayer />` and `<PulseFab />` are thin adapters (~110 LOC each) around `<pulse-player>` and `<pulse-fab>` Custom Elements from `@pulse/web-component`:

- camelCase props → kebab-case attributes (`accentColor` → `accent-color`)
- `on{Event}` props → DOM `CustomEvent` listeners via `useRef` + `useEffect` (the shared `useDomEvent` hook collapses the bridge to a single line per event)
- Boolean presence attributes set / removed imperatively for React 18 safety (React 18 doesn't reliably serialise `false` as "remove the attribute")
- Listener cleanup on every prop change AND unmount — zero leaks

React 19+ has native Custom Element support — kebab-case attributes and on-handlers work in JSX directly. React 18 needs the wrapper's attribute / event bridging; the package handles both transparently.

## Keyboard shortcuts (host element)

When `<pulse-player>` (or `<PulsePlayer />`) has keyboard focus:

| Key           | Action              |
| ------------- | ------------------- |
| `Space` / `K` | Toggle play / pause |
| `J` / `←`     | Previous track      |
| `L` / `→`     | Next track          |

The host element exposes `tabIndex="0"` by default; consumers in an interactive container can override with `<PulsePlayer tabIndex={-1} />` to skip it in the tab order.

## TypeScript

The package ships `.d.ts` types and augments JSX intrinsic elements so `<pulse-player>` and `<pulse-fab>` are type-checked in TSX even outside `<PulsePlayer />` / `<PulseFab />`. The `PulsePlayerProps` and `PulseFabProps` interfaces are exported for advanced use cases (extending, prop-spreading).

## License

MIT. See the repo root for the full text.

## See also

- [`docs/frameworks/web-component.md`](./web-component.md) — the underlying Custom Element API + browser support
- [`docs/universal/ARCHITECTURE.md`](../universal/ARCHITECTURE.md) — how `@pulse/react` fits into the multi-framework stack
