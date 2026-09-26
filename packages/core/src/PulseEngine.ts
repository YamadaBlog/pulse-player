import type {
  AudioEvent,
  AudioFrame,
  EventListener,
  EventMap,
  PulseState,
  RepeatMode,
  Track,
  Unsubscribe,
} from '@pulse-music/types'
import { Emitter } from './emitter'
import { clamp, formatTime } from './format'
import { MediaSessionBridge } from './media-session'
import { SpectrumAnalyser, isAnalysable } from './spectrum'

export interface PulseEngineOptions {
  /** Initial playlist. Can be empty and filled later with `setTracks()`. */
  tracks?: readonly Track[]
  /** Initial volume, `0..1`. Default `0.8`. */
  volume?: number
  /** What happens when a track ends. Default `'all'` (loop the playlist). */
  repeat?: RepeatMode
  /**
   * Set when your audio is served cross-origin **with** CORS headers.
   * Required for the real spectrum on cross-origin sources — without it
   * the engine plays them untouched and synthesises the visualiser.
   */
  crossOrigin?: 'anonymous' | 'use-credentials'
  /** Route audio through an AnalyserNode for the FFT visualiser. Default `true`. */
  visualizer?: boolean
  /** Publish metadata + handle OS media keys via the Media Session API. Default `true`. */
  mediaSession?: boolean
  /** `<audio preload>` hint. Default `'metadata'` so durations show before playing. */
  preload?: 'none' | 'metadata' | 'auto'
  /** Number of visualiser bands in each `AudioFrame`. Default `24`. */
  bands?: number
  /** Factory for the media element — mainly a seam for tests. */
  createAudio?: () => HTMLAudioElement
}

type StateListener = (state: PulseState) => void
type FrameListener = (frame: AudioFrame) => void

const RESTART_THRESHOLD = 3 // seconds — `prev()` restarts the track past this point

const initialState = (volume: number, repeat: RepeatMode): PulseState => ({
  currentTrack: 0,
  isPlaying: false,
  isLoading: false,
  currentTime: 0,
  duration: 0,
  buffered: 0,
  volume,
  muted: false,
  repeat,
  error: null,
  isVisible: false,
  hasBeenOpened: false,
  ambientEq: false,
  playCount: 0,
  pauseCount: 0,
  trackChangeCount: 0,
})

const isAbortError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { name?: string }).name === 'AbortError'

/**
 * PulseEngine — the framework-agnostic audio engine behind every Pulse
 * player: one `<audio>` element, an optional Web Audio analyser, a
 * typed event bus and an immutable state snapshot.
 *
 * The engine is SSR-safe: nothing touches the DOM until the first
 * `prepare()` / `play()` call.
 */
export class PulseEngine {
  private _state: PulseState
  private _tracks: readonly Track[]
  private readonly options: Required<
    Omit<PulseEngineOptions, 'tracks' | 'crossOrigin' | 'createAudio'>
  > &
    Pick<PulseEngineOptions, 'crossOrigin' | 'createAudio'>

  private audio: HTMLAudioElement | null = null
  private detachAudio: (() => void) | null = null
  private readonly spectrum: SpectrumAnalyser
  private readonly mediaSession: MediaSessionBridge
  private readonly events = new Emitter<EventMap>()
  private readonly stateListeners = new Set<StateListener>()
  private readonly frameListeners = new Set<FrameListener>()
  private frameHandle: number | null = null
  private lastPositionSync = 0

