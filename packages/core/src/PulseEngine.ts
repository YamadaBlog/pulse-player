/**
 * PulseEngine — framework-agnostic audio engine + state machine.
 *
 * Pure TypeScript. No DOM library imports beyond `window` / `HTMLAudioElement`
 * / `AudioContext`. No reactivity primitive — framework adapters
 * subscribe via `onStateChange()` and project the state into their
 * own primitive (Vue refs, React state, RN reanimated values, …).
 *
 * Mirrors the validated Vue v2.3.4 `useAudioStore.ts` behaviour
 * bit-for-bit:
 *
 *   - Singleton `<audio>` + AudioContext + AnalyserNode (FFT 256).
 *   - safePlay() catches autoplay rejections, rolls UI state back,
 *     emits an 'error' event.
 *   - cancellable rAF EQ loop tied to play state.
 *   - Webkit AudioContext fallback for Safari < 14.1.
 *   - 4-bar FFT focal (eqBars) updated 60 fps via triggerRef pattern,
 *     mutated in place. No allocations per frame.
 *   - Typed event bus: 'play' | 'pause' | 'trackchange' | 'error'.
 *   - Privacy-friendly counters (playCount, pauseCount, trackChangeCount).
 *   - `track` getter clamps to a valid index so `setAudioTracks(shorter)`
 *     mid-playback can't crash consumers.
 *   - `dispose()` tear-down for SPA shells.
 */

import type {
  AudioEvent,
  ErrorReason,
  EventListener,
  EventMap,
  PulseState,
  Track,
  Unsubscribe,
} from '@pulse-music/types'

const DEFAULT_TRACKS: Track[] = [
  {
    title: 'MIDNIGHT RUN',
    src: '/audio/track1.webm',
    cover: '/audio/cover.webp',
    coverPos: '20% center',
  },
  {
    title: 'DEEP FOCUS',
    src: '/audio/track2.webm',
    cover: '/audio/cover2.webp',
    coverPos: '50% 60%',
    coverScale: 1.25,
  },
]

function createInitialState(): PulseState {
  return {
    currentTrack: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isVisible: false,
    hasBeenOpened: false,
    ambientEq: false,
    playCount: 0,
    pauseCount: 0,
    trackChangeCount: 0,
  }
}

type StateListener = (state: Readonly<PulseState>) => void

export class PulseEngine {
  // ─── State ───────────────────────────────────────────────────
  private _state: PulseState = createInitialState()
  private _tracks: Track[]

  // 4-bar FFT focal (NOW PLAYING + FAB chrome). Mutated in place every
  // tick — zero allocations per frame.
  private _eqBars: number[] = [0, 0, 0, 0]

  // Stable shallow ref kept as a public hook for integrators wanting to
  // drive their own ambient visualiser. Since v1.0.2 the built-in
  // ambient EQ is a pure-CSS animation, so the engine does not mutate
  // this array — it stays as 32 zeros.
  private _eqAmbientBars: number[] = new Array(32).fill(0)

  // ─── Audio internals (singleton, never re-assigned after init) ──
  private audio: HTMLAudioElement | null = null
  private audioCtx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private eqRaf: number | null = null

  // ─── Event bus (typed via discriminated union) ───────────────
  private _listeners = new Map<AudioEvent, Set<EventListener<AudioEvent>>>()

  // ─── State change subscribers (for framework adapters) ──────
  private _stateListeners = new Set<StateListener>()

  // ─── Ambient EQ registry (kept as a stable no-op for backward compat) ──
  private ambientSubscribers = 0

  constructor(tracks?: Track[]) {
    this._tracks = tracks ?? DEFAULT_TRACKS
  }

  // ─── Public read-only views ─────────────────────────────────
  get state(): Readonly<PulseState> {
    return this._state
  }

  /**
   * Active track. Clamped to a valid index so calling
   * `setAudioTracks([smallerList])` after playback started never returns
   * `undefined` — the consumer gets the first track instead.
   */
  get track(): Track {
    const list = this._tracks
    if (!list.length) {
      throw new Error('PulseEngine: track list is empty — pass at least one track')
    }
    const i = this._state.currentTrack
    if (i < 0 || i >= list.length) {
      return list[Math.max(0, Math.min(list.length - 1, i))]
    }
    return list[i]
  }

