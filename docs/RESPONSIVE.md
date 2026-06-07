# Responsive design

[← back to README](../README.md)

`pulse-player` watches its own container with a `ResizeObserver` and writes a unitless scale factor inline to `--pulse-scale`. Every visible dimension — artwork, title, NOW PLAYING label, icons, buttons, padding, border-radius, shadows, EQ bars, progress and gaps — is `calc(base × var(--pulse-scale))`. The result is a component that **actually grows** with its container, not a stretched mobile one. Three layered breakpoints kick in on top of the smooth scale so the component never breaks — it adapts.

## The four states

| State | Width range | What changes |
|---|---|---|
| **Full** | ≥ 220 px | Everything visible: NOW PLAYING label, GitHub + Spotify icons, full title, prev/next, progress bar, optional ambient EQ. |
| **Narrow** | 130–220 px | NOW PLAYING label hides. GitHub + Spotify icons stay (tighter gap). Title still readable. |
| **Compact** | 110–130 px | Top row removed. Only artwork + title + prev/next remain, centred. |
| **FAB** | < 110 px | The player morphs into a circular disc — cover art, dark scrim, play/pause icon, animated progress ring, optional ambient EQ. Tap to play/pause. |

Thresholds live in `src/lib/MusicPlayer.vue`:

```ts
const NARROW_THRESHOLD = 220
const COMPACT_THRESHOLD = 130
const FAB_THRESHOLD = 110
```

The morph between every pair of states uses **`cubic-bezier(0.65, 0, 0.35, 1)`** over 400 ms. While the guided demo is running, a body-level class overrides that to 550 ms for a buttery feel during scripted resizes. Inside the threshold morphs, every transitioned property uses GPU-friendly compositing where possible — the EQ bars in particular run on `transform: scaleY()` so they never trigger layout reflow.

## The scale curve

The auto-scale is a **two-zone ramp** — gentle above 280 px, steeper below to keep the layout legible at smaller container widths.

| Container width | `--pulse-scale` | Artwork | Title | Icon |
|---:|---:|---:|---:|---:|
| 130 px | _compact mode_ | _compact_ | _compact_ | _hidden_ |
| 170 px | 0.45 | 61 px | 13 px (floor) | 11 px (floor) |
| 220 px | 0.63 | 86 px | 16 px | 11 px |
| 280 px | 0.85 | 116 px | 22 px | 14 px |
| 360 px | 0.97 | 132 px | 25 px | 16 px |
| 480 px | 1.17 | 159 px | 30 px | 20 px |
| 720 px | 1.50 | 204 px | 39 px | 25 px |
| 800 px+ | 1.65 | 224 px | 43 px | 28 px |

Text-bearing dimensions use `max(floor, calc(base × scale))` so the title, NOW PLAYING label, icons and buttons floor at a readable minimum even when the container goes very small — no shrinking-into-invisibility.

## Drag-to-resize (optional)

Add the `resizable` prop on `MusicPlayer` and a small diagonal handle appears in the bottom-right corner. Pointer events drive it — **mouse, touch and stylus all run the same code path** via `setPointerCapture`.

```vue
<MusicPlayer
  resizable
  :min-width="60"
  :max-width="720"
/>
```

| Prop | Default | Notes |
|---|---|---|
| `resizable` | `false` | Show the handle. |
| `width` | `null` | Programmatic width override (used by the guided demo). Pass `null` to release control. |
| `minWidth` | `60` | Floor (px). |
| `maxWidth` | `720` | Ceiling (px) — keeps the player from stretching into a disproportionate band on very wide screens. |

The drag crosses the same thresholds as the auto-scale, so resizing by hand reproduces the exact same narrow / compact / FAB transitions. Going below `FAB_THRESHOLD` morphs the rectangle into the circular FAB and back as you drag past 110 px in either direction.

## Manual scale override

If the auto-scale doesn't match what you need, pass the `size` prop. A number, typically between `0.6` and `1.8`. Auto-scale stops driving the variable as soon as `size` is set.

```vue
<MusicPlayer :size="0.75" />   <!-- compact sidebar -->
<MusicPlayer :size="1.0"  />   <!-- card -->
<MusicPlayer :size="1.7"  />   <!-- hero -->
```

For width-based control (the slider in the live demo), bind `:width` instead — that's the same prop the drag handle and the guided demo tour use, so behaviour stays consistent across the three entry points.
