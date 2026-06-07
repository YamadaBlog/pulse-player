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
  /** Stable shallow ref kept as a public hook for integrators who want
   *  to drive their own ambient visualiser. Since v1.0.2 the built-in
   *  ambient EQ is a pure-CSS animation, so the store no longer mutates
   *  this array — it stays as 32 zeros. You can mutate it from outside
   *  and `triggerRef()` your own consumers. */
  const eqAmbientBars = shallowRef<number[]>(new Array(32).fill(0))
  const isVisible = ref(false) // mini-player visible
  const hasBeenOpened = ref(false) // user started playback at least once
  // Lightweight, privacy-friendly counters. Incremented locally only —
  // no network, no third-party. Useful for "how often did the user
  // press play" analytics that the integrator can hook up to their
  // own backend if they want.
  const playCount = ref(0)
  const pauseCount = ref(0)
  const trackChangeCount = ref(0)
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

  // ═ EVENT BUS — opt-in. Default: empty, no listeners, no cost.
  //  `store.subscribe('play', cb)` returns an unsubscribe function.
  //  Events emitted by this store:
  //    'play'        — payload: { track: Track, time: number }
  //    'pause'       — payload: { track: Track, time: number }
  //    'trackchange' — payload: { from: number, to: number, track: Track }
  type AudioEvent = 'play' | 'pause' | 'trackchange'
  type EventPayload = Record<string, unknown>
  type Listener = (payload: EventPayload) => void
  const _listeners = new Map<AudioEvent, Set<Listener>>()

  function subscribe(event: AudioEvent, cb: Listener): () => void {
    let set = _listeners.get(event)
    if (!set) {
      set = new Set()
      _listeners.set(event, set)
    }
    set.add(cb)
    return () => {
      set!.delete(cb)
    }
  }

  function emit(event: AudioEvent, payload: EventPayload): void {
    const set = _listeners.get(event)
    if (!set) return
    set.forEach((cb) => {
      // One listener throwing must NEVER take the store down.
      try {
        cb(payload)
      } catch (e) {
        /* eslint-disable-next-line no-console */ console.error(
          `[useAudioStore] listener for "${event}" threw:`,
          e,
        )
      }
    })
  }

  // ═ AMBIENT EQ REGISTRY (kept as a stable no-op for backward compat)
  //
  // v1.0.2 moved the ambient visualiser from a per-frame FFT pipeline
  // to a pure-CSS @keyframes animation, so there is nothing left to
  // gate on visibility — the bars composite on the GPU regardless and
  // cost nothing per frame. The function stays exported so any
  // integrator that built against v1.0.1 doesn't break; it returns
  // a no-op unsubscribe.
  function registerAmbientView(): () => void {
    return () => {
      /* no-op since v1.0.2 — kept for API stability */
    }
  }

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
    a.addEventListener('timeupdate', () => {
      currentTime.value = a.currentTime
    })
    a.addEventListener('loadedmetadata', () => {
      duration.value = a.duration
    })
    a.addEventListener('ended', () => {
      next()
    })
    audio = a

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
      audioCtx = new AudioCtor()
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256 // 128 bins — enough headroom for log mapping
      analyser.smoothingTimeConstant = 0.5 // snappier so adjacent bars stop syncing
      sourceNode = audioCtx.createMediaElementSource(a)
      sourceNode.connect(analyser)
      analyser.connect(audioCtx.destination)
    } catch {
      /* fallback: bars stay at 0 — AudioContext unavailable */
    }
  }

  function startEqLoop() {
    if (!analyser || eqRaf !== null) return // already running
    const data = new Uint8Array(analyser.frequencyBinCount)
    // Mutate the focal EQ buffer IN PLACE every tick + call triggerRef.
    // shallowRef skips deep proxy work, triggerRef notifies all
    // consumers with a single update. No per-frame allocations.
    const focal = eqBars.value
    function tick() {
      if (!analyser) {
        eqRaf = null
        return
      }
      analyser.getByteFrequencyData(data)
      // 4-bar condensed visualiser (NOW PLAYING / FAB chrome) — full 60 fps.
      focal[0] = data[3] / 255
      focal[1] = data[8] / 255
      focal[2] = data[18] / 255
      focal[3] = data[36] / 255
      triggerRef(eqBars)
      // Note: since v1.0.2, the 64-bar `eqAmbientBars` ref is no longer
      // driven from this loop. The ambient EQ visualiser runs entirely
      // on a shared CSS @keyframes animation — composited on the GPU,
      // zero JavaScript per frame, zero reactive broadcasts. We keep
      // the ref on the store as a stable shallowRef in case any
      // integrator wants to point a custom visualiser at it.
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
      pauseCount.value++
      stopEqLoop() // stop the rAF — the spectrum is flat anyway
      emit('pause', { track: track.value, time: currentTime.value })
    } else {
      audio.play()
      isPlaying.value = true
      hasBeenOpened.value = true
      isVisible.value = true
      playCount.value++
      startEqLoop() // start (or resume) the rAF
      emit('play', { track: track.value, time: currentTime.value })
    }
  }

  function loadTrack(i: number) {
    if (i < 0 || i >= _tracks.length) return
    const from = currentTrack.value
    if (from === i) return // no-op
    currentTrack.value = i
    trackChangeCount.value++
    if (audio) {
      audio.src = _tracks[i].src
      audio.load()
      currentTime.value = 0
      duration.value = 0
      if (isPlaying.value) audio.play()
    }
    emit('trackchange', { from, to: i, track: _tracks[i] })
  }

  function next() {
    loadTrack((currentTrack.value + 1) % _tracks.length)
  }

  function prev() {
    if (currentTime.value > 3 && audio) {
      audio.currentTime = 0
      return
    }
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
    if (audio) {
      audio.pause()
    }
    isPlaying.value = false
    isVisible.value = false
    stopEqLoop()
  }

  function fmt(s: number): string {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${Math.floor(s % 60)
      .toString()
      .padStart(2, '0')}`
  }

  return {
    // State
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    eqBars,
    eqAmbientBars,
    ambientEq,
    isVisible,
    hasBeenOpened,
    // Privacy-friendly local counters (no network)
    playCount,
    pauseCount,
    trackChangeCount,
    // Getters
    progress,
    track,
    tracks,
    // Actions
    toggle,
    next,
    prev,
    seek,
    open,
    close,
    fmt,
    initAudio,
    loadTrack,
    // Opt-in event subscription (returns unsubscribe)
    subscribe,
    // Ambient EQ visibility registry — internal-but-public so
    // <MusicPlayer /> can declare "I'm currently rendering ambient EQ".
    registerAmbientView,
  }
})
