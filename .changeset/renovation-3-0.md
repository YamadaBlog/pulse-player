---
'@pulse-music/types': major
'@pulse-music/core': major
'@pulse-music/tokens': major
'@pulse-music/web-component': major
'@pulse-music/react': major
'@pulse-music/svelte': major
'@pulse-music/vue': major
---

Pulse 3.0 — one engine, one renderer, every framework.

- **Engine**: state now mirrors the real `<audio>` element (OS media keys and headsets stay in sync), immutable snapshots, Media Session, volume/mute, repeat modes, buffering and error states, empty playlists, named sessions, and a shared visualiser loop (`onFrame`). Cross-origin audio without CORS is never routed through Web Audio (it used to play silently).
- **`<pulse-player>`**: new container-query layout (card → compact → disc), a real play button, scrubbable and keyboard-operable seek slider, accent sampled from the cover, live equaliser, `<pulse-track>` declarative playlists, i18n `labels`, custom states and CSS parts.
- **`<pulse-fab>`**: drag with spring-to-edge snapping, radial menu (long-press, right-click, options badge, Shift+F10), `placement`, `reveal`, `locked`.
- **Vue**: `@pulse-music/vue` is now a real package (no Pinia).
- **Packages are ESM-only** and require a bundler or native ESM.

Breaking: removed `github-url`/`spotify-url` (use the `actions` slot), `data-fab` (the disc shape is automatic), `show-menu`/`draggable` on `<pulse-fab>` (menu is always available; use `locked` to disable dragging), `eqBars`/`eqAmbientBars`/`registerAmbientView` (use `onFrame`), and the `'stalled'` error reason. `track` is `null` for an empty playlist.
