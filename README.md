<div align="center">

<br>

# pulse-player

### A Vue 3 music player that grows with the page.

<br>

[![Vue 3](https://img.shields.io/badge/Vue-3.4+-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Pinia](https://img.shields.io/badge/Pinia-2.1+-f7d336?logo=pinia&logoColor=black)](https://pinia.vuejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-3DBDA7.svg)](./LICENSE)
[![bundle](https://img.shields.io/badge/gzip-~45kB-3DBDA7)](./docs/ARCHITECTURE.md)

<br>

<img src="./docs/screenshots/hero.png" alt="pulse-player floating transparently over a blurred album-art backdrop" width="100%" />

<br>

**A drop-in inline card.** &nbsp;·&nbsp; **A floating draggable FAB.** &nbsp;·&nbsp; **One global audio session.**
<br><sub>Every visible dimension scales from a single CSS variable.</sub>

</div>

<br>

---

## What it is

`pulse-player` is two Vue 3 components and one Pinia store. The inline
**`MusicPlayer`** sits anywhere in a page, the floating **`MiniPlayer`** FAB
persists across routes, and they share the same global audio session.

The unusual bit: **every visible dimension scales from one CSS variable.**
A `ResizeObserver` watches the container, writes `--pulse-scale` inline,
and the entire component — artwork, title, icons, buttons, padding, shadows,
EQ bars, progress — breathes together. Drop it in a 280 px sidebar or a
720 px hero, it stays intentional either way. Below 240 px it collapses
to a graceful compact mode.

<br>

## Responsive — built in

<div align="center">

<img src="./docs/screenshots/responsive-mobile.png" alt="mobile" width="200" />
&nbsp;&nbsp;&nbsp;
<img src="./docs/screenshots/responsive-tablet.png" alt="tablet" width="280" />
&nbsp;&nbsp;&nbsp;
<img src="./docs/screenshots/compact.png" alt="compact" width="120" />

<sub><strong>Mobile</strong> · <strong>Tablet</strong> · <strong>Compact mode (< 240 px)</strong></sub>

</div>

→ [Read the responsive guide](./docs/RESPONSIVE.md)

<br>

## Themes & variants

Nine curated background presets ship in. Pass `accentColor` to retune the EQ + progress hue.

<div align="center">

<table>
  <tr>
    <td align="center" width="50%">
      <img src="./docs/screenshots/variant-vinyl.png" alt="vinyl" width="100%" />
      <br><sub><strong>Vinyl</strong></sub>
    </td>
    <td align="center" width="50%">
      <img src="./docs/screenshots/variant-sunset.png" alt="sunset" width="100%" />
      <br><sub><strong>Sunset</strong></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./docs/screenshots/variant-midnight.png" alt="midnight" width="100%" />
      <br><sub><strong>Midnight</strong></sub>
    </td>
    <td align="center">
      <img src="./docs/screenshots/variant-aurora.png" alt="aurora" width="100%" />
      <br><sub><strong>Aurora</strong></sub>
    </td>
  </tr>
</table>

</div>

Also: **Auto** · **Vinyl** · **Sunset** · **Midnight** · **Aurora** · **Dark** · **Light** · **Transparent** · **Solid** · **Custom**.

→ [Full customization guide](./docs/CUSTOMIZATION.md)

<br>

## Quick start

```bash
git clone https://github.com/YamadaBlog/pulse-player.git
cd pulse-player
npm install
npm run dev       # http://localhost:5174
```

In your own app, copy [`src/lib/`](./src/lib) and:

```vue
<MusicPlayer variant="vinyl" />
<MiniPlayer />
```

That's it. Pinia is the only setup step. → [Detailed install + usage](./docs/ADVANCED_USAGE.md)

<br>

## Documentation

| | |
|---|---|
| 📖 [API reference](./docs/API.md) | Props for `MusicPlayer`, `MiniPlayer`, the `useAudioStore` state + actions |
| 🏗️ [Architecture](./docs/ARCHITECTURE.md) | How the store, audio element and FFT analyser fit together (with diagram) |
| 🎨 [Customization](./docs/CUSTOMIZATION.md) | Variants, accent colors, CSS variables, custom backgrounds |
| 📱 [Responsive](./docs/RESPONSIVE.md) | The auto-scale curve, the three breakpoints, compact mode |
| 🛠️ [Advanced usage](./docs/ADVANCED_USAGE.md) | Replace playlist, custom controls, multiple players, hide on routes |

<br>

## Highlights

- **Truly proportional** — one CSS variable scales everything together.
- **Container-aware** — sizes itself off its container, not the viewport.
- **Compact mode** — collapses gracefully below 240 px, stays usable.
- **Persistent session** — one Pinia store, one `<audio>`. Survives every route change.
- **9 themes + custom** — including a transparent variant for full-bleed hero use.
- **Themable accent** — one prop or one CSS variable.
- **FFT equalizer** — 4-band Web Audio analyser, smoothed, degrades gracefully.
- **Tiny** — ~45 kB gzipped (JS + CSS combined). Zero domain code.

<br>

## License

[MIT](./LICENSE). The two demo tracks under `public/audio/` are shipped
for local testing only and are **not** part of the MIT-licensed source —
replace them with content you own before redistributing.

<br>

<div align="center">

<sub>Built with Vue 3, Pinia, a ResizeObserver and a small amount of obsessive proportional tuning.</sub>

</div>
