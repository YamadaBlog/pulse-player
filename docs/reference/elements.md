# Web Components reference

`@pulse-music/web-component` registers three elements as soon as it is imported. Registration is idempotent, so importing the package from several bundles never throws.

A machine-readable [Custom Elements Manifest](https://custom-elements-manifest.open-wc.org/) (`custom-elements.json`) ships with the package for IDEs and doc tools.

- [`<pulse-player>`](#pulse-player) — the inline player card
- [`<pulse-fab>`](#pulse-fab) — the floating mini player
- [`<pulse-track>`](#pulse-track) — a declarative playlist entry
- [Sessions](#sessions) · [Events](#events) · [Labels](#labels) · [Keyboard](#keyboard)

---

## `<pulse-player>`

```html
<pulse-player variant="midnight" accent-color="#a78bfa" ambient-eq resizable></pulse-player>
```

The card fills the width of its container and adapts to it:

| Container width | Layout                                                         |
| --------------- | -------------------------------------------------------------- |
| ≥ 460 px        | Full: artwork, equaliser, title, artist, transport, time, mute |
| 360 – 459 px    | Mute button folds away                                         |
| 280 – 359 px    | Time and the `actions` slot fold away                          |
| 210 – 279 px    | Previous / next fold away                                      |
| 128 – 209 px    | Compact: artwork, title and play                               |
| < 128 px        | Disc: round artwork with a progress ring                       |

Give the element a width in flex/grid layouts (it is a size container, so it doesn't size itself from its content).

### Attributes and properties

| Attribute           | Property           | Type                        | Default              | Description                                                                                                                                                                       |
| ------------------- | ------------------ | --------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `variant`           | `variant`          | [`PulseVariant`](#variants) | `'auto'`             | Theme. Reflected.                                                                                                                                                                 |
| `accent-color`      | `accentColor`      | CSS colour                  | —                    | Accent for progress, equaliser, focus rings. `auto` samples it from the cover when unset.                                                                                         |
| `custom-background` | `customBackground` | CSS `background`            | —                    | Background used by `variant="custom"`.                                                                                                                                            |
| `ambient-eq`        | `ambientEq`        | boolean                     | engine's `ambientEq` | Live equaliser drawn behind the card.                                                                                                                                             |
| `grain`             | `grain`            | boolean                     | `true`               | Film-grain overlay; `grain="false"` removes it.                                                                                                                                   |
| `resizable`         | `resizable`        | boolean                     | `false`              | Corner handle to resize the player: pointer drag, or arrow keys / <kbd>Home</kbd> / <kbd>End</kbd> when focused; <kbd>Enter</kbd> or a double-click restores the automatic width. |
| `resize-min`        | `resizeMin`        | number (px)                 | `64`                 | Minimum width while resizing.                                                                                                                                                     |
| `resize-max`        | `resizeMax`        | number (px)                 | `760`                | Maximum width while resizing (also bounded by the parent).                                                                                                                        |
| `session`           | `session`          | string                      | `'default'`          | [Audio session](#sessions) to join.                                                                                                                                               |
| —                   | `engine`           | `PulseEngine`               | —                    | Bind to an explicit engine instead of a named session.                                                                                                                            |
| —                   | `tracks`           | `Track[]`                   | —                    | Replace the session's playlist.                                                                                                                                                   |
| —                   | `labels`           | `Partial<PulseLabels>`      | —                    | [Localised strings](#labels).                                                                                                                                                     |

### Slots

| Slot      | Description                                                                    |
| --------- | ------------------------------------------------------------------------------ |
| `actions` | Extra controls in the top-right corner of wide players — links, share buttons… |

Light-DOM `<pulse-track>` children are read as the playlist and are never rendered.

### CSS parts

`player`, `artwork`, `title`, `artist`, `controls`, `progress`, `time`.

```css
pulse-player::part(title) {
  font-family: 'Fraunces', serif;
  letter-spacing: 0;
}
```

### CSS custom properties

| Property         | Description                                      |
| ---------------- | ------------------------------------------------ |
| `--pulse-accent` | Accent colour (same as `accent-color`).          |
| `--pulse-bg`     | Card background.                                 |
| `--pulse-fg`     | Text and icon colour.                            |
| `--pulse-muted`  | Secondary text colour.                           |
| `--pulse-border` | Hairline border colour.                          |
| `--pulse-radius` | Corner radius of the card.                       |
| `--pulse-font`   | Font family (inherits from the page by default). |
| `--pulse-shadow` | Outer shadow.                                    |
| `--pulse-ink`    | Icon colour on the main play button.             |
| `--pulse-error`  | Colour of the error message.                     |

### Custom states

Style the host from the outside with [`:state()`](https://developer.mozilla.org/docs/Web/CSS/:state):

```css
pulse-player:state(playing) {
  outline: 1px solid var(--brand);
}
pulse-player:state(loading) {
  cursor: progress;
}
pulse-player:state(error) {
  opacity: 0.8;
}
```

---

## `<pulse-fab>`

```html
<pulse-fab placement="bottom-end" pulso></pulse-fab>
```

A floating disc bound to the same session. Tap to play or pause; drag it anywhere and it springs to the nearest screen edge, remembering the spot in `localStorage`. Long-press, right-click, the ⋯ badge or <kbd>Shift</kbd>+<kbd>F10</kbd> open a menu with previous, next and close.

| Attribute      | Property      | Type                                                                     | Default                | Description                                                      |
| -------------- | ------------- | ------------------------------------------------------------------------ | ---------------------- | ---------------------------------------------------------------- |
| `variant`      | `variant`     | `PulseVariant`                                                           | `'auto'`               | Theme.                                                           |
| `accent-color` | `accentColor` | CSS colour                                                               | —                      | Accent colour.                                                   |
| `placement`    | `placement`   | `'bottom-end' \| 'bottom-start' \| 'top-end' \| 'top-start' \| 'inline'` | `'bottom-end'`         | Screen corner, or `inline` to sit in the document flow.          |
| `reveal`       | `reveal`      | `'on-play' \| 'always'`                                                  | `'on-play'`            | Show once playback starts, or immediately.                       |
| `size`         | `size`        | number (px)                                                              | `64`                   | Diameter.                                                        |
| `pulso`        | `pulso`       | boolean                                                                  | `false`                | Heartbeat ripple while playing.                                  |
| `locked`       | `locked`      | boolean                                                                  | `false`                | Disable dragging.                                                |
| `persist-key`  | `persistKey`  | string                                                                   | `'pulse-fab-position'` | Storage key for the dragged position; `""` disables persistence. |
| `session`      | `session`     | string                                                                   | `'default'`            | Audio session.                                                   |
| —              | `engine`      | `PulseEngine`                                                            | —                      | Explicit engine.                                                 |
| —              | `labels`      | `Partial<PulseLabels>`                                                   | —                      | Localised strings.                                               |

CSS: `--pulse-accent`, `--pulse-fab-z` (stacking order, default `1000`). The disc respects `env(safe-area-inset-*)`.

Choosing **Close** in the menu pauses playback and hides the FAB (with `reveal="on-play"`) until music starts again.

---

## `<pulse-track>`

Declares a playlist entry in markup. Changes to the children or their attributes update the playlist live.

```html
<pulse-player>
  <pulse-track
    src="/a.mp3"
    title="Intro"
    artist="Me"
    album="Demo"
    cover="/a.jpg"
    cover-pos="50% 20%"
    cover-scale="1.1"
  ></pulse-track>
  <pulse-track src="/b.mp3" title="Outro"></pulse-track>
</pulse-player>
```

| Attribute     | Maps to                                   |
| ------------- | ----------------------------------------- |
| `src`         | `Track.src` (required)                    |
| `title`       | `Track.title` (defaults to the file name) |
| `artist`      | `Track.artist`                            |
| `album`       | `Track.album`                             |
| `cover`       | `Track.cover`                             |
| `cover-pos`   | `Track.coverPos` — CSS `object-position`  |
| `cover-scale` | `Track.coverScale`                        |

---

## Sessions

All players with the same `session` (default: `'default'`) share one audio element and stay in sync. Give a player its own session for an independent stream — for example a podcast next to background music:

```html
<pulse-player session="music"></pulse-player> <pulse-player session="podcast"></pulse-player>
```

To configure a session's engine (options, CORS…), install your own before the players mount:

```js
import { PulseEngine, setSharedEngine } from '@pulse-music/web-component'

setSharedEngine(new PulseEngine({ tracks, crossOrigin: 'anonymous', repeat: 'none' }), 'music')
```

## Events

Both players dispatch these on the element itself. They don't bubble, so a page with several players never receives duplicates.

| Event               | `detail`                    | When                                                                                |
| ------------------- | --------------------------- | ----------------------------------------------------------------------------------- |
| `pulse-play`        | `{ track, time }`           | Playback started or resumed.                                                        |
| `pulse-pause`       | `{ track, time }`           | Playback paused (not at a natural track end).                                       |
| `pulse-trackchange` | `{ from, to, track }`       | The active track changed.                                                           |
| `pulse-ended`       | `{ track }`                 | A track reached its end.                                                            |
| `pulse-error`       | `{ track, reason, detail }` | `reason` is `'play-rejected'` (autoplay policy) or `'media-error'` (load / decode). |
| `pulse-resize`      | `{ width }`                 | `<pulse-player>` only — the user resized it.                                        |

For page-level logic, prefer subscribing to the engine directly — see the [engine reference](./engine.md#events).

## Labels

Every visible or spoken string can be replaced:

```js
document.querySelector('pulse-player').labels = {
  play: 'Lecture',
  pause: 'Pause',
  previous: 'Piste précédente',
  next: 'Piste suivante',
  seek: 'Position',
  nowPlaying: 'En cours',
  mute: 'Couper le son',
  unmute: 'Réactiver le son',
  loading: 'Chargement…',
  error: 'Lecture impossible',
  empty: 'Aucune piste',
  resize: 'Redimensionner',
  options: 'Options du lecteur',
  close: 'Fermer le lecteur',
  player: 'Lecteur audio',
  timeText: '{current} sur {duration}',
}
```

The defaults are exported as `DEFAULT_LABELS`.

## Keyboard

Shortcuts apply while focus is inside a player:

| Keys                                                                              | Action                                                                       |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| <kbd>Space</kbd>, <kbd>K</kbd>                                                    | Play / pause (Space is left to the focused button when on one)               |
| <kbd>J</kbd> / <kbd>L</kbd>                                                       | Back / forward 10 s                                                          |
| <kbd>M</kbd>                                                                      | Mute / unmute                                                                |
| <kbd>Shift</kbd>+<kbd>N</kbd> / <kbd>Shift</kbd>+<kbd>P</kbd>                     | Next / previous track                                                        |
| <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> on the seek bar               | ∓ 5 s (with <kbd>Shift</kbd>: 1 s)                                           |
| <kbd>PageUp</kbd> / <kbd>PageDown</kbd> on the seek bar                           | ± 30 s                                                                       |
| <kbd>Home</kbd> / <kbd>End</kbd> on the seek bar                                  | Start / end                                                                  |
| Arrows / <kbd>Home</kbd> / <kbd>End</kbd> / <kbd>Enter</kbd> on the resize handle | ± 16 px (with <kbd>Shift</kbd>: 64 px) / minimum / maximum / automatic width |
| <kbd>Shift</kbd>+<kbd>F10</kbd> or <kbd>ContextMenu</kbd> on the FAB              | Open the menu; arrows move, <kbd>Esc</kbd> closes                            |

## Variants

`auto` · `transparent` · `solid` · `dark` · `light` · `sunset` · `midnight` · `aurora` · `vinyl` · `custom` — see [Theming](../theming.md).
