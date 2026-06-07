<div align="center">

<br>

# 🎵 &nbsp;pulse-player

### A premium drop-in music player, going universal.

[![Watch the demo on YouTube](https://img.youtube.com/vi/q_FJ1GWaCc8/maxresdefault.jpg)](https://youtu.be/q_FJ1GWaCc8 'Watch the 3-minute Pulse demo on YouTube')

<sub>▶ [Watch the 3-minute demo on YouTube](https://youtu.be/q_FJ1GWaCc8) — 9 themes, ambient EQ, pulso heartbeat, drag-to-resize, FAB radial menu, keyboard shortcuts, multi-framework architecture.</sub>

> **v3 is in alpha.** The Vue 3 reference (current `v2.3.4`, tagged on `main`) keeps shipping bit-for-bit identical while the multi-framework architecture lands in `packages/` over the coming alphas. The framework wrappers below (React, Svelte, Web Components) all ship real code today.
> See [`docs/universal/ARCHITECTURE.md`](./docs/universal/ARCHITECTURE.md) and [`docs/universal/ROADMAP.md`](./docs/universal/ROADMAP.md) for the plan.

### Originally a Vue 3 music player that grows with the page.

### Now an audio component you can drop into any framework.

| Framework                               | Package                                        | Status today                                                                                                   | Chrome parity vs Vue v2.3.4 |
| --------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------- |
| **Vue 3**                               | `pulse-player` (today) / `@pulse/vue` (v3.0.0) | ✅ **Production-ready** (v2.3.4 validated, 15 alphas untouched)                                                | **100 %**                   |
| **React 18 / 19**                       | `@pulse/react`                                 | ✅ wrapper + 16 RTL tests + apps/demo-react runnable                                                           | **~95 %**                   |
| **Svelte 5**                            | `@pulse/svelte`                                | ✅ plain TS hook + 8 store tests + apps/demo-svelte runnable                                                   | **~95 %**                   |
| **Web Components**                      | `@pulse/web-component`                         | ✅ `<pulse-player>` + `<pulse-fab>` (Lit) + 22 element tests                                                   | **~95 %**                   |
| **Vanilla HTML / Solid / Astro / Qwik** | `@pulse/web-component`                         | ✅ apps/demo-vanilla runnable, inherits web-component chrome                                                   | **~95 %**                   |
| **Angular 17+**                         | `@pulse/angular`                               | ⚠️ PulseModule + 5 smoke tests, `private: true` (CVE peer floor)                                               | **~95 %**                   |
| **React Native**                        | `@pulse/react-native`                          | 🚫 interface types + 10 contract tests (renderer deferred, see [BLOCKERS.md](./docs/universal/BLOCKERS.md) #1) | **0 %**                     |

**Need the full premium chrome today (resize handle, three responsive states, social icons, prev / next, FAB drag, palette / menu, fullscreen)?** → use the Vue version.
**Just need the audio engine + minimum card chrome (play / pause / variants / ambient EQ / pulso)?** → any framework wrapper works.

### Try it in 30 seconds

[![Open Vanilla in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/pulse-player-vanilla) &nbsp; [![Open React in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/pulse-player-react) &nbsp; [![Open Svelte in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/pulse-player-svelte)

See [`docs/universal/SANDBOXES.md`](./docs/universal/SANDBOXES.md) for activation status (sandboxes go live once `@pulse/*` is published to npm).

Read [`docs/universal/ARCHITECTURE.md`](./docs/universal/ARCHITECTURE.md) for the dependency graph, [`docs/universal/FEATURE_MATRIX.md`](./docs/universal/FEATURE_MATRIX.md) for what works in each framework, [`docs/universal/API.md`](./docs/universal/API.md) for the canonical API reference, [`docs/universal/LICENSING.md`](./docs/universal/LICENSING.md) for the MIT-and-why strategy, and [`docs/universal/ROADMAP.md`](./docs/universal/ROADMAP.md) for the per-alpha plan.

<br>

[![Vue 3](https://img.shields.io/badge/Vue-3.4+-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![React 18 / 19](https://img.shields.io/badge/React-18%20%2F%2019-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-ff3e00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Web Components](https://img.shields.io/badge/Web%20Components-Lit-324fff?logo=lit&logoColor=white)](https://lit.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-3DBDA7.svg)](./LICENSE)
[![Vue lib gzip](https://img.shields.io/badge/Vue%20lib-14%20kB%20gzip-3DBDA7)](./docs/ARCHITECTURE.md)
[![Tests](https://img.shields.io/badge/tests-132%20%2F%20132-3DBDA7.svg)](./CHANGELOG.md)
[![Status](https://img.shields.io/badge/status-active-3DBDA7.svg)]()
[![Live demo](https://img.shields.io/badge/demo-live-3DBDA7?logo=github&logoColor=white)](https://yamadablog.github.io/pulse-player/)
[![Watch demo](https://img.shields.io/badge/demo-YouTube-FF0000?logo=youtube&logoColor=white)](https://youtu.be/q_FJ1GWaCc8)

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
bars, progress — breathes together. Three responsive states layer on top:
**narrow** below 220 px (NOW PLAYING label hides, social icons stay),
**compact** below 130 px (top row collapses), **FAB** below 110 px (the
player morphs into a circular disc). No media queries. No layout breaks.

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
      <br><sub><b>Compact</b><br/>&lt; 130 px</sub>
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

|                                                            |                                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 📖 &nbsp; [**API reference**](./docs/API.md)               | Props for `MusicPlayer`, `MiniPlayer`, the `useAudioStore` state + actions + keyboard surface |
| 🏗️ &nbsp; [**Architecture**](./docs/ARCHITECTURE.md)       | How the store, audio element and FFT analyser fit together (with diagram)                     |
| 🎨 &nbsp; [**Customization**](./docs/CUSTOMIZATION.md)     | Variants, accent colors, CSS variables, custom backgrounds                                    |
| 📐 &nbsp; [**Responsive**](./docs/RESPONSIVE.md)           | The auto-scale curve, the four responsive states, drag-to-resize                              |
| 🛠️ &nbsp; [**Advanced usage**](./docs/ADVANCED_USAGE.md)   | Replace playlist, custom controls, multiple players, hide on routes                           |
| ▶️ &nbsp; [**Guided demo tour**](./docs/DEMO.md)           | The "Watch demo" feature — scenario, controls, fullscreen, custom steps                       |
| 🔔 &nbsp; [**Events & telemetry**](./docs/EVENTS.md)       | Opt-in typed `subscribe()` API + per-session counters (no third-party tracking)               |
| ⚡ &nbsp; [**Performance**](./docs/PERFORMANCE.md)         | Bundle map, runtime cost per hot path, integration guidelines, `prefers-reduced-motion` story |
| 🆘 &nbsp; [**Troubleshooting**](./docs/TROUBLESHOOTING.md) | Autoplay rejection, 404s, EQ silent, FAB persistence, hydration mismatch                      |
| 🧪 &nbsp; [**Examples**](./examples)                       | 3 ready-to-fork integrations: minimum SPA, custom playlist, event subscriptions               |
| 🚀 &nbsp; [**Release procedure**](./RELEASING.md)          | Tag → GitHub Release → npm publish flow with release-notes templates                          |
| 📝 &nbsp; [**Changelog**](./CHANGELOG.md)                  | Every version from 0.1.0 to today, with rationale                                             |

<br>

## 💎 &nbsp;Highlights

|                             |                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Truly proportional**      | One CSS variable scales artwork, type, chrome and shadows together.                                                      |
| **Container-aware**         | Sizes itself off its container, not the viewport.                                                                        |
| **Three responsive states** | Narrow (≤ 220 px) → compact (≤ 130 px) → FAB (≤ 110 px). All driven by ResizeObserver, no media queries.                 |
| **Drag-to-resize**          | Optional handle in the bottom-right corner. Pointer events. Mouse, touch, stylus.                                        |
| **Persistent session**      | One Pinia store. Survives every route change.                                                                            |
| **9 themes + custom**       | Includes a true transparent variant with gradient + noise.                                                               |
| **Ambient EQ**              | 64-bar GPU-composited spectrum across the player. Globally toggleable.                                                   |
| **Pulso ripple**            | Optional heartbeat ring around the FAB — only while music is playing.                                                    |
| **Guided demo tour**        | ~50 s scripted walkthrough with pause / resume / step jump and fullscreen.                                               |
| **Opt-in events**           | `store.subscribe('play', …)` returns an unsubscribe. Plus play / pause / track-change counters. No third-party tracking. |
| **a11y**                    | `prefers-reduced-motion` honoured everywhere — tweens snap, scrolls jump, transitions disabled.                          |
| **Tiny**                    | ~49 kB gzipped (JS + CSS combined). Three deps (Vue, Pinia, lucide-vue-next). Zero domain code.                          |

<br>

## 🗺️ &nbsp;Roadmap

- [ ] Volume slider + mute on the inline card
- [ ] Shuffle / repeat modes
- [ ] Persist `currentTime` to `localStorage` (`persistKey` already covers FAB position)
- [ ] Keyboard shortcuts (`Space`, `←`, `→`) in the demo tour
- [ ] Media Session API (hardware media keys + lock-screen art)
- [ ] Waveform variant (canvas alternative to the EQ bars)
- [ ] Extract `src/lib/shared/` to deduplicate variant CSS between `MusicPlayer` and `MiniPlayer`
- [ ] Publish as a standalone npm package

<br>

## 📝 &nbsp;Changelog

Every release is pinned to a signed git tag (`v1.0.0` … `v1.0.12`) and surfaced as a GitHub Release.

| Latest         | One-line summary                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **v1.0.12**    | Spotlight blur stays active during the Pulso demo step; boost to the FAB section is 1.5× slower for readability.                                            |
| v1.0.11        | `Options` divider between the FAB colour palette and the action buttons.                                                                                    |
| v1.0.10        | Stable `680 × 233` baseline for the demo stages — never shrinks, grows past the baseline if the player does.                                                |
| v1.0.6 → 1.0.9 | Pick-a-mood demo step rewritten — precise framing, single continuous descent, title always in view; pulso ring + heartbeat aligned to the beat.             |
| v1.0.1 → 1.0.5 | Ambient EQ moved to a pure-CSS animation (0 JS / frame), bullet-proof pulso centring, dem o tour pause / resume / step jump, distance-aware scroll easings. |
| **v1.0.0**     | Production-ready: CI matrix, 30 unit tests, ESLint + Prettier + Husky, npm-publish-ready `package.json`, shared `PulseVariant` type, `CONTRIBUTING.md`.     |

Full history with rationale per release: [`CHANGELOG.md`](./CHANGELOG.md).

<br>

## 📄 &nbsp;License

[MIT](./LICENSE). The two demo tracks under `public/audio/` are shipped
for local testing only and are **not** part of the MIT-licensed source —
replace them with content you own before redistributing.

<br>

<div align="center">

<sub>Built with Vue 3, Pinia, a ResizeObserver and a small amount of obsessive proportional tuning.</sub>

</div>