  constructor(options: PulseEngineOptions | readonly Track[] = {}) {
    const opts: PulseEngineOptions = Array.isArray(options)
      ? { tracks: options as readonly Track[] }
      : (options as PulseEngineOptions)
    this.options = {
      volume: clamp(opts.volume ?? 0.8, 0, 1),
      repeat: opts.repeat ?? 'all',
      visualizer: opts.visualizer ?? true,
      mediaSession: opts.mediaSession ?? true,
      preload: opts.preload ?? 'metadata',
      bands: Math.max(1, Math.round(opts.bands ?? 24)),
      crossOrigin: opts.crossOrigin,
      createAudio: opts.createAudio,
    }
    this._tracks = [...(opts.tracks ?? [])]
    this._state = Object.freeze(initialState(this.options.volume, this.options.repeat))
    this.spectrum = new SpectrumAnalyser(this.options.bands)
    this.mediaSession = new MediaSessionBridge({
      play: () => void this.play(),
      pause: () => this.pause(),
      next: () => this.next(),
      prev: () => this.prev(),
      seekTo: (s) => this.seekTo(s),
      seekBy: (d) => this.seekBy(d),
    })
  }

  // ─── Read-only views ───────────────────────────────────────────────

  /** Current immutable snapshot. A new object is created on every change. */
  get state(): PulseState {
    return this._state
  }

  get tracks(): readonly Track[] {
    return this._tracks
  }

  /** The active track, or `null` when the playlist is empty. */
  get track(): Track | null {
    const list = this._tracks
    if (!list.length) return null
    return list[clamp(this._state.currentTrack, 0, list.length - 1)]
  }

  /** Playback progress, `0..100`. */
  get progress(): number {
    const { currentTime, duration } = this._state
    return Number.isFinite(duration) && duration > 0
      ? clamp((currentTime / duration) * 100, 0, 100)
      : 0
  }

  /** `true` when visualiser frames carry real spectrum data (not synthesised). */
  get hasLiveSpectrum(): boolean {
    return this.spectrum.live
  }

  // ─── Subscriptions ─────────────────────────────────────────────────

  /** Listen to a typed engine event. Returns the unsubscribe function. */
  subscribe<E extends AudioEvent>(event: E, listener: EventListener<E>): Unsubscribe {
    return this.events.on(event, listener)
  }

