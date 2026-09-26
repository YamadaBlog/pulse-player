# Notice — third-party content and provenance

Pulse's source code is released under the [MIT licence](./LICENSE). This file documents every asset in the repository that comes from elsewhere, or that deserves a note. `npm run check:assets` fails when a media file ships without an entry here.

## Runtime dependencies

The published packages depend on [Lit](https://lit.dev) (BSD-3-Clause). The framework packages declare Vue, React or Svelte (all MIT) as peer dependencies. No other third-party code is bundled.

## Demo music — CC BY 4.0

Shipped with the showcase site only (`apps/site/public/audio/`), never in the npm packages.

| File             | Work         | Author                                                     | Licence                                                   |
| ---------------- | ------------ | ---------------------------------------------------------- | --------------------------------------------------------- |
| `protofunk.mp3`  | “Protofunk”  | Kevin MacLeod — [incompetech.com](https://incompetech.com) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `lobby-time.mp3` | “Lobby Time” | Kevin MacLeod — [incompetech.com](https://incompetech.com) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `deuces.mp3`     | “Deuces”     | Kevin MacLeod — [incompetech.com](https://incompetech.com) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

Changes made: loudness-normalised to −16 LUFS and re-encoded as ~110 kbps MP3. The credit is also shown in the site's footer.

## Demo artwork — original, MIT

`protofunk.svg`, `lobby-time.svg` and `deuces.svg` are original covers drawn for this repository and released under the MIT licence with the rest of the source. So are the project mark (`docs/brand/logo*.svg`, `logo-*.png`, `favicon.svg`, `favicon.png`), the Open Graph image (`og-banner.png`) and the screenshots in `docs/screenshots/`, all rendered from this repository.

## Fonts — SIL Open Font License 1.1

`Geist-Variable.woff2` and `GeistMono-Variable.woff2` (Geist and Geist Mono by Vercel) are self-hosted by the showcase site under the [SIL OFL 1.1](./apps/site/public/fonts/OFL.txt); the licence text ships beside them.

## Trademarks

The players ship no third-party logos. The showcase links to the project's GitHub repository with the GitHub mark, as permitted by [GitHub's logo guidelines](https://github.com/logos). Framework names (Vue, React, Svelte, Angular, Astro) are used only to describe compatibility.
