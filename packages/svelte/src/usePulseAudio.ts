/**
 * `usePulseAudio()` — plain TypeScript wrapper over the shared
 * `PulseEngine`, designed to be consumed from Svelte 5 `.svelte`
 * files OR from any plain `.ts` module.
 *
 * Returns the engine reference + a `subscribe(callback)` channel
 * matching Svelte's classic store contract:
 *
 *   const audio = usePulseAudio()
 *   $: state = audio.state   // reactive snapshot via Svelte's $store autosubscribe
 *
 * Why plain TS (no `$state` runes, no `.svelte.ts` suffix):
 *
 * The previous draft (v3.0.0-alpha.3) was written as a
 * `.svelte.ts` file using Svelte 5 runes. That file is only
 * compilable inside a Svelte project that has the Svelte 5
 * preprocessor in its toolchain — the npm-workspaces tooling at
 * this monorepo level doesn't ship that, so the file's runtime
 * behaviour was suspect (the audit flagged it). Plain TS removes
 * the build dependency and works in EVERY Svelte 5 project
 * (project-side Svelte compiler still handles the consumer's
 * `.svelte` files just fine).
 *
 * Svelte consumers wire it up like any classic store:
 *
 * ```svelte
 * <script lang="ts">
 *   import { usePulseAudio } from '@pulse-music/svelte'
 *
 *   const audio = usePulseAudio()
 * </script>
 *
 * <button onclick={audio.toggle}>{$audio.isPlaying ? '⏸' : '▶'}</button>
 * <p>{$audio.track.title}</p>
 * <p>{audio.fmt($audio.currentTime)} / {audio.fmt($audio.duration)}</p>
 * ```
 *
 * The `$audio` prefix is Svelte's auto-subscribe — Svelte 4 + 5
 * both honour it on any object exposing a `subscribe(cb)` method.
 */
import {
  getSharedEngine,
  type PulseEngine,
  type PulseState,
  type Track,
} from '@pulse-music/web-component'

type Subscriber = (state: PulseState & { track: Track; progress: number }) => void

export interface UsePulseAudioStore {
  /**
   * Svelte classic-store subscribe.
   * Returns the snapshot synchronously, then on every engine state
   * change. The returned function is the unsubscribe.
   */
  subscribe: (run: Subscriber) => () => void

  /** Underlying engine — escape hatch for advanced consumers. */
  engine: PulseEngine

  /** Format a seconds value as `m:ss`. */
  fmt: (seconds: number) => string

  toggle: () => void
  next: () => void
  prev: () => void
  seek: (fraction: number) => void
  setAudioTracks: (tracks: Track[]) => void
  setAmbientEq: (on: boolean) => void
}

export function usePulseAudio(): UsePulseAudioStore {
  const engine = getSharedEngine()

  function snapshot() {
    return {
      ...engine.state,
      track: engine.track,
      progress: engine.progress,
    }
  }

  function subscribe(run: Subscriber): () => void {
    // Svelte's contract: fire the snapshot synchronously on
    // `subscribe`, then on every change.
    run(snapshot())
    return engine.onStateChange(() => {
      run(snapshot())
    })
  }

  return {
    subscribe,
    engine,
    fmt: (s: number) => engine.fmt(s),
    toggle: () => engine.toggle(),
    next: () => engine.next(),
    prev: () => engine.prev(),
    seek: (f: number) => engine.seek(f),
    setAudioTracks: (t: Track[]) => engine.setAudioTracks(t),
    setAmbientEq: (on: boolean) => engine.setAmbientEq(on),
  }
}
