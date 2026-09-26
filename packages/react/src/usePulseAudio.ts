import { useMemo, useSyncExternalStore } from 'react'
import { formatTime, getSharedEngine, type PulseEngine } from '@pulse-music/core'
import type {
  AudioEvent,
  EventListener,
  PulseState,
  RepeatMode,
  Track,
  Unsubscribe,
} from '@pulse-music/types'

export interface PulseAudioControls {
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
  setMuted: (muted: boolean) => void
  toggleMute: () => void
  setRepeat: (repeat: RepeatMode) => void
  setTracks: (tracks: readonly Track[], options?: { startIndex?: number }) => void
  setAmbientEq: (on: boolean) => void
  open: () => void
  close: () => void
  subscribe: <E extends AudioEvent>(event: E, listener: EventListener<E>) => Unsubscribe
  fmt: (seconds: number) => string
}

export interface UsePulseAudioReturn extends PulseState, PulseAudioControls {
  /** The active track, or `null` for an empty playlist. */
  track: Track | null
  tracks: readonly Track[]
  /** Playback progress, `0..100`. */
  progress: number
  engine: PulseEngine
}

export interface UsePulseAudioOptions {
  /** Bind to an explicit engine. */
  engine?: PulseEngine
  /** Or to a named shared session (default `'default'`). */
  session?: string
}

/**
 * Subscribe a component to a Pulse audio session. Re-renders on every
 * state change (the engine publishes immutable snapshots, so this is a
 * plain `useSyncExternalStore`). Actions are stable across renders.
 *
 * ```tsx
 * const { isPlaying, track, toggle } = usePulseAudio()
 * ```
 */
export function usePulseAudio(options: UsePulseAudioOptions = {}): UsePulseAudioReturn {
  const engine = options.engine ?? getSharedEngine(options.session)
  const state = useSyncExternalStore(
    (onChange) => engine.onStateChange(onChange),
    () => engine.state,
    () => engine.state,
  )

  const controls = useMemo<PulseAudioControls>(
    () => ({
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
      setMuted: (muted) => engine.setMuted(muted),
      toggleMute: () => engine.toggleMute(),
      setRepeat: (repeat) => engine.setRepeat(repeat),
      setTracks: (tracks, opts) => engine.setTracks(tracks, opts),
      setAmbientEq: (on) => engine.setAmbientEq(on),
      open: () => engine.open(),
      close: () => engine.close(),
      subscribe: (event, listener) => engine.subscribe(event, listener),
      fmt: formatTime,
    }),
    [engine],
  )

  return {
    ...state,
    ...controls,
    track: engine.track,
    tracks: engine.tracks,
    progress: engine.progress,
    engine,
  }
}
