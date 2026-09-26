# Migrating to 3.0

## From the 3.0 release candidates (`@pulse-music/*@3.0.0-rc.x`)

**Elements**

| Before                                   | Now                                                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `github-url`, `spotify-url`              | Removed. Put your own links in the `actions` slot: `<a slot="actions" href="…">…</a>`                            |
| `data-fab` on `<pulse-player>`           | Removed — the disc shape is automatic below 128 px.                                                              |
| `<pulse-fab draggable>`                  | Dragging is on by default; use `locked` to disable it. (The old name shadowed the native `draggable` attribute.) |
| `<pulse-fab show-menu>`                  | The menu is always available (⋯ badge, long-press, right-click, <kbd>Shift</kbd>+<kbd>F10</kbd>).                |
| `<pulse-fab>` was positioned in the flow | It is now fixed to a screen corner — use `placement="inline"` for the old behaviour.                             |
| Events bubbled and were composed         | Events are dispatched on the element only (no duplicates with several players). Listen on the element.           |
| J / L / ← / → changed tracks             | J / L seek ±10 s; <kbd>Shift</kbd>+<kbd>N</kbd>/<kbd>P</kbd> change tracks; arrows seek on the progress bar.     |

**Engine**

| Before                                                   | Now                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `eqBars`, `eqAmbientBars`, `registerAmbientView()`       | `engine.onFrame(({ bands, energy }) => …)`                                           |
| `setAudioTracks(t)` / `loadTrack(i)`                     | `setTracks(t)` / `load(i)` (old names still work, deprecated)                        |
| `track` always a `Track`                                 | `track` is `Track \| null` for an empty playlist                                     |
| error reason `'stalled'`                                 | Removed; buffering is reported by `state.isLoading`                                  |
| Default demo playlist (`/audio/track1.webm`…)            | Engines start empty — pass your tracks                                               |
| `play`/`pause` events fired optimistically on `toggle()` | They fire when the audio element actually starts or pauses (also for OS media keys). |
| Mutable `engine.state`                                   | Immutable snapshot, replaced on every change                                         |

**Packaging:** all packages are ESM-only.

**Angular:** `@pulse-music/angular` is gone — it was an empty `NgModule` and could not be consumed from npm. Use the elements directly with `CUSTOM_ELEMENTS_SCHEMA` ([guide](./frameworks.md#angular)).

## From the 2.x Vue library (`src/lib`, Pinia)

The Vue single-file components and the Pinia store were a second, frozen implementation of the player. They are replaced by `@pulse-music/vue`, which wraps the shared elements:

| 2.x                                             | 3.0                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `app.use(createPinia())`                        | Not needed.                                                                         |
| `<MusicPlayer variant="…" />`                   | `<PulsePlayer variant="…" />`                                                       |
| `<MiniPlayer />`                                | `<PulseFab />`                                                                      |
| `setAudioTracks(tracks)`                        | `<PulsePlayer :tracks="tracks" />` or `getSharedEngine().setTracks(tracks)`         |
| `useAudioStore()`                               | `usePulseAudio()` — `state`, `track`, `isPlaying` and the actions                   |
| `store.subscribe('play', cb)`                   | `usePulseAudio().subscribe('play', cb)`                                             |
| `size`, `width`, `min-width`, `max-width` props | Size the element with CSS; `resizable` + `resize-min` / `resize-max` for the handle |
| `noise` prop                                    | `grain`                                                                             |
| `hide-icons`, `github-url`, `spotify-url`       | The `actions` slot                                                                  |
| MiniPlayer `offset`, `position`                 | `placement` and the drag-to-edge behaviour                                          |
