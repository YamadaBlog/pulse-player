import { defineStore } from 'pinia'
import { ref, shallowRef, triggerRef, computed } from 'vue'

export interface Track {
  /** Display title. */
  title: string
  /** Audio source URL (any format the <audio> element accepts). */
  src: string
  /** Cover image URL. */
  cover: string
  /** CSS object-position value applied to the cover (`50% 50%`, `20% center`, ...). */
  coverPos: string
  /** Optional CSS scale applied to the cover (`1.25` zooms in slightly). */
  coverScale?: number
}

const DEFAULT_TRACKS: Track[] = [
  { title: 'MIDNIGHT RUN', src: '/audio/track1.webm', cover: '/audio/cover.webp', coverPos: '20% center' },
  { title: 'DEEP FOCUS', src: '/audio/track2.webm', cover: '/audio/cover2.webp', coverPos: '50% 60%', coverScale: 1.25 },
]

let _tracks: Track[] = DEFAULT_TRACKS

/**
 * Replace the global track list **before** the audio store is consumed by any
 * component. Calling this after playback started has no effect on the current
 * audio element — call `loadTrack(0)` afterwards if you need to reset.
 */
export function setAudioTracks(tracks: Track[]): void {
  if (!tracks.length) throw new Error('setAudioTracks: tracks must contain at least one entry')
  _tracks = tracks.slice()
}

/**
 * useAudioStore — Global audio state.
 *
 * Owns the singleton `<audio>` element + Web Audio API analyser (FFT for the
 * equalizer bars). Lives outside the Vue component tree (Pinia) so playback
 * survives page navigations and component unmounts.
 */
