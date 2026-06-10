# Notice — third-party content and provenance

This file documents every asset and runtime dependency that pulse-player
ships or relies on. It complements [`LICENSE`](./LICENSE) (which covers
the _source code_ under MIT) and is the authoritative reference for
attribution before any public deployment or redistribution.

If you fork this repository for your own use, **read `Demo assets` below
and replace the files listed there.** They are demo placeholders and are
NOT licensed for redistribution.

## 1. Source code

The contents of `src/`, `tests/`, `docs/`, `CHANGELOG.md`, `CONTRIBUTING.md`,
`README.md`, the build/lint configuration files, and the workflow under
`.github/workflows/` are released under the **MIT License**, copyright
© 2026 the pulse-player authors.

## 2. Runtime dependencies (peer + direct)

| Package           | Version  | License | Notice                                                                |
| ----------------- | -------- | ------- | --------------------------------------------------------------------- |
| `vue`             | ^3.4.0   | MIT     | Peer dependency — bring your own.                                     |
| `pinia`           | ^2.1.0   | MIT     | Peer dependency — bring your own.                                     |
| `lucide-vue-next` | ^0.300.0 | ISC     | Direct dependency. Icons used: Play, Pause, SkipBack, SkipForward, X. |

ISC and MIT are functionally identical for distribution purposes
(permissive, no attribution required in the binary). The verbatim
license texts are reproduced in the respective `node_modules/<pkg>/LICENSE`
files of an installed checkout.

## 3. Demo assets — REMOVED from the repository (alpha.26, 2026-06-08)

