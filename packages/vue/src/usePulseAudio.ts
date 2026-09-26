import {
  computed,
  getCurrentScope,
  onScopeDispose,
  shallowRef,
  type ComputedRef,
  type ShallowRef,
} from 'vue'
import { formatTime, getSharedEngine, type PulseEngine } from '@pulse-music/core'
import type {
  AudioEvent,
  EventListener,
  PulseState,
  RepeatMode,
  Track,
  Unsubscribe,
} from '@pulse-music/types'

export interface UsePulseAudioReturn {
  /** Immutable engine snapshot, replaced on every change. */
  state: Readonly<ShallowRef<PulseState>>
  track: ComputedRef<Track | null>
  tracks: ComputedRef<readonly Track[]>
  /** Playback progress, `0..100`. */
  progress: ComputedRef<number>
  isPlaying: ComputedRef<boolean>
  engine: PulseEngine
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
  open: () => void
  close: () => void
  subscribe: <E extends AudioEvent>(event: E, listener: EventListener<E>) => Unsubscribe
  fmt: (seconds: number) => string
}

/**
 * Reactive access to a Pulse audio session. The subscription is released
 * with the calling component (or effect scope).
 *
 * ```ts
 * const { state, track, toggle } = usePulseAudio()
 * ```
 */
export function usePulseAudio(
  options: { engine?: PulseEngine; session?: string } = {},
): UsePulseAudioReturn {
  const engine = options.engine ?? getSharedEngine(options.session)
  const state = shallowRef(engine.state)
  const off = engine.onStateChange((s) => {
    state.value = s
  })
  if (getCurrentScope()) onScopeDispose(off)

  // Reading `state.value` makes these recompute whenever the engine changes.
  const track = computed(() => (state.value, engine.track))
  const tracks = computed(() => (state.value, engine.tracks))
  const progress = computed(() => (state.value, engine.progress))
  const isPlaying = computed(() => state.value.isPlaying)

  return {
    state,
    track,
    tracks,
    progress,
    isPlaying,
    engine,
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
    setTracks: (list, opts) => engine.setTracks(list, opts),
    setAmbientEq: (on) => engine.setAmbientEq(on),
    open: () => engine.open(),
    close: () => engine.close(),
    subscribe: (event, listener) => engine.subscribe(event, listener),
    fmt: formatTime,
  }
}
