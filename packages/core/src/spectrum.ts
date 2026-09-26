import type { AudioFrame } from '@pulse-music/types'
import { clamp } from './format'

type AudioContextCtor = typeof AudioContext

function getAudioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as unknown as {
    AudioContext?: AudioContextCtor
    webkitAudioContext?: AudioContextCtor
  }
  return w.AudioContext ?? w.webkitAudioContext
}

/**
 * Whether routing `src` through Web Audio is safe. A cross-origin media
 * element captured by `createMediaElementSource()` outputs pure silence
 * unless it was fetched with CORS — so we only analyse same-origin,
 * `data:` / `blob:` sources, or sources the integrator declared
 * CORS-enabled via the `crossOrigin` option.
 */
export function isAnalysable(src: string, crossOrigin: string | undefined): boolean {
  if (crossOrigin) return true
  if (typeof location === 'undefined') return false
  try {
    const url = new URL(src, location.href)
    if (url.protocol === 'data:' || url.protocol === 'blob:') return true
    return url.origin === location.origin
  } catch {
    return false
  }
}

const FFT_SIZE = 1024
const MIN_HZ = 45
const MAX_HZ = 12_000
const ATTACK = 0.55
const RELEASE = 0.12

/**
 * Web Audio graph (media element → analyser → speakers) plus the
 * band-reduction maths. Created lazily, inside a user gesture, and only
 * wired once the AudioContext is actually running — a suspended context
 * would otherwise swallow the element's output.
 */
export class SpectrumAnalyser {
  readonly bands: Float32Array
  energy = 0
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private source: MediaElementAudioSourceNode | null = null
  private bins: Uint8Array<ArrayBuffer> | null = null
  private ranges: Array<[number, number]> = []
  private connecting = false

  constructor(bandCount: number) {
    this.bands = new Float32Array(bandCount)
  }

  /** `true` once real spectrum data flows. */
  get live(): boolean {
    return this.analyser !== null
  }

  /** Try to capture `audio`. Safe to call on every play — it's idempotent. */
  connect(audio: HTMLMediaElement): void {
    if (this.analyser) {
      if (this.ctx?.state === 'suspended') void this.ctx.resume().catch(() => undefined)
      return
    }
    if (this.connecting) return
    const Ctor = getAudioContextCtor()
    if (!Ctor) return
    let ctx: AudioContext
    try {
      ctx = new Ctor()
    } catch {
      return
    }
    this.ctx = ctx
    this.connecting = true
    const wire = (): void => {
      this.connecting = false
      if (this.ctx !== ctx || ctx.state !== 'running') {
        // Never route audio into a context that can't run: it would be silent.
        void ctx.close().catch(() => undefined)
        if (this.ctx === ctx) this.ctx = null
        return
      }
      try {
        const analyser = ctx.createAnalyser()
        analyser.fftSize = FFT_SIZE
        analyser.smoothingTimeConstant = 0.7
        const source = ctx.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(ctx.destination)
        this.analyser = analyser
        this.source = source
        this.bins = new Uint8Array(analyser.frequencyBinCount)
        this.ranges = computeRanges(this.bands.length, ctx.sampleRate, analyser.frequencyBinCount)
      } catch {
        void ctx.close().catch(() => undefined)
        this.ctx = null
      }
    }
    if (ctx.state === 'running') wire()
    else void ctx.resume().then(wire, wire)
  }

  /** Advance one frame. `playing` drives the synthetic fallback and the release. */
  sample(playing: boolean, now: number): AudioFrame {
    const { bands } = this
    const live = playing && this.analyser !== null && this.bins !== null
    if (live) {
      this.analyser!.getByteFrequencyData(this.bins!)
      for (let i = 0; i < bands.length; i++) {
        const [from, to] = this.ranges[i]
        let peak = 0
        for (let b = from; b <= to; b++) if (this.bins![b] > peak) peak = this.bins![b]
        // Treble carries less energy: tilt it up so the row reads as balanced.
        const tilt = 0.85 + (i / bands.length) * 0.75
        smooth(bands, i, clamp(Math.pow(peak / 255, 1.35) * tilt, 0, 1))
      }
    } else if (playing) {
      // Synthetic, deterministic motion so visuals stay alive without data.
      const t = now / 1000
      for (let i = 0; i < bands.length; i++) {
        const x = i / bands.length
        const wave =
          0.5 +
          0.28 * Math.sin(t * 2.1 + i * 0.55) +
          0.16 * Math.sin(t * 3.7 - i * 0.9) +
          0.08 * Math.sin(t * 7.3 + i * 1.7)
        smooth(bands, i, clamp(wave * (1 - x * 0.45), 0, 1))
      }
    } else {
      for (let i = 0; i < bands.length; i++) smooth(bands, i, 0)
    }
    let energy = 0
    let weight = 0
    for (let i = 0; i < bands.length; i++) {
      const w = 1.6 - i / bands.length
      energy += bands[i] * w
      weight += w
    }
    this.energy = weight ? energy / weight : 0
    return { bands, energy: this.energy, synthetic: !live }
  }

  /** Whether a paused spectrum has fully settled back to zero. */
  get settled(): boolean {
    return this.energy < 0.002
  }

  dispose(): void {
    try {
      this.source?.disconnect()
      this.analyser?.disconnect()
    } catch {
      /* already disconnected */
    }
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close().catch(() => undefined)
    this.ctx = null
    this.analyser = null
    this.source = null
    this.bins = null
    this.connecting = false
    this.bands.fill(0)
    this.energy = 0
  }
}

function smooth(bands: Float32Array, i: number, target: number): void {
  const k = target > bands[i] ? ATTACK : RELEASE
  bands[i] += (target - bands[i]) * k
}

/** Map `count` log-spaced bands onto analyser bin ranges. */
function computeRanges(
  count: number,
  sampleRate: number,
  binCount: number,
): Array<[number, number]> {
  const hzPerBin = sampleRate / 2 / binCount
  const ranges: Array<[number, number]> = []
  let previous = -1
  for (let i = 0; i < count; i++) {
    const lo = MIN_HZ * Math.pow(MAX_HZ / MIN_HZ, i / count)
    const hi = MIN_HZ * Math.pow(MAX_HZ / MIN_HZ, (i + 1) / count)
    const from = Math.max(previous + 1, Math.floor(lo / hzPerBin))
    const to = Math.max(from, Math.min(binCount - 1, Math.floor(hi / hzPerBin)))
    ranges.push([Math.min(from, binCount - 1), to])
    previous = to
  }
  return ranges
}
