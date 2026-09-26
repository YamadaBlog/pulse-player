/**
 * @pulse-music/test-utils — shared test doubles for the monorepo
 * (private, never published).
 *
 * `FakeAudio` reproduces the observable lifecycle of an
 * `HTMLAudioElement` (events, `paused` / `ended`, play promise) so the
 * engine can be exercised deterministically under jsdom / happy-dom,
 * which don't implement media playback.
 */

type PlayOutcome = 'resolve' | 'reject' | 'abort'

class FakeTimeRanges {
  constructor(private readonly ranges: Array<[number, number]> = []) {}
  get length(): number {
    return this.ranges.length
  }
  start(i: number): number {
    return this.ranges[i][0]
  }
  end(i: number): number {
    return this.ranges[i][1]
  }
}

export class FakeAudio extends EventTarget {
  /** Every instance created, most recent last. */
  static instances: FakeAudio[] = []
  /** Outcome of the next `play()` call on any instance. */
  static nextPlay: PlayOutcome = 'resolve'

  paused = true
  ended = false
  currentTime = 0
  duration = NaN
  readyState = 0
  preload = ''
  crossOrigin: string | null = null
  playbackRate = 1
  error: { code: number } | null = null
  buffered: FakeTimeRanges = new FakeTimeRanges()
  playCalls = 0
  loadCalls = 0
  private _src = ''
  private _volume = 1
  private _muted = false

  constructor() {
    super()
    FakeAudio.instances.push(this)
  }

  static reset(): void {
    FakeAudio.instances = []
    FakeAudio.nextPlay = 'resolve'
  }

  static get last(): FakeAudio | undefined {
    return FakeAudio.instances[FakeAudio.instances.length - 1]
  }

  get src(): string {
    return this._src
  }
  set src(value: string) {
    this._src = value ? new URL(value, 'http://localhost/').href : ''
    this.paused = true
    this.ended = false
    this.currentTime = 0
    this.duration = NaN
    this.readyState = 0
  }

  get volume(): number {
    return this._volume
  }
  set volume(v: number) {
    this._volume = v
    this.fire('volumechange')
  }

  get muted(): boolean {
    return this._muted
  }
  set muted(m: boolean) {
    if (m === this._muted) return
    this._muted = m
    this.fire('volumechange')
  }

  removeAttribute(name: string): void {
    if (name === 'src') this._src = ''
  }

  load(): void {
    this.loadCalls++
  }

  play(): Promise<void> {
    this.playCalls++
    const outcome = FakeAudio.nextPlay
    FakeAudio.nextPlay = 'resolve'
    if (outcome === 'reject') {
      return Promise.reject(
        Object.assign(new Error('NotAllowedError'), { name: 'NotAllowedError' }),
      )
    }
    if (outcome === 'abort') {
      return Promise.reject(Object.assign(new Error('AbortError'), { name: 'AbortError' }))
    }
    if (this.paused) {
      this.paused = false
      this.ended = false
      this.fire('play')
      this.readyState = 4
      this.fire('playing')
    }
    return Promise.resolve()
  }

  pause(): void {
    if (this.paused) return
    this.paused = true
    this.fire('pause')
  }

  // ─── Test helpers ────────────────────────────────────────────────

  fire(type: string): void {
    this.dispatchEvent(new Event(type))
  }

  /** Simulate metadata arriving. */
  setDuration(seconds: number): void {
    this.duration = seconds
    this.readyState = Math.max(this.readyState, 1)
    this.fire('durationchange')
    this.fire('loadedmetadata')
  }

  /** Simulate playback progressing to `seconds`. */
  advance(seconds: number): void {
    this.currentTime = seconds
    this.fire('timeupdate')
  }

  setBuffered(ranges: Array<[number, number]>): void {
    this.buffered = new FakeTimeRanges(ranges)
    this.fire('progress')
  }

  /** Simulate the track reaching its end (`pause` then `ended`, per spec). */
  finish(): void {
    this.currentTime = Number.isFinite(this.duration) ? this.duration : this.currentTime
    this.ended = true
    this.paused = true
    this.fire('pause')
    this.fire('ended')
  }

