/**
 * @pulse/vue — Vue 3 wrapper.
 *
 * The CURRENT validated Vue v2.3.4 implementation lives at the repo
 * root under `src/lib/` and is NOT moving to this package in
 * v3.0.0-alpha.0. The migration happens in v3.0.0-alpha.1 — until
 * then this package is a forward-declared scaffold so monorepo
 * consumers can already reference `@pulse/vue` in their imports.
 *
 * Why not move now: the Vue code is the validated reference for every
 * other framework. Moving it before the refactor (which converts it
 * from owning the audio engine to wrapping `@pulse/core` +
 * `@pulse/web-component`) would create two parallel implementations
 * at the same time. We do one move at a time.
 *
 * Reference: `src/lib/` at the repo root (v2.3.4 codebase, tagged
 * `v2.3.4` on the main branch).
 */
export {} // placeholder — will re-export MusicPlayer, MiniPlayer, useAudioStore after the alpha.1 migration
