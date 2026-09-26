import { formatTime, getSharedEngine, type PulseEngine } from '@pulse-music/core'
import type { PulseState, RepeatMode, Track } from '@pulse-music/types'

export interface PulseSnapshot extends PulseState {
  track: Track | null
  tracks: readonly Track[]
  progress: number
}

export interface PulseAudioStore {
  /** Svelte store contract — use `$audio` in components. */
  subscribe: (run: (snapshot: PulseSnapshot) => void) => () => void
  engine: PulseEngine
  fmt: (seconds: number) => string
  play: () => Promise<void>
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  load: (index: number, options?: { autoplay?: boolean }) => void
  seek: (fraction: number) => void
  seekTo: (seconds: number) => void
  seekBy: (deltaSeconds: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  setRepeat: (repeat: RepeatMode) => void
  setTracks: (tracks: readonly Track[], options?: { startIndex?: number }) => void
  setAmbientEq: (on: boolean) => void
  close: () => void
}

/**
 * A readable Svelte store over a Pulse audio session (Svelte 4 and 5).
 *
 * ```svelte
 * <script>
 *   import { usePulseAudio } from '@pulse-music/svelte'
 *   const audio = usePulseAudio()
 * </script>
 * <button onclick={audio.toggle}>{$audio.isPlaying ? 'Pause' : 'Play'}</button>
 * ```
 */
export function usePulseAudio(
  options: { engine?: PulseEngine; session?: string } = {},
): PulseAudioStore {
  const engine = options.engine ?? getSharedEngine(options.session)
  const snapshot = (): PulseSnapshot => ({
    ...engine.state,
    track: engine.track,
    tracks: engine.tracks,
    progress: engine.progress,
  })
  return {
    subscribe(run) {
      run(snapshot())
      return engine.onStateChange(() => run(snapshot()))
    },
    engine,
    fmt: formatTime,
    play: () => engine.play(),
    pause: () => engine.pause(),
    toggle: () => engine.toggle(),
    next: () => engine.next(),
    prev: () => engine.prev(),
    load: (index, opts) => engine.load(index, opts),
    seek: (fraction) => engine.seek(fraction),
    seekTo: (seconds) => engine.seekTo(seconds),
    seekBy: (delta) => engine.seekBy(delta),
    setVolume: (volume) => engine.setVolume(volume),
    toggleMute: () => engine.toggleMute(),
    setRepeat: (repeat) => engine.setRepeat(repeat),
    setTracks: (tracks, opts) => engine.setTracks(tracks, opts),
    setAmbientEq: (on) => engine.setAmbientEq(on),
    close: () => engine.close(),
  }
}