  get tracks(): readonly Track[] {
    return this._tracks
  }

  get progress(): number {
    if (this._state.duration === 0) return 0
    return (this._state.currentTime / this._state.duration) * 100
  }

  /** 4-bar focal FFT (60 fps). Read-only — the engine mutates it in place. */
  get eqBars(): readonly number[] {
    return this._eqBars
  }

  /** 32-bar ambient FFT. Stable hook — not mutated by the engine since v1.0.2. */
  get eqAmbientBars(): readonly number[] {
    return this._eqAmbientBars
  }

  // ─── Configuration ──────────────────────────────────────────
  setAudioTracks(tracks: Track[]): void {
    if (!tracks.length) throw new Error('setAudioTracks: tracks must contain at least one entry')
    this._tracks = tracks.slice()
    this.notifyStateChange()
  }

  setAmbientEq(on: boolean): void {
    this._state.ambientEq = on
    this.notifyStateChange()
  }

  // ─── Event bus ──────────────────────────────────────────────
  subscribe<E extends AudioEvent>(event: E, cb: EventListener<E>): Unsubscribe {
    let set = this._listeners.get(event)
    if (!set) {
      set = new Set()
      this._listeners.set(event, set)
    }
    set.add(cb as EventListener<AudioEvent>)
    return () => {
      set!.delete(cb as EventListener<AudioEvent>)
    }
  }

  private emit<E extends AudioEvent>(event: E, payload: EventMap[E]): void {
    const set = this._listeners.get(event)
    if (!set) return
    set.forEach((cb) => {
      try {
        ;(cb as EventListener<E>)(payload)
      } catch (e) {
        /* eslint-disable-next-line no-console */ console.error(
          `[PulseEngine] listener for "${event}" threw:`,
          e,
        )
      }
    })
  }

  // ─── State change subscription (framework adapters) ─────────
  onStateChange(cb: StateListener): Unsubscribe {
    this._stateListeners.add(cb)
    return () => {
      this._stateListeners.delete(cb)
    }
  }

  private notifyStateChange(): void {
    this._stateListeners.forEach((cb) => {
      try {
        cb(this._state)
      } catch (e) {
        /* eslint-disable-next-line no-console */ console.error(
          '[PulseEngine] state listener threw:',
          e,
        )
      }
    })
  }

  // ─── Ambient registry (no-op since v1.0.2; kept for compat) ──
  registerAmbientView(): Unsubscribe {
    this.ambientSubscribers++
    return () => {
      this.ambientSubscribers = Math.max(0, this.ambientSubscribers - 1)
    }
  }

  // ─── Lifecycle ──────────────────────────────────────────────
  private initAudio(): void {
    if (this.audio) return
    const a = new Audio(this._tracks[this._state.currentTrack].src)
    a.volume = 0.7
    a.addEventListener('timeupdate', () => {
      this._state.currentTime = a.currentTime
      this.notifyStateChange()
    })
    a.addEventListener('loadedmetadata', () => {
      this._state.duration = a.duration
      this.notifyStateChange()
    })
    a.addEventListener('ended', () => {
      this.next()
    })
    a.addEventListener('error', () => {
      this._state.isPlaying = false
      this.stopEqLoop()
      this.notifyStateChange()
      this.emit('error', { track: this.track, reason: 'media-error', detail: a.error })
    })
    a.addEventListener('stalled', () => {
      this.emit('error', { track: this.track, reason: 'stalled' })
    })
    this.audio = a

    try {
      // Safari < 14.1 still needs the webkit prefix.
      const AudioCtor: typeof AudioContext =
        (
          window as unknown as {
            AudioContext?: typeof AudioContext
            webkitAudioContext?: typeof AudioContext
          }
        ).AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!
      this.audioCtx = new AudioCtor()
      this.analyser = this.audioCtx.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.5
      this.sourceNode = this.audioCtx.createMediaElementSource(a)
      this.sourceNode.connect(this.analyser)
      this.analyser.connect(this.audioCtx.destination)
    } catch {
      /* fallback: bars stay at 0 — AudioContext unavailable */
    }
  }

