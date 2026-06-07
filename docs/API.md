# API reference

[← back to README](../README.md)

## `<MusicPlayer />` — inline card

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `MusicPlayerVariant` | `'auto'` | One of: `auto`, `transparent`, `solid`, `dark`, `light`, `sunset`, `midnight`, `aurora`, `vinyl`, `custom`. |
| `customBackground` | `string` | `undefined` | Any CSS `background` value. Only used when `variant="custom"`. |
| `accentColor` | `string` | `undefined` | Overrides the local accent (progress hover, focus ring). EQ bars are locked to Spotify green and are not affected. |
| `githubUrl` | `string` | `undefined` | When set, the GitHub icon becomes a link. Otherwise decorative. |
| `spotifyUrl` | `string` | `undefined` | Same idea for the Spotify icon. |
| `hideIcons` | `boolean` | `false` | Hide both icons entirely. |
| `size` | `number` | `undefined` | Manual scale override, ~0.6–1.8. Disables auto-scale. |
| `noise` | `boolean` | `true` | Subtle SVG grain overlay (the original dashboard signature). |
| `resizable` | `boolean` | `false` | Show the drag-resize handle in the bottom-right corner. |
| `minWidth` | `number` | `60` | Floor for the drag handle (px). |
| `maxWidth` | `number` | `720` | Ceiling for the drag handle (px). |
| `width` | `number \| null` | `null` | Programmatic width override. Used by the guided demo and any external controller. `null` releases control. |
| `ambientEq` | `boolean \| undefined` | `undefined` | Local override for the ambient EQ. Leave `undefined` to inherit `store.ambientEq`. |

## `<MiniPlayer />` — floating FAB

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `MiniPlayerVariant` | `'auto'` | Same union as `MusicPlayerVariant`. |
| `customBackground` | `string` | `undefined` | For `variant="custom"`. |
| `accentColor` | `string` | `undefined` | Overrides the ring + accent. EQ bars stay Spotify green. |
| `size` | `number` | `56` | FAB diameter (px). Recommended ≥ 40. |
| `offset` | `{ bottom?: number; right?: number }` | `{ bottom: 32, right: 16 }` | Corner anchor (px). |
| `persistKey` | `string` | `'pulse-player-fab-pos'` | `localStorage` key for the dragged position. Pass an empty string to disable persistence. |
| `pulso` | `boolean` | `false` | Heartbeat ring + halo. Only animates while audio is playing — fully silent at idle. |
| `position` | `{ x: number; y: number } \| null` | `null` | Programmatic position override (used by the guided demo). `null` releases control. |

## `useAudioStore` — Pinia store

### State

| Field | Type | Notes |
|---|---|---|
| `currentTrack` | `Ref<number>` | Index in the active track list. |
| `isPlaying` | `Ref<boolean>` | |
| `currentTime` | `Ref<number>` | Seconds. |
| `duration` | `Ref<number>` | Seconds. |
| `eqBars` | `ShallowRef<number[]>` | 4-bar FFT for NOW PLAYING / FAB chrome. Updated 60 fps. |
| `eqAmbientBars` | `ShallowRef<number[]>` | 64-bar FFT for ambient EQ. Updated 30 fps. |
| `isVisible` | `Ref<boolean>` | FAB visible. |
| `hasBeenOpened` | `Ref<boolean>` | True after first play, persists in-memory. |
| `ambientEq` | `Ref<boolean>` | **Global** ambient EQ toggle — every `<MusicPlayer />` without a local override follows this. |
| `playCount` | `Ref<number>` | Local-only play counter. Privacy-friendly: no network, no third-party. |
| `pauseCount` | `Ref<number>` | Same for pause events. |
| `trackChangeCount` | `Ref<number>` | Increments on `next`, `prev`, `loadTrack` (only when the track actually changes). |

### Getters

| Getter | Type | Notes |
|---|---|---|
| `progress` | `ComputedRef<number>` | 0–100. |
| `track` | `ComputedRef<Track>` | The currently selected track. |
| `tracks` | `ComputedRef<Track[]>` | The full list. |

### Actions

| Action | Notes |
|---|---|
| `toggle()` | Play or pause. First call initialises the Web Audio graph (browser autoplay rules apply). Emits `'play'` or `'pause'`. |
| `next()` | Advance one track. Emits `'trackchange'`. |
| `prev()` | Restart the current track if past 3 s, else step back one. May emit `'trackchange'`. |
| `loadTrack(i)` | Jump to track index. No-op if same. Emits `'trackchange'` when index changes. |
| `seek(fraction)` | Seek by ratio 0–1. |
| `open()` | Show the FAB. |
| `close()` | Pause + hide the FAB. |
| `fmt(seconds)` | Formats seconds as `m:ss`. |
| `subscribe(event, cb)` | See **Events** below. Returns an unsubscribe function. |

### Events

Opt-in event bus, zero overhead when nothing subscribes. See [`EVENTS.md`](./EVENTS.md) for full coverage.

```ts
const store = useAudioStore()
const unsubscribe = store.subscribe('play', ({ track, time }) => {
  // your analytics, telemetry, side effects, …
})
// later
unsubscribe()
```

| Event | Payload |
|---|---|
| `'play'` | `{ track: Track, time: number }` |
| `'pause'` | `{ track: Track, time: number }` |
| `'trackchange'` | `{ from: number, to: number, track: Track }` |

## Types

```ts
export interface Track {
  title: string
  src: string
  cover: string
  coverPos: string
  coverScale?: number
}

export type MusicPlayerVariant =
  | 'auto' | 'transparent' | 'solid' | 'dark' | 'light'
  | 'sunset' | 'midnight' | 'aurora' | 'vinyl' | 'custom'

export type MiniPlayerVariant =
  | 'auto' | 'transparent' | 'solid' | 'dark' | 'light'
  | 'sunset' | 'midnight' | 'aurora' | 'vinyl' | 'custom'
```

The two unions are intentionally identical — declared in each component for module-level type narrowing without a circular dependency.

## Public exports

```ts
import {
  MusicPlayer,
  MiniPlayer,
  useAudioStore,
  setAudioTracks,
  type Track,
  type MusicPlayerVariant,
  type MiniPlayerVariant,
} from 'pulse-player'   // when published as a package
```

`setAudioTracks(list)` replaces the global track list and **must** be called before the store is first consumed (i.e. before `<MiniPlayer />` or `<MusicPlayer />` mount).
