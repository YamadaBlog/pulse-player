# Pulse — comparison with established alternatives

Honest, datapoint-by-datapoint comparison with the players Pulse is up against on the 2026 JavaScript audio scene. Use this page to decide whether Pulse is the right fit OR whether you should reach for one of the alternatives.

**Last updated: 2026-06-07** (alpha.19). GitHub-star + npm-download figures sourced from the listed comparator pages; refresh before quoting.

## At a glance

| Library                                                        | Stars  | Weekly npm dl         | Multi-framework                          | UI included | Mature                | Pulse niche                       |
| -------------------------------------------------------------- | ------ | --------------------- | ---------------------------------------- | ----------- | --------------------- | --------------------------------- |
| **[Plyr](https://github.com/sampotts/plyr)**                   | ~30 K  | ~273 K                | Vanilla + React wrapper                  | ✅          | Yes (10+ y)           | More polish (themes / FAB / FFT)  |
| **[Howler.js](https://howlerjs.com/)**                         | ~25 K  | ~1.5 M                | Audio engine only                        | ❌          | Yes                   | UI + chrome                       |
| **[WaveSurfer.js](https://wavesurfer.xyz/)**                   | ~10 K  | (modest)              | Vanilla + adapters                       | Waveform    | Yes                   | Drop-in card vs raw waveform      |
| **[Vidstack Player](https://github.com/vidstack/player)**      | (high) | (mature)              | Vue / React / Svelte / Solid / WC native | ✅ rich     | Yes                   | Smaller scope, opinionated chrome |
| **[react-player](https://www.npmjs.com/package/react-player)** | ~9 K   | ~1 M                  | React only                               | Minimal     | Yes                   | Multi-framework, not React-locked |
| **[vue-plyr](https://www.npmjs.com/package/vue-plyr)**         | small  | modest                | Vue only                                 | (via Plyr)  | Lagging               | Tracks Vue 3.5+                   |
| **pulse-player**                                               | **0**  | **0** (not published) | **Vue + React + Svelte + Angular + WC**  | ✅ premium  | **No (1 day public)** | —                                 |

The brutal column ("Pulse niche") is the honest answer to "why use Pulse instead?" — only valid where Pulse actually wins.

## Long-form comparison

### vs Plyr

**Plyr** is the gold standard for HTML5 audio + video player UI. Ten years of polish, 30 K stars, accessibility-first. If you need a serious media player and have no opinion about chrome aesthetic, you should pick Plyr.

| Dimension         | Plyr                                                           | Pulse                                                |
| ----------------- | -------------------------------------------------------------- | ---------------------------------------------------- |
| Years shipping    | 10+                                                            | 0                                                    |
| Stars             | ~30 K                                                          | 0                                                    |
| Multi-framework   | Vanilla + community React wrapper                              | Vue / React / Svelte / Angular / WC native           |
| Themes            | 1 baseline + community CSS                                     | **9 curated variants + accent override**             |
| Visual chrome     | Restrained, system-standard                                    | **Ambient EQ + pulso heartbeat + FAB + drag-resize** |
| Video support     | ✅                                                             | ❌ audio-only                                        |
| YouTube / Vimeo   | ✅                                                             | ❌                                                   |
| FFT visualiser    | ❌                                                             | ✅                                                   |
| Bundle            | ~21 kB gzip                                                    | 14 kB gzip (Vue lib)                                 |
| **Pick Plyr if**  | You need video + accessibility-first + audited-at-scale        |                                                      |
| **Pick Pulse if** | You want a polished audio-only widget with brand-able variants |                                                      |

Pulse and Plyr aren't real competitors — Pulse is a focused audio component with strong visual identity; Plyr is a battle-tested multi-format media player.

### vs Howler.js

**Howler.js** is the audio engine standard — 25 K stars, 1.5 M weekly downloads. It's an engine, not a UI. You can build any chrome on top.

| Dimension          | Howler                                                                            | Pulse                                                   |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| What it ships      | Audio engine + format fallbacks + 3D spatial + sprites                            | Audio engine **+ rendered chrome**                      |
| Years shipping     | 8+                                                                                | 0                                                       |
| Stars              | ~25 K                                                                             | 0                                                       |
| FFT analyser       | (via Web Audio API directly)                                                      | ✅ baked in                                             |
| UI components      | ❌                                                                                | ✅ inline + FAB                                         |
| Multi-framework    | Engine, framework-agnostic                                                        | Native wrappers for Vue / React / Svelte / Angular / WC |
| **Pick Howler if** | You want maximum control + you'll build your own chrome                           |                                                         |
| **Pick Pulse if**  | You want chrome + engine in one package and don't need 3D spatial / audio sprites |                                                         |

If you're building a Pro Tools clone or a game soundbank, take Howler. If you're adding "now playing" to a content site, Pulse is the faster path.

### vs Vidstack Player

**Vidstack** is Pulse's nearest architectural twin: multi-framework wrappers (Vue / React / Svelte / Solid / WC) on top of a shared engine. Tested at scale at Reddit. Modern alternative to JW Player.

| Dimension            | Vidstack                                                       | Pulse                                          |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| Years shipping       | 4+                                                             | 0                                              |
| Production users     | Reddit + many                                                  | 0                                              |
| Components           | 30 +                                                           | 2 (`<pulse-player>` + `<pulse-fab>`)           |
| Hooks                | 18 + React hooks                                               | 1 (`usePulseAudio`)                            |
| Media providers      | Audio + Video + HLS + DASH + YouTube + Vimeo + Remotion        | Audio only                                     |
| Layouts              | Default + Plyr                                                 | 1 (Vue v2.3.4 chrome)                          |
| Site produit         | vidstack.io (rich)                                             | yamadablog.github.io/pulse-player/ (demo only) |
| Bundle               | bigger (rich)                                                  | 14 kB gzip                                     |
| **Pick Vidstack if** | You need video + HLS + multiple providers + you ship to scale  |                                                |
| **Pick Pulse if**    | You only need a focused audio card with polish, smaller bundle |                                                |

Vidstack is what Pulse aspires to be after 4 years of adoption. In the meantime, Pulse is a **simpler, smaller-scope alternative for the audio-only case**.

### vs WaveSurfer.js

**WaveSurfer.js** renders an interactive waveform. Different shape — Pulse is a self-contained "now playing" card; WaveSurfer is a waveform widget you compose into your own player.

| Dimension              | WaveSurfer                                                               | Pulse                                      |
| ---------------------- | ------------------------------------------------------------------------ | ------------------------------------------ |
| Renders                | Waveform + region selection                                              | Cover art + bars + chrome                  |
| Use case               | Podcasts, audio editors, music demos                                     | Music players, content sites, portfolios   |
| Multi-framework        | Vanilla + community adapters                                             | Native Vue / React / Svelte / Angular / WC |
| **Pick WaveSurfer if** | You need a waveform timeline (DAW, podcast editor)                       |                                            |
| **Pick Pulse if**      | You want a card-shaped widget that "just plays" without seek-by-waveform |                                            |

### vs react-player

**react-player** is the React-only Swiss army knife for media URLs (YouTube / Vimeo / SoundCloud / Twitch / DailyMotion / Wistia / file URL).

| Dimension                | react-player                                          | Pulse                                   |
| ------------------------ | ----------------------------------------------------- | --------------------------------------- |
| Frameworks               | React only                                            | Vue / React / Svelte / Angular / WC     |
| Media providers          | 10+ via embeds                                        | Audio file URL only                     |
| Bundle                   | ~6 kB + provider iframes                              | 14 kB Vue lib / 1 kB @pulse-music/react |
| **Pick react-player if** | React-only project + you want YouTube embed           |                                         |
| **Pick Pulse if**        | Multi-framework future + you control the audio source |                                         |

## Feature matrix (Pulse-specific value)

Features that Pulse ships and the listed alternatives don't (out of the box):

| Feature                                              | Pulse | Plyr | Howler | WaveSurfer | Vidstack | react-player |
| ---------------------------------------------------- | ----- | ---- | ------ | ---------- | -------- | ------------ |
| 9 curated mood themes                                | ✅    | ❌   | n/a    | ❌         | ❌       | ❌           |
| Floating action button (FAB) with drag-to-reposition | ✅    | ❌   | n/a    | ❌         | ❌       | ❌           |
| Pulso heartbeat ring                                 | ✅    | ❌   | n/a    | ❌         | ❌       | ❌           |
| 3-state responsive morph (220 / 130 / 110 px)        | ✅    | ❌   | n/a    | ❌         | ❌       | ❌           |
| `--pulse-scale` single-variable scaling              | ✅    | ❌   | n/a    | ❌         | ❌       | ❌           |
| Drag-to-resize + persisted position                  | ✅    | ❌   | n/a    | ❌         | ❌       | ❌           |
| Trademark-safe generic streaming icon                | ✅    | n/a  | n/a    | n/a        | n/a      | n/a          |

Features Pulse **doesn't** ship that competitors do:

| Feature                 | Pulse | Plyr         | Howler | WaveSurfer | Vidstack |
| ----------------------- | ----- | ------------ | ------ | ---------- | -------- |
| Video playback          | ❌    | ✅           | n/a    | ❌         | ✅       |
| HLS / DASH              | ❌    | (via plugin) | ❌     | ❌         | ✅       |
| YouTube / Vimeo embed   | ❌    | ✅           | ❌     | ❌         | ✅       |
| 3D spatial audio        | ❌    | ❌           | ✅     | ❌         | ❌       |
| Audio sprites           | ❌    | ❌           | ✅     | ❌         | ❌       |
| Waveform render         | ❌    | ❌           | ❌     | ✅         | ❌       |
| 30 + ready-made layouts | ❌    | ❌           | ❌     | ❌         | ✅       |

## Bundle size comparison (gzip, listed where available)

| Library                    | Gzip size  | Note                                |
| -------------------------- | ---------- | ----------------------------------- |
| @pulse-music/svelte        | **0.4 kB** | Plain TS hook                       |
| @pulse-music/react         | **1 kB**   | Wrapper + useDomEvent               |
| @pulse-music/tokens        | **0.6 kB** | Variant gradients                   |
| @pulse-music/core          | **2 kB**   | Audio engine class                  |
| @pulse-music/web-component | **8.5 kB** | Lit chrome                          |
| pulse-player (Vue lib)     | **7.9 kB** | Reference                           |
| react-player               | ~6 kB      | + provider iframes loaded on demand |
| howler.js                  | ~10 kB     | Audio engine only                   |
| wavesurfer.js              | ~28 kB     | Waveform render                     |
| plyr                       | ~21 kB     | Full media player                   |
| vidstack (default layout)  | (bigger)   | Rich layout                         |

Pulse's `@pulse-music/react` wrapper at **1 kB** is the smallest premium-chrome React audio component in this list, by a wide margin. The cost moves to `@pulse-music/web-component` (8.5 kB) — which is the chrome runtime shared across every framework.

## Pricing comparison

| Library                                        | Licence     | Cost                                |
| ---------------------------------------------- | ----------- | ----------------------------------- |
| Pulse                                          | MIT         | **Free** (GitHub Sponsors optional) |
| Plyr                                           | MIT         | Free                                |
| Howler.js                                      | MIT         | Free                                |
| WaveSurfer.js                                  | BSD-3       | Free                                |
| Vidstack Player                                | MIT (core)  | Free                                |
| react-player                                   | MIT         | Free                                |
| **Tailwind UI** (reference paid component kit) | Proprietary | $299 one-time                       |
| **MUI X Pro**                                  | Open-core   | $180/dev/year                       |

Pulse stays free under MIT. The path to monetisation is **adjacent paid products** (premium themes pack, hosted Pulse Studio, consulting) — see [`LICENSING.md`](./LICENSING.md) §3.

## Honest recommendation

- **You build a content site (blog, portfolio, marketing landing) and want a polished now-playing widget:** **Pulse** is the right pick. The visual identity (9 themes + ambient EQ + FAB) plays well against design-led brands.
- **You build a media platform (Netflix-clone, podcast app, music streaming):** **Vidstack** or **Plyr**. They're battle-tested at scale; Pulse isn't yet.
- **You build a DAW / audio editor / podcast cutter:** **WaveSurfer.js** for the waveform UI + **Howler** for the engine. Pulse is the wrong shape.
- **You build a React-only app and want YouTube embed:** **react-player**.
- **You build a game / 3D audio scene:** **Howler**, not Pulse.

If you're not sure, **start with Pulse**. It's the smallest bundle for the smallest scope (audio + card UI). You can always swap to Vidstack later — the API surfaces are similar enough that the migration is one prop-renaming pass.

## What this comparison page is NOT

- It's not a sales pitch. Pulse loses on adoption, scale, and feature breadth.
- It's not a "Pulse is best" claim. Plyr / Vidstack / Howler are mature and excellent.
- It's not static. Update the figures + the recommendation as adoption changes.

This page exists so a visitor lands here from a Google search and gets the honest read in 2 minutes, instead of either over-claiming or under-claiming what Pulse actually does.
