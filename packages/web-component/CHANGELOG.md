# @pulse-music/web-component

## 3.0.0

### Major Changes

- [#55](https://github.com/YamadaBlog/pulse-player/pull/55) [`6f82fae`](https://github.com/YamadaBlog/pulse-player/commit/6f82fae6f60dbccdfdaa1f7c4362d53c9249dca3) Thanks [@YamadaBlog](https://github.com/YamadaBlog)! - Pulse 3.0 — one engine, one renderer, every framework.
  
  - **Engine**: state now mirrors the real `<audio>` element (OS media keys and headsets stay in sync), immutable snapshots, Media Session, volume/mute, repeat modes, buffering and error states, empty playlists, named sessions, and a shared visualiser loop (`onFrame`). Cross-origin audio without CORS is never routed through Web Audio (it used to play silently).
  - **`<pulse-player>`**: new container-query layout (card → compact → disc), a real play button, scrubbable and keyboard-operable seek slider, accent sampled from the cover, live equaliser, `<pulse-track>` declarative playlists, i18n `labels`, custom states and CSS parts.
  - **`<pulse-fab>`**: drag with spring-to-edge snapping, radial menu (long-press, right-click, options badge, Shift+F10), `placement`, `reveal`, `locked`.
  - **Vue**: `@pulse-music/vue` is now a real package (no Pinia).
  - **Packages are ESM-only** and require a bundler or native ESM.
  
  Breaking: removed `github-url`/`spotify-url` (use the `actions` slot), `data-fab` (the disc shape is automatic), `show-menu`/`draggable` on `<pulse-fab>` (menu is always available; use `locked` to disable dragging), `eqBars`/`eqAmbientBars`/`registerAmbientView` (use `onFrame`), and the `'stalled'` error reason. `track` is `null` for an empty playlist.

### Patch Changes

- Updated dependencies [[`6f82fae`](https://github.com/YamadaBlog/pulse-player/commit/6f82fae6f60dbccdfdaa1f7c4362d53c9249dca3)]:
  - @pulse-music/types@3.0.0
  - @pulse-music/core@3.0.0
  - @pulse-music/tokens@3.0.0
