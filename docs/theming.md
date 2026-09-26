# Theming

Three levels, from quickest to most precise.

## 1. Pick a variant

```html
<pulse-player variant="aurora"></pulse-player>
```

| Variant       | Look                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- |
| `auto`        | The cover art, blurred, as the background; the accent is sampled from the artwork. Default. |
| `transparent` | No surface at all — sits on your own background.                                            |
| `solid`       | Neutral graphite card.                                                                      |
| `dark`        | Near-black, for OLED-dark interfaces.                                                       |
| `light`       | Inverted palette for light interfaces.                                                      |
| `sunset`      | Ember, coral and amber.                                                                     |
| `midnight`    | Deep indigo with violet light.                                                              |
| `aurora`      | Teal and emerald polar light.                                                               |
| `vinyl`       | Warm analog brown with a brass accent.                                                      |
| `custom`      | Your own background through `custom-background`.                                            |

The tokens behind them are exported by `@pulse-music/tokens` (`VARIANTS`), handy for building pickers or matching the rest of your UI.

## 2. Retune the accent

```html
<pulse-player variant="dark" accent-color="#ff5fa2"></pulse-player>
```

The accent drives the progress bar, the equaliser, the glow and the focus rings. On `auto` it is sampled from the cover when you don't set one (same-origin covers, or covers served with CORS). Accent changes animate smoothly.

## 3. Custom properties and parts

Style from the outside like any element:

```css
pulse-player {
  --pulse-radius: 12px;
  --pulse-font: 'Inter', sans-serif;
  --pulse-shadow: none;
}

pulse-player[variant='custom'] {
  --pulse-bg: linear-gradient(135deg, #1e3a8a, #0f172a);
  --pulse-fg: #e0f2fe;
  --pulse-muted: rgb(224 242 254 / 0.65);
  --pulse-accent: #38bdf8;
}

pulse-player::part(title) {
  font-weight: 600;
  letter-spacing: 0;
}
```

Every property and part is listed in the [reference](./reference/elements.md#css-custom-properties). Custom states (`:state(playing)`, `:state(loading)`, `:state(error)`) let you react to playback in your own CSS.

## Motion

Micro-interactions use spring curves (`linear()` easings sampled from real damped springs) and run on the compositor. Everything — including the visualiser loop — stops under `prefers-reduced-motion: reduce`. The curves are exported as `EASING` from `@pulse-music/tokens` if you want your UI to move the same way.
