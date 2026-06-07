/**
 * @pulse/core — framework-agnostic audio engine + state machine.
 *
 * Scope:
 *   - Owns the singleton `<audio>` element + AudioContext + AnalyserNode.
 *   - Maintains the PulseState (currentTrack, isPlaying, …) as plain
 *     fields exposed via getters + an `onStateChange` subscription.
 *   - Exposes the typed event bus (`subscribe<E>(event, cb)`).
 *   - Exposes actions: `toggle()`, `next()`, `prev()`, `loadTrack(i)`,
 *     `seek(fraction)`, `setAudioTracks(tracks)`, `dispose()`.
 *
 * What this package is NOT:
 *   - It has no DOM rendering. `@pulse/web-component` builds the UI on
 *     top of it (and the framework wrappers wrap that).
 *   - It has no framework-specific reactivity. Vue / React / Svelte
 *     wrappers project the state into their primitives.
 *
 * Migration plan:
 *   The current implementation lives in
 *   `src/lib/useAudioStore.ts` (validated v2.3.4). Phase 1 of the
 *   monorepo migration extracts it here, stripped of Pinia / Vue refs
 *   and re-expressed as a plain class with subscriber callbacks.
 *
 * Status: SCAFFOLD. Implementation lands in v3.0.0-alpha.1.
 */
export {} // placeholder export so this file is a valid module
