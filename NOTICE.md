# Notice — third-party content and provenance

Pulse's source code is released under the [MIT licence](./LICENSE). This file documents every asset in the repository that comes from elsewhere, or that deserves a note. `npm run check:assets` fails when a media file ships without an entry here.

## Runtime dependencies

The published packages depend on [Lit](https://lit.dev) (BSD-3-Clause). The framework packages declare Vue, React or Svelte (all MIT) as peer dependencies. No other third-party code is bundled.

## Demo music — CC0 (public domain)

Shipped with the showcase site only (`apps/site/public/audio/`), never in the npm packages.

| File                   | Work               | Author                                                                                                 | Licence                                                       |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| `projector-screen.mp3` | “Projector Screen” | HoliznaCC0 — [“Public Domain Lofi”](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `warm-fuzz.mp3`        | “Warm Fuzz”        | HoliznaCC0 — [“Public Domain Lofi”](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| `summer-break.mp3`     | “Summer Break”     | HoliznaCC0 — [“Public Domain Lofi”](https://freemusicarchive.org/music/holiznacc0/public-domain-lofi/) | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |

Sourced from the Free Music Archive, where the album is published under CC0 1.0 Universal. Changes made: loudness-normalised to −16 LUFS and re-encoded as ~112 kbps MP3. No attribution is required; the artist is credited anyway in the site's footer and on the record label.

## Demo artwork — original, MIT

`projector-screen.svg`, `warm-fuzz.svg` and `summer-break.svg` are original covers drawn for this repository and released under the MIT licence with the rest of the source. So are the project mark (`docs/brand/logo*.svg`, `logo-*.png`, `favicon.svg`, `favicon.png`), the Open Graph image (`og-banner.png`) and the screenshots in `docs/screenshots/`, all rendered from this repository.

## The reel — original, MIT

`pulse-reel-1080.mp4`, `pulse-reel-720.mp4`, `reel-poster-1920.webp` and `reel-poster-1280.webp` (`apps/site/public/reel/`) are a 15-second motion reel rendered from code for this repository, and its poster, which is the reel's last frame. They are released under the MIT licence with the rest of the source. Their content:

- The soundtrack is “Projector Screen” (HoliznaCC0, CC0 1.0, see above), mixed with procedurally generated sound design.
- The type is set in the three OFL typefaces listed below.
- The artwork is the original MIT artwork above.
- The animation was authored with GSAP. It is rendered to video, so no GSAP code ships with these files.

## Fonts — SIL Open Font License 1.1

The showcase site self-hosts three typefaces, all under the SIL OFL 1.1:

- `GeistMono-Variable.woff2` (Geist Mono by Vercel), with its [licence text](./apps/site/src/assets/fonts/OFL.txt) beside it;
- Archivo (Omnibus-Type) and Instrument Serif (Instrument), bundled at build time from the [Fontsource](https://fontsource.org) packages `@fontsource-variable/archivo` and `@fontsource/instrument-serif`, which carry their licence texts.

## Trademarks

The players ship no third-party logos. The showcase links to the project's GitHub repository with the GitHub mark, as permitted by [GitHub's logo guidelines](https://github.com/logos). Framework names (Vue, React, Svelte, Angular, Astro) are used only to describe compatibility.
