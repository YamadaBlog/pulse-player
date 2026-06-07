# API reference

[← back to README](../README.md)

## `<MusicPlayer />` — inline card

| Prop               | Type                   | Default     | Notes                                                                                                              |
| ------------------ | ---------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------ |
| `variant`          | `MusicPlayerVariant`   | `'auto'`    | One of: `auto`, `transparent`, `solid`, `dark`, `light`, `sunset`, `midnight`, `aurora`, `vinyl`, `custom`.        |
| `customBackground` | `string`               | `undefined` | Any CSS `background` value. Only used when `variant="custom"`.                                                     |
| `accentColor`      | `string`               | `undefined` | Overrides the local accent (progress hover, focus ring). EQ bars are locked to Spotify green and are not affected. |
| `githubUrl`        | `string`               | `undefined` | When set, the GitHub icon becomes a link. Otherwise decorative.                                                    |
| `spotifyUrl`       | `string`               | `undefined` | Same idea for the Spotify icon.                                                                                    |
| `hideIcons`        | `boolean`              | `false`     | Hide both icons entirely.                                                                                          |
| `size`             | `number`               | `undefined` | Manual scale override, ~0.6–1.8. Disables auto-scale.                                                              |
| `noise`            | `boolean`              | `true`      | Subtle SVG grain overlay (the original dashboard signature).                                                       |
| `resizable`        | `boolean`              | `false`     | Show the drag-resize handle in the bottom-right corner.                                                            |
| `minWidth`         | `number`               | `60`        | Floor for the drag handle (px).                                                                                    |
| `maxWidth`         | `number`               | `720`       | Ceiling for the drag handle (px).                                                                                  |
| `width`            | `number \| null`       | `null`      | Programmatic width override. Used by the guided demo and any external controller. `null` releases control.         |
| `ambientEq`        | `boolean \| undefined` | `undefined` | Local override for the ambient EQ. Leave `undefined` to inherit `store.ambientEq`.                                 |

## `<MiniPlayer />` — floating FAB

| Prop               | Type                                  | Default                     | Notes                                                                                     |
| ------------------ | ------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| `variant`          | `MiniPlayerVariant`                   | `'auto'`                    | Same union as `MusicPlayerVariant`.                                                       |
| `customBackground` | `string`                              | `undefined`                 | For `variant="custom"`.                                                                   |
| `accentColor`      | `string`                              | `undefined`                 | Overrides the ring + accent. EQ bars stay Spotify green.                                  |
| `size`             | `number`                              | `56`                        | FAB diameter (px). Recommended ≥ 40.                                                      |
| `offset`           | `{ bottom?: number; right?: number }` | `{ bottom: 32, right: 16 }` | Corner anchor (px).                                                                       |
| `persistKey`       | `string`                              | `'pulse-player-fab-pos'`    | `localStorage` key for the dragged position. Pass an empty string to disable persistence. |
| `pulso`            | `boolean`                             | `false`                     | Heartbeat ring + halo. Only animates while audio is playing — fully silent at idle.       |
| `position`         | `{ x: number; y: number } \| null`    | `null`                      | Programmatic position override (used by the guided demo). `null` releases control.        |

## `useAudioStore` — Pinia store

### State

| Field              | Type                   | Notes                                                                                                                                                                    |
| ------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `currentTrack`     | `Ref<number>`          | Index in the active track list.                                                                                                                                          |
| `isPlaying`        | `Ref<boolean>`         |                                                                                                                                                                          |
| `currentTime`      | `Ref<number>`          | Seconds.                                                                                                                                                                 |
| `duration`         | `Ref<number>`          | Seconds.                                                                                                                                                                 |
| `eqBars`           | `ShallowRef<number[]>` | 4-bar FFT for NOW PLAYING / FAB chrome. Updated 60 fps.                                                                                                                  |
| `eqAmbientBars`    | `ShallowRef<number[]>` | 32 zeros. Kept as a stable reference for custom visualisers; the built-in ambient EQ is now driven by a pure-CSS @keyframes animation, so this ref is no longer mutated. |
| `isVisible`        | `Ref<boolean>`         | FAB visible.                                                                                                                                                             |
| `hasBeenOpened`    | `Ref<boolean>`         | True after first play, persists in-memory.                                                                                                                               |
| `ambientEq`        | `Ref<boolean>`         | **Global** ambient EQ toggle — every `<MusicPlayer />` without a local override follows this.                                                                            |
| `playCount`        | `Ref<number>`          | Local-only play counter. Privacy-friendly: no network, no third-party.                                                                                                   |
| `pauseCount`       | `Ref<number>`          | Same for pause events.                                                                                                                                                   |
| `trackChangeCount` | `Ref<number>`          | Increments on `next`, `prev`, `loadTrack` (only when the track actually changes).                                                                                        |

### Getters

| Getter     | Type                   | Notes                         |
| ---------- | ---------------------- | ----------------------------- |
| `progress` | `ComputedRef<number>`  | 0–100.                        |
| `track`    | `ComputedRef<Track>`   | The currently selected track. |
| `tracks`   | `ComputedRef<Track[]>` | The full list.                |

### Actions