  /** Simulate a load / decode failure. */
  fail(code = 4): void {
    this.error = { code }
    this.paused = true
    this.fire('error')
  }
}

/** Factory to pass as `createAudio` in `PulseEngineOptions`. */
export const createFakeAudio = (): HTMLAudioElement =>
  new FakeAudio() as unknown as HTMLAudioElement

// ─── Web Audio ─────────────────────────────────────────────────────

export class StubAnalyserNode {
  fftSize = 2048
  smoothingTimeConstant = 0.8
  level = 0
  get frequencyBinCount(): number {
    return this.fftSize / 2
  }
  connect(): void {}
  disconnect(): void {}
  getByteFrequencyData(arr: Uint8Array): void {
    arr.fill(this.level)
  }
}

export class StubAudioContext {
  static instances: StubAudioContext[] = []
  /** Initial state of the next context. */
  static initialState: AudioContextState = 'running'
  state: AudioContextState
  sampleRate = 48_000
  destination = {}
  analyser = new StubAnalyserNode()
  sources = 0

  constructor() {
    this.state = StubAudioContext.initialState
    StubAudioContext.instances.push(this)
  }
  createAnalyser(): StubAnalyserNode {
    return this.analyser
  }
  createMediaElementSource(): { connect(): void; disconnect(): void } {
    this.sources++
    return { connect() {}, disconnect() {} }
  }
  resume(): Promise<void> {
    return Promise.resolve()
  }
  close(): Promise<void> {
    this.state = 'closed'
    return Promise.resolve()
  }
}

export function installAudioContextStub(): void {
  StubAudioContext.instances = []
  StubAudioContext.initialState = 'running'
  const g = globalThis as Record<string, unknown>
  g.AudioContext = StubAudioContext
  g.webkitAudioContext = StubAudioContext
}

// ─── Animation frames ──────────────────────────────────────────────

let rafQueue = new Map<number, FrameRequestCallback>()
let rafId = 0
let rafNow = 0

/** Replace rAF with a manually flushed queue — call `flushFrames()` to advance. */
export function installManualRaf(): void {
  rafQueue = new Map()
  rafId = 0
  rafNow = 0
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    rafQueue.set(++rafId, cb)
    return rafId
  }
  globalThis.cancelAnimationFrame = (id: number): void => {
    rafQueue.delete(id)
  }
}

/** Run `count` animation frames, 16 ms apart. */
export function flushFrames(count = 1): void {
  for (let i = 0; i < count; i++) {
    rafNow += 16
    const pending = [...rafQueue.values()]
    rafQueue.clear()
    for (const cb of pending) cb(rafNow)
  }
}

export function pendingFrames(): number {
  return rafQueue.size
}

// ─── Media Session ─────────────────────────────────────────────────

export interface FakeMediaSession {
  metadata: unknown
  playbackState: string
  handlers: Map<string, ((details: Record<string, unknown>) => void) | null>
  positions: Array<Record<string, number>>
  setActionHandler(
    action: string,
    handler: ((details: Record<string, unknown>) => void) | null,
  ): void
  setPositionState(state: Record<string, number>): void
}

export function installMediaSessionStub(): FakeMediaSession {
  const session: FakeMediaSession = {
    metadata: null,
    playbackState: 'none',
    handlers: new Map(),
    positions: [],
    setActionHandler(action, handler) {
      this.handlers.set(action, handler)
    },
    setPositionState(state) {
      this.positions.push(state)
    },
  }
  Object.defineProperty(navigator, 'mediaSession', { value: session, configurable: true })
  ;(globalThis as Record<string, unknown>).MediaMetadata = class {
    constructor(init: Record<string, unknown>) {
      Object.assign(this, init)
    }
  }
  return session
}

// ─── Layout ────────────────────────────────────────────────────────

export function installResizeObserverStub(): void {
  if (typeof globalThis.ResizeObserver !== 'undefined') return
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver
}

/** Microtask flush — lets promise chains inside the engine settle. */
export const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))

export { expectActionsForwarded, ENGINE_ACTIONS } from './forwarding'