> **Status update — alpha.26:** the four placeholder files referenced below were **deleted from the repository tree** and added to `.gitignore`. The live GH Pages deployment now serves an empty `public/audio/` folder with a [`README.md`](./public/audio/README.md) inside that documents the local-setup path. The chrome UI renders correctly without source audio (the play button stays in the silent state). To run the demo locally with sound, follow the procedure in [`public/audio/README.md`](./public/audio/README.md) or run `npm run setup:demo-audio`.
>
> The historical table below is kept for traceability — it documents what was previously distributed (and shouldn't have been). The brutal alpha.25 product audit caught that the placeholders had been served publicly via GH Pages since alpha.16 despite this `NOTICE.md` explicitly saying they were "NOT licensed for redistribution". This `NOTICE.md` and the alpha.26 file removal together close that legal exposure.

The files below WERE shipped under `public/audio/` for local-demo purposes only.
They were **not** part of the MIT-licensed source code.

| File                       | Type           | Source / status                         | Action you must take                                                       |
| -------------------------- | -------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `public/audio/track1.webm` | Audio (3.6 MB) | Placeholder, provenance not documented. | Replace with a track you own or one under a permissive license (e.g. CC0). |
| `public/audio/track2.webm` | Audio (4.5 MB) | Placeholder, provenance not documented. | Replace with a track you own or one under a permissive license.            |
| `public/audio/cover.webp`  | Image (15 KB)  | Placeholder.                            | Replace with art you own or have licensed.                                 |
| `public/audio/cover2.webp` | Image (10 KB)  | Placeholder.                            | Replace with art you own or have licensed.                                 |

### How to replace the placeholders (curated CC0 sources, 2026-06)

| Asset                 | Curated CC0 source                                                            | Why this one                                                                                                                        | Manual download command                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Both audio tracks     | [Pixabay Music — "Ambient"](https://pixabay.com/music/search/genre/ambient/)  | CC0, no attribution required, royalty-free, OPUS-friendly. Filter by length (90 s — 4 min) and mood (ambient / electronic / lofi).  | Right-click → "Download MP3" then convert: `ffmpeg -i pixabay-track.mp3 -c:a libopus -b:a 96k public/audio/track1.webm`                        |
| Both cover images     | [Unsplash — "Album cover"](https://unsplash.com/s/photos/album-cover)         | Unsplash License (free for any use incl. commercial, attribution appreciated but not required). High-resolution, square-crop ready. | `curl -L "https://unsplash.com/photos/<id>/download?w=400" -o public/audio/cover.webp` then `cwebp -q 85 cover.jpg -o public/audio/cover.webp` |
| Alternative for audio | [Free Music Archive — CC0 tag](https://freemusicarchive.org/license/cc0-1-0/) | Strictly CC0 1.0. Curated, archive-grade metadata.                                                                                  | `curl -L "https://freemusicarchive.org/file/<artist>/<track>/download" -o public/audio/track1.mp3`                                             |
| Alternative for audio | [ccMixter — Public Domain tag](http://dig.ccmixter.org/free)                  | Public Domain tracks, downloadable as MP3, ready to convert to WebM.                                                                | (same `ffmpeg` step)                                                                                                                           |

**Don't ship the placeholders to production.** If you do, you're publishing media of unverified provenance — even if no rights holder ever notices, the act itself is a compliance failure for any business deploying Pulse.

The maintainer's stance: this repo's `public/audio/` placeholders are documented as **unknown provenance, do-not-ship**, and the recommended path is a 5-minute trip to Pixabay before any commercial deployment.

### 3bis. Demo audio shipped on GitHub Pages (round-8, 2026-06-10)

The **deployed demo** (https://yamadablog.github.io/pulse-player/) now ships real music, generated at deploy time by `scripts/setup-demo-audio.mjs` (never committed to the repo — `public/audio/*.webm` stays gitignored) :

| Demo slot                  | Work                | Author / source                                                                                            | Licence                                                                          |
| -------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| track1 ("MIDNIGHT RUN" UI) | _RetroFuture Dirty_ | [Kevin MacLeod — incompetech.com](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100501) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — attribution required |
| track2 ("DEEP FOCUS" UI)   | _Lobby Time_        | [Kevin MacLeod — incompetech.com](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100302) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — attribution required |

Attribution is displayed in the demo footer ("Music: Kevin MacLeod — incompetech.com · CC BY 4.0") and recorded here. The UI track _titles_ ("MIDNIGHT RUN", "DEEP FOCUS") are Pulse demo labels, not the works' titles.

If the incompetech download fails at deploy time, the pipeline falls back to the in-repo composed tracks (`scripts/synth-demo-tracks.mjs` — original works of this repository, MIT). Maintainer overrides via the `PULSE_TRACK1_URL` / `PULSE_TRACK2_URL` repository variables must keep this section + the footer credit accurate for whatever they point at.

## 4. Trademarks and brand names

pulse-player references the following brand names purely for descriptive
or illustrative purposes. No endorsement is claimed and no proprietary
logos are bundled.

- **Spotify** — referenced in comments to describe the green colour
  (`#1DB954`) used by the EQ bars and in the optional `spotifyUrl` prop
  that turns an icon into a link. No Spotify trademark, logo, brand kit,
  API, or content is shipped or relied on. If you object to the
  descriptive use, replace the comment text and choose your own colour.
- **GitHub** — referenced in the optional `githubUrl` prop. Same posture.
- **Vue**, **Pinia**, **TypeScript** — referenced in README badges via
  [shields.io](https://shields.io). Standard fair-use referencing.

The two SVG icons rendered inline in `MusicPlayer.vue` (lines around
`mp__icon-link`) draw generic glyphs — they are not the official GitHub
or Spotify brand marks.

## 5. Demo-page artwork

The screenshots under `docs/screenshots/` are rendered FROM pulse-player
itself (no third-party content embedded) and are released under the same
MIT licence as the source code.

## 6. Reporting

If you believe pulse-player includes content that infringes your rights
or whose provenance is incorrectly documented, please open an issue at
<https://github.com/YamadaBlog/pulse-player/issues> with the relevant
details. We will respond within a reasonable timeframe.