export const useAudioStore = defineStore('pulsePlayerAudio', () => {
  // ═ STATE
  const currentTrack = ref(0)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  /**
   * EQ refs use `shallowRef` because the rAF tick mutates the underlying
   * array IN PLACE and then calls `triggerRef()` once per frame. That
   * skips deep reactivity tracking + array-proxy overhead, and avoids
   * allocating fresh arrays 30–60 times a second — both of which add up
   * fast on the landing page (15+ subscribers, 30 fps × 64 bars).
   */
  const eqBars = shallowRef<number[]>([0, 0, 0, 0])
  /** Pre-mapped 64-value array for the ambient EQ visualiser.
   *  Each value drives one bar directly. The mapping in startEqLoop()
   *  spreads the FFT bins LOGARITHMICALLY (pitch is perceived
   *  logarithmically, and most musical energy sits in the low bins)
   *  and applies a frequency-dependent gain so the high-frequency
   *  bars don't go quiet just because high-end bins have less energy. */
  const eqAmbientBars = shallowRef<number[]>(new Array(64).fill(0))
  const isVisible = ref(false)       // mini-player visible
  const hasBeenOpened = ref(false)    // user started playback at least once
  /** Global ambient-EQ toggle. When true, every <MusicPlayer /> in the
   *  app that doesn't explicitly override the `ambientEq` prop will show
   *  the ambient visualiser. Flip from anywhere via `store.ambientEq`. */
  const ambientEq = ref(false)

  // Audio internals — singleton, never reassigned after init.
  let audio: HTMLAudioElement | null = null
  let audioCtx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let sourceNode: MediaElementAudioSourceNode | null = null
  let eqRaf: number | null = null

  // ═ GETTERS
  const progress = computed(() => {
    if (duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  const track = computed(() => _tracks[currentTrack.value])
  const tracks = computed(() => _tracks)

  // ═ ACTIONS
  function initAudio() {
    if (audio) return
    const a = new Audio(_tracks[currentTrack.value].src)
    a.volume = 0.7
    a.addEventListener('timeupdate', () => { currentTime.value = a.currentTime })
    a.addEventListener('loadedmetadata', () => { duration.value = a.duration })
    a.addEventListener('ended', () => { next() })
    audio = a

    try {
      // Safari < 14.1 still needs the webkit prefix.
      const AudioCtor: typeof AudioContext =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext!
      audioCtx = new AudioCtor()
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256                 // 128 bins — enough headroom for log mapping
      analyser.smoothingTimeConstant = 0.5   // snappier so adjacent bars stop syncing
      sourceNode = audioCtx.createMediaElementSource(a)
      sourceNode.connect(analyser)
      analyser.connect(audioCtx.destination)
    } catch { /* fallback: bars stay at 0 — AudioContext unavailable */ }
  }

  function startEqLoop() {
    if (!analyser || eqRaf !== null) return    // already running
    const data = new Uint8Array(analyser.frequencyBinCount)
    const N = 64
    // Log-frequency map of bar index → FFT bin. minBin = 2 skips the
    // DC bin. maxBin = 48 stays well inside the energetic part of a
    // typical music spectrum (~ 8 kHz at 44.1 kHz / fftSize 256) so
    // the high bars actually move instead of dying at silent bins.
    const minBin = 2
    const maxBin = Math.min(48, data.length - 1)
    const binMap = new Array(N)
    for (let i = 0; i < N; i++) {
      const r = i / (N - 1)
      binMap[i] = Math.round(minBin * Math.pow(maxBin / minBin, r))
    }
    // Mutate the EQ ref buffers IN PLACE every tick + call triggerRef.
    // shallowRef skips deep proxy work, triggerRef notifies all consumers
    // with a single update. No per-frame allocations: ~0 GC pressure.
    const focal = eqBars.value
    const ambient = eqAmbientBars.value
    let frame = 0
    function tick() {
      if (!analyser) { eqRaf = null; return }
      analyser.getByteFrequencyData(data)
      // 4-bar condensed visualiser (NOW PLAYING / FAB chrome) — full 60 fps.
      focal[0] = data[3] / 255
      focal[1] = data[8] / 255
      focal[2] = data[18] / 255
      focal[3] = data[36] / 255
      triggerRef(eqBars)
      // 64-bar ambient — half rate, still visually continuous.
      if ((frame++ & 1) === 0) {
        for (let i = 0; i < N; i++) {
          const r = i / (N - 1)
          const raw = data[binMap[i]] / 255
          const gain = 0.65 + r * 0.50
          ambient[i] = Math.min(1, Math.pow(raw, 0.55) * gain)
        }
        triggerRef(eqAmbientBars)
      }
      eqRaf = requestAnimationFrame(tick)
    }
    eqRaf = requestAnimationFrame(tick)
  }

  function stopEqLoop() {
    if (eqRaf !== null) {
      cancelAnimationFrame(eqRaf)
      eqRaf = null
    }
  }

  function toggle() {
    initAudio()
    if (!audio) return
    if (isPlaying.value) {
      audio.pause()
      isPlaying.value = false
      stopEqLoop()                 // stop the rAF — the spectrum is flat anyway
    } else {
      audio.play()
      isPlaying.value = true
      hasBeenOpened.value = true
      isVisible.value = true
      startEqLoop()                // start (or resume) the rAF
    }
  }

  function loadTrack(i: number) {
    if (i < 0 || i >= _tracks.length) return
    currentTrack.value = i
    if (audio) {
      audio.src = _tracks[i].src
      audio.load()
      currentTime.value = 0
      duration.value = 0
      if (isPlaying.value) audio.play()
    }
  }

  function next() { loadTrack((currentTrack.value + 1) % _tracks.length) }

  function prev() {
    if (currentTime.value > 3 && audio) { audio.currentTime = 0; return }
    loadTrack((currentTrack.value - 1 + _tracks.length) % _tracks.length)
  }

  function seek(fraction: number) {
    if (!audio || duration.value === 0) return
    audio.currentTime = Math.max(0, Math.min(1, fraction)) * duration.value
  }

  function open() {
    isVisible.value = true
  }

  function close() {
    if (audio) { audio.pause() }
    isPlaying.value = false
    isVisible.value = false
    stopEqLoop()
  }

  function fmt(s: number): string {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
  }

  return {
    // State
    currentTrack, isPlaying, currentTime, duration, eqBars, eqAmbientBars, ambientEq,
    isVisible, hasBeenOpened,
    // Getters
    progress, track, tracks,
    // Actions
    toggle, next, prev, seek, open, close, fmt, initAudio, loadTrack,
  }
})
