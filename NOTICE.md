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

## 3. Demo assets — replace before public deployment

The files below ship under `public/audio/` for local-demo purposes only.
They are **not** part of the MIT-licensed source code.

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
