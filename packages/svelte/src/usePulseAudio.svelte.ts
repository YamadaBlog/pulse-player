/**
 * `usePulseAudio()` — Svelte 5 runes wrapper over the shared
 * `PulseEngine`.
 *
 * Returns a `$state`-backed object that auto-updates when the engine
 * fires `onStateChange`, plus the action surface. Designed for Svelte
 * 5's runes mode (the `.svelte.ts` suffix tells the Svelte compiler
 * to allow `$state` / `$derived` / `$effect` outside `.svelte` files).
 *
 * Example:
 *
 * ```svelte
 * <script lang="ts">
 *   import { usePulseAudio } from '@pulse/svelte'
 *
 *   const audio = usePulseAudio()
 * </script>
 *
 * <button onclick={audio.toggle}>{audio.state.isPlaying ? '⏸' : '▶'}</button>
 * <p>{audio.track.title}</p>
 * <p>{audio.fmt(audio.state.currentTime)} / {audio.fmt(audio.state.duration)}</p>
 * ```
 */
import {
  getSharedEngine,
  type PulseEngine,
  type PulseState,
  type Track,
} from '@pulse/web-component'

export interface UsePulseAudioReturn {
  /** Reactive state snapshot. Reads here are tracked by Svelte 5 runes. */
  state: PulseState
  /** Active track (clamped to a valid index). */
  readonly track: Track
  /** Playback progress as 0..100 %. */
  readonly progress: number
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

export function usePulseAudio(): UsePulseAudioReturn {
  const engine = getSharedEngine()

  // Svelte 5 runes — `$state` makes this object's fields reactive. The
  // `// svelte-ignore` declaration silences the compiler's "rune
  // outside a .svelte file" check; this file's `.svelte.ts` suffix
  // already opts in to rune mode.
  // @ts-expect-error — `$state` is injected by the Svelte 5 compiler at build time.
  const state: PulseState = $state({ ...engine.state })

  // Bridge the engine subscription into Svelte reactivity. We update
  // the existing $state object in place (rather than replacing it),
  // so any rune-derived computeds keep tracking the same identity.
  // @ts-expect-error — `$effect` is injected by the Svelte 5 compiler.
  $effect(() => {
    const unsub = engine.onStateChange((s) => {
      Object.assign(state, s)
    })
    return unsub
  })

  return {
    state,
    get track() {
      return engine.track
    },
    get progress() {
      return engine.progress
    },
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