  /** Listen to every state change — the hook framework adapters build on. */
  onStateChange(listener: StateListener): Unsubscribe {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  /**
   * Receive a visualiser frame on every animation frame while audio plays
   * (and while the spectrum settles after a pause). The loop only runs
   * while at least one listener is attached.
   */
  onFrame(listener: FrameListener): Unsubscribe {
    this.frameListeners.add(listener)
    this.syncFrameLoop()
    return () => {
      this.frameListeners.delete(listener)
      this.syncFrameLoop()
    }
  }

  // ─── Playback ──────────────────────────────────────────────────────

  /**
   * Create the media element and preload the current track's metadata
   * without playing — call it when a UI mounts so durations show early.
   */
  prepare(): void {
    this.ensureAudio()
  }

  async play(): Promise<void> {
    const track = this.track
    const audio = this.ensureAudio()
    if (!track || !audio) return
    if (this.options.visualizer && this.canAnalyse()) this.spectrum.connect(audio)
    this.mediaSession.setTrack(track)
    this.set({
      isPlaying: true,
      isVisible: true,
      hasBeenOpened: true,
      error: null,
      isLoading: audio.readyState < 3,
    })
    try {
      await audio.play()
    } catch (error) {
      // `play()` interrupted by `pause()` or a source swap is not a failure.
      if (isAbortError(error) || this.track !== track) return
      this.set({ isPlaying: false, isLoading: false, error: 'play-rejected' })
      this.events.emit('error', { track, reason: 'play-rejected', detail: error })
    }
  }

  pause(): void {
    this.audio?.pause()
    this.set({ isPlaying: false, isLoading: false })
  }

  toggle(): void {
    if (this._state.isPlaying) this.pause()
    else void this.play()
  }

  /**
   * Switch to track `index`. Keeps playing if audio was playing, unless
   * `autoplay` says otherwise. Out-of-range indices are ignored.
   */
  load(index: number, options: { autoplay?: boolean } = {}): void {
    if (!Number.isInteger(index) || index < 0 || index >= this._tracks.length) return
    const autoplay = options.autoplay ?? this._state.isPlaying
    if (index === this._state.currentTrack) {
      if (autoplay && !this._state.isPlaying) void this.play()
      return
    }
    this.switchTo(index, autoplay)
  }

  /** @deprecated Use `load(index)`. */
  loadTrack(index: number): void {
    this.load(index)
  }

  next(): void {
    const n = this._tracks.length
    if (n) this.load((this._state.currentTrack + 1) % n)
  }

  /** Restart the track when past 3 s, otherwise go to the previous one. */
  prev(): void {
    const n = this._tracks.length
    if (!n) return
    if (this._state.currentTime > RESTART_THRESHOLD) {
      this.seekTo(0)
      return
    }
    this.load((this._state.currentTrack - 1 + n) % n)
  }

  /** Seek to a fraction (`0..1`) of the track. */
  seek(fraction: number): void {
    const { duration } = this._state
    if (Number.isFinite(duration) && duration > 0) this.seekTo(clamp(fraction, 0, 1) * duration)
  }

  /** Seek to an absolute position in seconds. */
  seekTo(seconds: number): void {
    const audio = this.audio
    const { duration } = this._state
    if (!audio || !Number.isFinite(duration) || duration <= 0) return
    const time = clamp(seconds, 0, duration)
    audio.currentTime = time
    this.set({ currentTime: time })
    this.mediaSession.setPosition(duration, time, audio.playbackRate)
  }

  /** Seek relative to the current position. */
  seekBy(deltaSeconds: number): void {
    this.seekTo(this._state.currentTime + deltaSeconds)
  }

  setVolume(volume: number): void {
    const v = clamp(volume, 0, 1)
    if (this.audio) this.audio.volume = v
    this.set({ volume: v, muted: v === 0 ? this._state.muted : false })
    if (this.audio && v > 0) this.audio.muted = false
  }

  setMuted(muted: boolean): void {
    if (this.audio) this.audio.muted = muted
    this.set({ muted })
  }

  toggleMute(): void {
    this.setMuted(!this._state.muted)
  }

  setRepeat(repeat: RepeatMode): void {
    this.set({ repeat })
  }

  /**
   * Replace the playlist. If the playing track is still part of the new
   * list it keeps playing uninterrupted; otherwise the engine loads
   * `startIndex` (paused).
   */
  setTracks(tracks: readonly Track[], options: { startIndex?: number } = {}): void {
    const currentSrc = this.track?.src
    this._tracks = [...tracks]
    // The playlist isn't part of the snapshot: publish a new one regardless.
    this.set({}, true)
    if (!tracks.length) {
      this.pause()
      if (this.audio) {
        this.audio.removeAttribute('src')
        this.audio.load()
      }
      this.set({ currentTrack: 0, currentTime: 0, duration: 0, buffered: 0, error: null })
      this.mediaSession.setTrack(null)
      return
    }
    const kept = currentSrc ? tracks.findIndex((t) => t.src === currentSrc) : -1
    if (kept >= 0) {
      this.set({ currentTrack: kept })
      this.mediaSession.setTrack(tracks[kept])
    } else {
      // The source changed even if the index didn't: always reload.
      this.switchTo(clamp(Math.round(options.startIndex ?? 0), 0, tracks.length - 1), false)
    }
    // A captured element can't play the new (cross-origin) sources audibly:
    // swap it only now, once the index points at the right track.
    if (!this.canAnalyse() && this.spectrum.live) this.rebuildAudio()
  }

  /** @deprecated Use `setTracks(tracks)`. */
  setAudioTracks(tracks: readonly Track[]): void {
    this.setTracks(tracks)
  }

  setAmbientEq(on: boolean): void {
    this.set({ ambientEq: on })
  }

  /** Reveal the floating player without starting playback. */
  open(): void {
    this.set({ isVisible: true })
  }

  /** Stop playback and hide the floating player. */
  close(): void {
    this.pause()
    this.set({ isVisible: false })
  }

  /** Format seconds as `m:ss`. Kept on the instance for template ergonomics. */
  fmt(seconds: number): string {
    return formatTime(seconds)
  }

  /**
   * Release the media element, the audio graph, the OS media controls
   * and every listener. The engine stays usable: the next `play()`
   * rebuilds what it needs.
   */
  dispose(): void {
    this.teardownAudio()
    this.mediaSession.unbind()
    if (this.frameHandle !== null) cancelAnimationFrame(this.frameHandle)
    this.frameHandle = null
    this.set({
      isPlaying: false,
      isLoading: false,
      isVisible: false,
      currentTime: 0,
      duration: 0,
      buffered: 0,
    })
  }

  // ─── Internals ─────────────────────────────────────────────────────

  private switchTo(index: number, autoplay: boolean): void {
    const from = this._state.currentTrack
    const track = this._tracks[index]
    const audio = this.audio
    this.set({
      currentTrack: index,
      currentTime: 0,
      duration: 0,
      buffered: 0,
      error: null,
      isPlaying: autoplay && this._state.isPlaying,
      isLoading: false,
      trackChangeCount: this._state.trackChangeCount + (index === from ? 0 : 1),
    })
    if (audio) {
      audio.src = track.src
      audio.load()
    }
    this.mediaSession.setTrack(track)
    if (index !== from) this.events.emit('trackchange', { from, to: index, track })
    if (autoplay) void this.play()
  }

  /** Apply a patch and notify; `force` publishes a new snapshot even without field changes. */
  private set(patch: Partial<PulseState>, force = false): void {
    const prev = this._state
    let changed = force
    for (const key in patch) {
      if (!Object.is(prev[key as keyof PulseState], patch[key as keyof PulseState])) {
        changed = true
        break
      }
    }
    if (!changed) return
    const next = Object.freeze({ ...prev, ...patch })
    this._state = next
    if (prev.isPlaying !== next.isPlaying) {
      this.mediaSession.setPlaying(next.isPlaying)
      this.syncFrameLoop()
    }
    for (const listener of [...this.stateListeners]) {
      try {
        listener(next)
      } catch (error) {
        console.error('[pulse] state listener threw:', error)
      }
    }
  }

  private canAnalyse(): boolean {
    return this._tracks.every((t) => isAnalysable(t.src, this.options.crossOrigin))
  }

  private ensureAudio(): HTMLAudioElement | null {
    if (this.audio) return this.audio
    const factory =
      this.options.createAudio ?? (typeof Audio === 'undefined' ? null : () => new Audio())
    if (!factory) return null
    const audio = factory()
    audio.preload = this.options.preload
    if (this.options.crossOrigin) audio.crossOrigin = this.options.crossOrigin
    audio.volume = this._state.volume
    audio.muted = this._state.muted
    this.audio = audio
    this.detachAudio = this.listen(audio)
    if (this.options.mediaSession) this.mediaSession.bind()
    const track = this.track
    if (track) {
      audio.src = track.src
      this.mediaSession.setTrack(track)
    }
    return audio
  }

  /** Mirror the element's real state — the source of truth for OS-level controls too. */
  private listen(audio: HTMLAudioElement): () => void {
    const on = <K extends keyof HTMLMediaElementEventMap>(
      type: K,
      fn: () => void,
    ): (() => void) => {
      audio.addEventListener(type, fn)
      return () => audio.removeEventListener(type, fn)
    }
    const offs = [
      on('play', () => {
        const track = this.track
        this.set({ isPlaying: true, error: null, playCount: this._state.playCount + 1 })
        if (track) this.events.emit('play', { track, time: audio.currentTime })
      }),
      on('pause', () => {
        // A natural end fires `pause` right before `ended` — let `ended` decide.
        if (audio.ended) return
        const track = this.track
        this.set({ isPlaying: false, isLoading: false, pauseCount: this._state.pauseCount + 1 })
        if (track) this.events.emit('pause', { track, time: audio.currentTime })
      }),
      on('ended', () => this.handleEnded()),
      on('waiting', () => this.set({ isLoading: true })),
      on('seeking', () => this.set({ isLoading: this._state.isPlaying })),
      on('playing', () => this.set({ isLoading: false, isPlaying: true })),
      on('canplay', () => this.set({ isLoading: false })),
      on('seeked', () => this.set({ isLoading: false, currentTime: audio.currentTime })),
      on('timeupdate', () => {
        this.set({ currentTime: audio.currentTime })
        const now = Date.now()
        if (now - this.lastPositionSync > 1000) {
          this.lastPositionSync = now
          this.mediaSession.setPosition(audio.duration, audio.currentTime, audio.playbackRate)
        }
      }),
      on('durationchange', () => this.set({ duration: audio.duration || 0 })),
      on('loadedmetadata', () => this.set({ duration: audio.duration || 0 })),
      on('progress', () => this.set({ buffered: bufferedFraction(audio) })),
      on('volumechange', () => this.set({ volume: audio.volume, muted: audio.muted })),
      on('error', () => {
        const track = this.track
        this.set({ isPlaying: false, isLoading: false, error: 'media-error' })
        this.events.emit('error', { track, reason: 'media-error', detail: audio.error })
      }),
    ]
    return () => offs.forEach((off) => off())
  }

  private handleEnded(): void {
    const track = this.track
    if (track) this.events.emit('ended', { track })
    const { repeat, currentTrack } = this._state
    const last = currentTrack >= this._tracks.length - 1
    if (repeat === 'one') {
      this.seekTo(0)
      void this.play()
    } else if (repeat === 'all' || !last) {
      if (this._tracks.length === 1) {
        this.seekTo(0)
        void this.play()
      } else {
        this.load((currentTrack + 1) % this._tracks.length, { autoplay: true })
      }
    } else {
      this.set({ isPlaying: false, isLoading: false, currentTime: this._state.duration })
    }
  }

  private teardownAudio(): void {
    const audio = this.audio
    if (!audio) return
    this.detachAudio?.()
    this.detachAudio = null
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
    this.spectrum.dispose()
    this.audio = null
  }

  /** Swap in a fresh element that is not captured by Web Audio. */
  private rebuildAudio(): void {
    const wasPlaying = this._state.isPlaying
    this.teardownAudio()
    this.set({ isPlaying: false })
    if (wasPlaying) void this.play()
  }

  private syncFrameLoop(): void {
    const wanted = this.frameListeners.size > 0 && (this._state.isPlaying || !this.spectrum.settled)
    if (wanted && this.frameHandle === null && typeof requestAnimationFrame !== 'undefined') {
      const tick = (now: number): void => {
        const frame = this.spectrum.sample(this._state.isPlaying, now)
        for (const listener of [...this.frameListeners]) {
          try {
            listener(frame)
          } catch (error) {
            console.error('[pulse] frame listener threw:', error)
          }
        }
        this.frameHandle = null
        this.syncFrameLoop()
      }
      this.frameHandle = requestAnimationFrame(tick)
    } else if (!wanted && this.frameHandle !== null) {
      cancelAnimationFrame(this.frameHandle)
      this.frameHandle = null
    }
  }
}

function bufferedFraction(audio: HTMLMediaElement): number {
  const { buffered, duration, currentTime } = audio
  if (!Number.isFinite(duration) || duration <= 0 || !buffered?.length) return 0
  for (let i = 0; i < buffered.length; i++) {
    if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
      return clamp(buffered.end(i) / duration, 0, 1)
    }
  }
  return clamp(buffered.end(buffered.length - 1) / duration, 0, 1)
}
