<div align="center">

<br>

# 🎵 &nbsp;pulse-player

### A Vue 3 music player that grows with the page.

<br>

[![Vue 3](https://img.shields.io/badge/Vue-3.4+-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Pinia](https://img.shields.io/badge/Pinia-2.1+-f7d336?logo=pinia&logoColor=black)](https://pinia.vuejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-3DBDA7.svg)](./LICENSE)
[![bundle](https://img.shields.io/badge/gzip-~45kB-3DBDA7)](./docs/ARCHITECTURE.md)
[![Status](https://img.shields.io/badge/status-active-3DBDA7.svg)]()

<br>

<img src="./docs/screenshots/hero.png" alt="pulse-player floating transparently over a blurred album-art backdrop" width="100%" />

<br>

**A drop-in inline card.** &nbsp;·&nbsp; **A floating draggable FAB.** &nbsp;·&nbsp; **One global audio session.**
<br><sub>Every visible dimension scales from a single CSS variable.</sub>

</div>

<br>

---

## ✨ &nbsp;What it is

`pulse-player` is two Vue 3 components — **`MusicPlayer`** (inline card) and
**`MiniPlayer`** (floating FAB) — backed by a tiny Pinia store that owns the
audio session. Drop them anywhere, they stay in sync. Mount the FAB at the
app root, playback survives every route change.

The unusual bit: **every visible dimension scales from one CSS variable.**
A `ResizeObserver` watches the container, writes `--pulse-scale` inline, and
the entire component — artwork, title, icons, buttons, padding, shadows, EQ
bars, progress — breathes together. Below 240 px it collapses to a graceful
compact mode. No media queries. No layout breaks.

<br>

## 🎨 &nbsp;Themes

Nine curated background presets ship in, including a true **transparent**
variant with the original dashboard's gradient + noise texture intact. Pass
`accentColor` to retune the EQ + progress hue.

<table>
  <tr>
    <td align="center" width="50%">
      <img src="./docs/screenshots/variant-vinyl.png" alt="vinyl variant" width="100%" />
      <br><sub><b>Vinyl</b> &nbsp;·&nbsp; warm analog, gold border</sub>
    </td>
    <td align="center" width="50%">
      <img src="./docs/screenshots/variant-sunset.png" alt="sunset variant" width="100%" />
      <br><sub><b>Sunset</b> &nbsp;·&nbsp; sepia / brown gradient</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="./docs/screenshots/variant-midnight.png" alt="midnight variant" width="100%" />
      <br><sub><b>Midnight</b> &nbsp;·&nbsp; deep navy → violet</sub>
    </td>
    <td align="center">
      <img src="./docs/screenshots/variant-aurora.png" alt="aurora variant" width="100%" />
      <br><sub><b>Aurora</b> &nbsp;·&nbsp; teal / cyan night</sub>
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <img src="./docs/screenshots/variant-light.png" alt="light variant" width="50%" />
      <br><sub><b>Light</b> &nbsp;·&nbsp; inverted palette for light-mode apps</sub>
    </td>
  </tr>
</table>

Also available: **Auto** · **Transparent** (hero above) · **Dark** · **Solid** · **Custom**.
&nbsp; → [Full customization guide](./docs/CUSTOMIZATION.md)

<br>

## 📐 &nbsp;Responsive — built in

<table>
  <tr>
    <td align="center" valign="bottom" width="20%">
      <img src="./docs/screenshots/compact.png" alt="compact" width="100%" />
      <br><sub><b>Compact</b><br/>&lt; 240 px</sub>
    </td>
    <td align="center" valign="bottom" width="25%">
      <img src="./docs/screenshots/responsive-mobile.png" alt="mobile" width="100%" />
      <br><sub><b>Mobile</b><br/>≈ 390 px</sub>
    </td>
    <td align="center" valign="bottom" width="30%">
      <img src="./docs/screenshots/responsive-tablet.png" alt="tablet" width="100%" />
      <br><sub><b>Tablet</b><br/>≈ 820 px</sub>
    </td>
    <td align="center" valign="bottom" width="25%">
      <img src="./docs/screenshots/responsive-desktop.png" alt="desktop" width="100%" />
      <br><sub><b>Desktop</b><br/>≥ 1280 px</sub>
    </td>
  </tr>
</table>

Same component, four screens, zero breakpoints. → [Read the responsive guide](./docs/RESPONSIVE.md)

<br>

## ⚡ &nbsp;Quick start

```bash
git clone https://github.com/YamadaBlog/pulse-player.git
cd pulse-player
npm install && npm run dev       # http://localhost:5174
```

In your own app, copy [`src/lib/`](./src/lib) and:

```vue
<MusicPlayer variant="vinyl" />
<MiniPlayer />
```

That's it. Pinia is the only setup step. → [Detailed install + usage](./docs/ADVANCED_USAGE.md)

<br>

## 📚 &nbsp;Documentation

| | |
|---|---|
| 📖 &nbsp; [**API reference**](./docs/API.md) | Props for `MusicPlayer`, `MiniPlayer`, the `useAudioStore` state + actions |
| 🏗️ &nbsp; [**Architecture**](./docs/ARCHITECTURE.md) | How the store, audio element and FFT analyser fit together (with diagram) |
| 🎨 &nbsp; [**Customization**](./docs/CUSTOMIZATION.md) | Variants, accent colors, CSS variables, custom backgrounds |
| 📐 &nbsp; [**Responsive**](./docs/RESPONSIVE.md) | The auto-scale curve, the three breakpoints, compact mode |
| 🛠️ &nbsp; [**Advanced usage**](./docs/ADVANCED_USAGE.md) | Replace playlist, custom controls, multiple players, hide on routes |

<br>

## 💎 &nbsp;Highlights

| | |
|---|---|
| **Truly proportional** | One CSS variable scales artwork, type, chrome and shadows together. |
| **Container-aware** | Sizes itself off its container, not the viewport. |
| **Compact mode** | Collapses gracefully below 240 px. Stays usable. |
| **Persistent session** | One Pinia store. Survives every route change. |
| **9 themes + custom** | Includes a true transparent variant with gradient + noise. |
| **Themable accent** | One prop or one CSS variable. |
| **FFT equalizer** | 4-band Web Audio analyser. Degrades gracefully. |
| **Tiny** | ~45 kB gzipped (JS + CSS combined). Zero domain code. |

<br>

## 🗺️ &nbsp;Roadmap

- [ ] Volume slider + mute on the inline card
- [ ] Shuffle / repeat modes
- [ ] Persist `currentTrack` + `currentTime` to `localStorage`
- [ ] Keyboard shortcuts (`Space`, `←`, `→`)
- [ ] Media Session API (hardware media keys + lock-screen art)
- [ ] Waveform variant (canvas alternative to the EQ bars)
- [ ] Publish as a standalone npm package

<br>

## 📝 &nbsp;Changelog

| Version | Highlights |
|---|---|
| **0.6.0** | Transparent variant restored with original dashboard gradient + noise. Clean element-level screenshots (no browser chrome). |
| 0.5.0 | Compact mode (< 240 px). Slim product README. Docs split. |
| 0.4.0 | Mermaid architecture diagram. Premium product README. |
| 0.3.x | `--pulse-scale` system. ResizeObserver auto-scale. Interactive size slider. |
| 0.2.x | Variant system. Container-query responsive. Screenshots. |
| 0.1.0 | Initial release. |

<br>

## 📄 &nbsp;License

[MIT](./LICENSE). The two demo tracks under `public/audio/` are shipped
for local testing only and are **not** part of the MIT-licensed source —
replace them with content you own before redistributing.

<br>

<div align="center">

<sub>Built with Vue 3, Pinia, a ResizeObserver and a small amount of obsessive proportional tuning.</sub>

</div>
