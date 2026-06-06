# API reference

[← back to README](../README.md)

## `<MusicPlayer />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `MusicPlayerVariant` | `'auto'` | Background preset. See [Customization](./CUSTOMIZATION.md). |
| `customBackground` | `string` | — | Any CSS `background` value. Used when `variant="custom"`. |
| `accentColor` | `string` | — | Overrides the local accent (EQ bars, scrub hover, focus ring). |
| `githubUrl` | `string` | — | If set, the GitHub icon becomes a link. Without it, the icon is decorative. |
| `spotifyUrl` | `string` | — | If set, the Spotify icon becomes a link (album, playlist, profile). Without it, decorative. |
| `hideIcons` | `boolean` | `false` | Hide both icons entirely. |
| `size` | `number` | _(auto)_ | Override the auto-responsive scale. Range `0.6` – `1.8`. |

```ts
type MusicPlayerVariant =
  | 'auto'         // live cover-art blur backdrop (default)
  | 'vinyl'        // warm analog · vinyl + leather
  | 'sunset'       // sepia / brown gradient
  | 'midnight'     // deep navy → violet
  | 'aurora'       // teal / cyan night
  | 'dark'         // neutral dark surface
  | 'light'        // light-mode inversion
  | 'transparent'  // frameless, sits over your bg
  | 'solid'        // your `--pulse-bg` color
  | 'custom'       // your `customBackground` CSS
```

## `<MiniPlayer />`

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `MiniPlayerVariant` | `'auto'` | `'auto'` shows the cover art inside the circle; presets fill with a solid / gradient. |
| `customBackground` | `string` | — | CSS background for `variant="custom"`. |
| `accentColor` | `string` | — | Overrides the ring + EQ accent locally. |
| `size` | `number` | `56` | FAB diameter in pixels (min recommended 40). |
| `offset` | `{ bottom?: number; right?: number }` | `{ bottom: 32, right: 16 }` | Position offset from the bottom-right corner. |

## `useAudioStore()`

Reactive state — every property is a Vue `ref` you can read in components or watch with `watch()`.

| | Type | Notes |
|---|---|---|
| `currentTrack` | `number` | Index in the playlist. |
| `isPlaying` | `boolean` | Live playback flag. |
| `currentTime` / `duration` | `number` | Seconds. |
| `progress` | `number` (computed) | `0–100`. |
| `eqBars` | `number[]` | 4-band FFT energies, `0–1`. |
| `track` / `tracks` | computed | Current `Track` / full playlist. |
| `isVisible` | `boolean` | Whether the floating FAB should render. |
| `hasBeenOpened` | `boolean` | `true` after the user starts playback at least once. |

Actions — call them like store methods.

| Action | Effect |
|---|---|
| `toggle()` | Initialize audio on first call, then play ↔ pause. Flips `isVisible` on first play. |
| `next()` / `prev()` | Wraps to start/end. `prev` restarts the current track if `currentTime > 3s`. |
| `loadTrack(i)` | Jump to track `i`. Keeps playing if already playing. |
| `seek(fraction)` | `fraction ∈ [0, 1]`. |
| `open()` / `close()` | Show / hide the floating FAB (`close` also pauses). |
| `fmt(seconds)` | Format helper returning `m:ss`. |

## `setAudioTracks(tracks)`

Replace the global playlist before mount.

```ts
import { setAudioTracks } from './lib'

setAudioTracks([
  { title: 'YOUR TRACK',  src: '/music/01.mp3', cover: '/img/01.jpg', coverPos: '50% 40%' },
  { title: 'ANOTHER ONE', src: '/music/02.mp3', cover: '/img/02.jpg', coverPos: 'center', coverScale: 1.1 },
])

createApp(App).use(createPinia()).mount('#app')
```

## `Track`

```ts
interface Track {
  title: string        // shown in the inline player
  src: string          // any browser-supported codec
  cover: string        // cover image URL
  coverPos: string     // CSS object-position (e.g. '50% 60%')
  coverScale?: number  // optional CSS scale applied to the cover (1.25 = +25 % zoom)
}
```