  private startEqLoop(): void {
    if (!this.analyser || this.eqRaf !== null) return
    const data = new Uint8Array(this.analyser.frequencyBinCount)
    const focal = this._eqBars
    const tick = (): void => {
      if (!this.analyser) {
        this.eqRaf = null
        return
      }
      this.analyser.getByteFrequencyData(data)
      focal[0] = data[3] / 255
      focal[1] = data[8] / 255
      focal[2] = data[18] / 255
      focal[3] = data[36] / 255
      this.eqRaf = requestAnimationFrame(tick)
    }
    this.eqRaf = requestAnimationFrame(tick)
  }

  private stopEqLoop(): void {
    if (this.eqRaf !== null) {
      cancelAnimationFrame(this.eqRaf)
      this.eqRaf = null
    }
  }

  /**
   * Catches autoplay rejections + rolls back the UI state, then emits
   * a typed `'error'` event with reason `'play-rejected'`.
   */
  private safePlay(): void {
    if (!this.audio) return
    const result = this.audio.play()
    if (result && typeof result.then === 'function') {
      result.catch((err: unknown) => {
        this._state.isPlaying = false
        this.stopEqLoop()
        this.notifyStateChange()
        this.emit('error', {
          track: this.track,
          reason: 'play-rejected' as ErrorReason,
          detail: err,
        })
      })
    }
  }

  // ─── Actions ────────────────────────────────────────────────
  toggle(): void {
    this.initAudio()
    if (!this.audio) return
    if (this._state.isPlaying) {
      this.audio.pause()
      this._state.isPlaying = false
      this._state.pauseCount++
      this.stopEqLoop()
      this.emit('pause', { track: this.track, time: this._state.currentTime })
    } else {
      this._state.isPlaying = true
      this._state.hasBeenOpened = true
      this._state.isVisible = true
      this._state.playCount++
      this.startEqLoop()
      this.emit('play', { track: this.track, time: this._state.currentTime })
      this.safePlay()
    }
    this.notifyStateChange()
  }

  loadTrack(i: number): void {
    if (i < 0 || i >= this._tracks.length) return
    const from = this._state.currentTrack
    if (from === i) return
    this._state.currentTrack = i
    this._state.trackChangeCount++
    if (this.audio) {
      this.audio.src = this._tracks[i].src
      this.audio.load()
      this._state.currentTime = 0
      this._state.duration = 0
      if (this._state.isPlaying) this.safePlay()
    }
    this.notifyStateChange()
    this.emit('trackchange', { from, to: i, track: this._tracks[i] })
  }

  next(): void {
    this.loadTrack((this._state.currentTrack + 1) % this._tracks.length)
  }

  prev(): void {
    if (this._state.currentTime > 3 && this.audio) {
      this.audio.currentTime = 0
      return
    }
    this.loadTrack(
      (this._state.currentTrack - 1 + this._tracks.length) % this._tracks.length,
    )
  }

  seek(fraction: number): void {
    if (!this.audio || this._state.duration === 0) return
    this.audio.currentTime = Math.max(0, Math.min(1, fraction)) * this._state.duration
  }

  open(): void {
    this._state.isVisible = true
    this.notifyStateChange()
  }

  close(): void {
    if (this.audio) {
      this.audio.pause()
    }
    this._state.isPlaying = false
    this._state.isVisible = false
    this.stopEqLoop()
    this.notifyStateChange()
  }

  fmt(s: number): string {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, '0')}`
  }

  /**
   * Tear down the audio graph and detach every internal reference.
   * In a long-lived SPA the engine survives every navigation; in dev
   * hot-reload or browser-extension popups, call this from the
   * teardown hook to release the AudioContext + listeners. The next
   * `toggle()` rebuilds the audio graph from scratch.
   */
  dispose(): void {
    this.stopEqLoop()
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
      this.audio.removeAttribute('src')
      this.audio.load()
    }
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect()
      } catch {
        /* idem */
      }
    }
    if (this.analyser) {
      try {
        this.analyser.disconnect()
      } catch {
        /* idem */
      }
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {
        /* closing an already-closed context is harmless */
      })
    }
    this.audio = null
    this.audioCtx = null
    this.analyser = null
    this.sourceNode = null
    this._listeners.clear()
    this._state.isPlaying = false
    this._state.isVisible = false
    this._state.currentTime = 0
    this._state.duration = 0
    this.notifyStateChange()
  }
}