| Action                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `toggle()`              | Play or pause. First call initialises the Web Audio graph (browser autoplay rules apply). Emits `'play'` or `'pause'`.                                                                                                                                                                                                                                                                                                                    |
| `next()`                | Advance one track. Emits `'trackchange'`.                                                                                                                                                                                                                                                                                                                                                                                                 |
| `prev()`                | Restart the current track if past 3 s, else step back one. May emit `'trackchange'`.                                                                                                                                                                                                                                                                                                                                                      |
| `loadTrack(i)`          | Jump to track index. No-op if same. Emits `'trackchange'` when index changes.                                                                                                                                                                                                                                                                                                                                                             |
| `seek(fraction)`        | Seek by ratio 0–1.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `open()`                | Show the FAB.                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `close()`               | Pause + hide the FAB.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `fmt(seconds)`          | Formats seconds as `m:ss`.                                                                                                                                                                                                                                                                                                                                                                                                                |
| `subscribe(event, cb)`  | Opt-in, typed event bus. See **Events** below. Returns an unsubscribe function.                                                                                                                                                                                                                                                                                                                                                           |
| `dispose()`             | Tear down the audio graph: pauses + drops the `<audio>` element, disconnects the source + analyser nodes, closes the `AudioContext`, clears the event-bus listener map, resets `isPlaying`, `isVisible`, `currentTime`, `duration`. Call from `onBeforeUnmount` in long-lived shells (browser extensions, hot-reloaded SPAs). The next `toggle()` re-initialises everything from scratch. Idempotent and safe to call without prior init. |
| `registerAmbientView()` | Kept as a stable no-op since v1.0.2. The ambient EQ is now a pure-CSS animation with no per-frame JavaScript cost, so there's no visibility gating left to do. Returns a no-op unsubscribe; safe to call from old integrations.                                                                                                                                                                                                           |

### Events

Opt-in event bus, zero overhead when nothing subscribes. See [`EVENTS.md`](./EVENTS.md) for full coverage of patterns, integration recipes, and privacy posture.

```ts
const store = useAudioStore()
// `cb`'s payload is narrowed to the matching shape at the callsite —
// no `as` casts needed.
const unsubscribe = store.subscribe('play', ({ track, time }) => {
  // track: Track, time: number
})
// later
unsubscribe()
```

| Event           | Payload                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| `'play'`        | `{ track: Track, time: number }`                                                            |
| `'pause'`       | `{ track: Track, time: number }`                                                            |
| `'trackchange'` | `{ from: number, to: number, track: Track }`                                                |
| `'error'`       | `{ track: Track, reason: 'play-rejected' \| 'media-error' \| 'stalled', detail?: unknown }` |

The `'error'` event covers three real-world failure modes:

- **`'play-rejected'`** — the browser refused `audio.play()` (autoplay
  policy, gesture consumed, …). `isPlaying` is rolled back automatically.
- **`'media-error'`** — the `<audio>` element reported `error`
  (404, codec, decoding). `detail` is the `MediaError` object.
- **`'stalled'`** — the network buffer fell behind. Often transient;
  no UI state is changed automatically.

## Accessibility — keyboard surface

| Element                            | Role        | Keyboard                                                                                      |
| ---------------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| `MusicPlayer` artwork (`.mp__art`) | `button`    | `Enter` / `Space` toggle play / pause                                                         |
| `MusicPlayer` progress bar         | `slider`    | `←` / `→` ± 5 %, `Shift+←/→` ± 1 %, `PageUp` / `PageDown` ± 10 %, `Home` / `End` 0 % / 100 %  |
| `MusicPlayer` skip buttons         | `button`    | `Enter` / `Space`                                                                             |
| `MusicPlayer` resize handle        | `separator` | (mouse / pointer only — keyboard resize not yet wired)                                        |
| `MusicPlayer` icon links           | `link`      | `Enter`                                                                                       |
| `MiniPlayer` FAB                   | `button`    | `Enter` / `Space` toggle, plus `aria-haspopup` / `aria-expanded` when the radial menu is open |
| `MiniPlayer` radial menu container | `menu`      | `Escape` closes, restores focus to FAB                                                        |
| `MiniPlayer` menu items            | `menuitem`  | `↑` / `↓` / `←` / `→` cycle, `Home` / `End` jump to first / last                              |

All animated surfaces (ambient EQ, pulso ripples, FAB pop transition, demo-tour tweens) are short-circuited when `(prefers-reduced-motion: reduce)` matches. The ambient EQ is hidden entirely; the pulso heartbeat freezes at scale 1; the demo tour snaps tweens to their end value.

## Types

```ts
export interface Track {
  title: string
  src: string
  cover: string
  coverPos: string
  coverScale?: number
}

export type PulseVariant =
  | 'auto'
  | 'transparent'
  | 'solid'
  | 'dark'
  | 'light'
  | 'sunset'
  | 'midnight'
  | 'aurora'
  | 'vinyl'
  | 'custom'

// Component-specific aliases kept for backward compatibility.
export type MusicPlayerVariant = PulseVariant
export type MiniPlayerVariant = PulseVariant

export const ALL_VARIANTS: readonly PulseVariant[]
```

### Event types

The event bus is typed via a discriminated union so `subscribe<E>(event, cb)` narrows `cb`'s payload at the callsite.

```ts
type EventMap = {
  play: { track: Track; time: number }
  pause: { track: Track; time: number }
  trackchange: { from: number; to: number; track: Track }
  error: {
    track: Track
    reason: 'play-rejected' | 'media-error' | 'stalled'
    detail?: unknown
  }
}
```

## Public exports

```ts
import {
  MusicPlayer,
  MiniPlayer,
  useAudioStore,
  setAudioTracks,
  type Track,
  type PulseVariant,
  ALL_VARIANTS,
  type MusicPlayerVariant,
  type MiniPlayerVariant,
} from 'pulse-player' // when published as a package
```

`setAudioTracks(list)` replaces the global track list and **must** be called before the store is first consumed (i.e. before `<MiniPlayer />` or `<MusicPlayer />` mount). If the list passed in is shorter than the current `currentTrack` index, the `track` computed clamps to the new range (no template crash); call `loadTrack(0)` after `setAudioTracks` if you want a clean reset.
