import { describe, expect, it, vi } from 'vitest'
import type { Track } from '@pulse-music/types'
import {
  FakeAudio,
  StubAudioContext,
  createFakeAudio,
  flushFrames,
  installMediaSessionStub,
  pendingFrames,
  tick,
} from '@pulse-music/test-utils'
import { PulseEngine, type PulseEngineOptions } from '../src/PulseEngine'

const TRACKS: Track[] = [
  { title: 'One', artist: 'A', src: '/audio/one.mp3', cover: '/covers/one.svg' },
  { title: 'Two', artist: 'B', src: '/audio/two.mp3' },
  { title: 'Three', artist: 'C', src: '/audio/three.mp3' },
]

const make = (options: PulseEngineOptions = {}): PulseEngine =>
  new PulseEngine({ tracks: TRACKS, createAudio: createFakeAudio, mediaSession: false, ...options })

const audio = (): FakeAudio => {
  const a = FakeAudio.last
  if (!a) throw new Error('no audio element was created')
  return a
}

describe('construction', () => {
  it('starts idle with sensible defaults', () => {
    const engine = make()
    expect(engine.state).toMatchObject({
      currentTrack: 0,
      isPlaying: false,
      isLoading: false,
      volume: 0.8,
      muted: false,
      repeat: 'all',
      error: null,
      isVisible: false,
      playCount: 0,
    })
    expect(engine.track?.title).toBe('One')
  })

  it('accepts a bare track array (legacy signature)', () => {
    const engine = new PulseEngine(TRACKS)
    expect(engine.tracks).toHaveLength(3)
  })

  it('is SSR-safe: no media element until prepare() or play()', () => {
    const engine = make()
    expect(FakeAudio.instances).toHaveLength(0)
    engine.prepare()
    expect(FakeAudio.instances).toHaveLength(1)
    expect(audio().src).toBe('http://localhost/audio/one.mp3')
    expect(audio().preload).toBe('metadata')
  })

  it('supports an empty playlist', () => {
    const engine = make({ tracks: [] })
    expect(engine.track).toBeNull()
    expect(engine.progress).toBe(0)
    engine.toggle()
    engine.next()
    engine.prev()
    expect(engine.state.isPlaying).toBe(false)
  })

  it('publishes frozen snapshots with a new identity on every change', () => {
    const engine = make()
    const before = engine.state
    expect(Object.isFrozen(before)).toBe(true)
    engine.setVolume(0.5)
    expect(engine.state).not.toBe(before)
    expect(before.volume).toBe(0.8)
  })

  it('does not notify when a change is a no-op', () => {
    const engine = make()
    const listener = vi.fn()
    engine.onStateChange(listener)
    engine.setRepeat('all')
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('play / pause', () => {
  it('flips state optimistically, then counts the real play', async () => {
    const engine = make()
    const onPlay = vi.fn()
    engine.subscribe('play', onPlay)
    const pending = engine.play()
    expect(engine.state.isPlaying).toBe(true)
    expect(engine.state.isVisible).toBe(true)
    expect(engine.state.hasBeenOpened).toBe(true)
    await pending
    expect(engine.state.playCount).toBe(1)
    expect(onPlay).toHaveBeenCalledWith({ track: TRACKS[0], time: 0 })
  })

  it('rolls back and reports when the browser rejects play()', async () => {
    const engine = make()
    const onError = vi.fn()
    engine.subscribe('error', onError)
    FakeAudio.nextPlay = 'reject'
    await engine.play()
    expect(engine.state.isPlaying).toBe(false)
    expect(engine.state.error).toBe('play-rejected')
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ reason: 'play-rejected' }))
  })

  it('treats an interrupted play() (AbortError) as a non-event', async () => {
    const engine = make()
    const onError = vi.fn()
    engine.subscribe('error', onError)
    FakeAudio.nextPlay = 'abort'
    await engine.play()
    expect(onError).not.toHaveBeenCalled()
    expect(engine.state.error).toBeNull()
  })

  it('clears a previous error once playback succeeds', async () => {
    const engine = make()
    FakeAudio.nextPlay = 'reject'
    await engine.play()
    await engine.play()
    expect(engine.state.error).toBeNull()
    expect(engine.state.isPlaying).toBe(true)
  })

  it('pause() emits exactly one pause and counts it', async () => {
    const engine = make()
    const onPause = vi.fn()
    engine.subscribe('pause', onPause)
    await engine.play()
    engine.pause()
    expect(engine.state.isPlaying).toBe(false)
    expect(engine.state.pauseCount).toBe(1)
    expect(onPause).toHaveBeenCalledTimes(1)
  })

  it('toggle() alternates', async () => {
    const engine = make()
    engine.toggle()
    await tick()
    expect(engine.state.isPlaying).toBe(true)
    engine.toggle()
    expect(engine.state.isPlaying).toBe(false)
  })

  it('follows pauses that happen outside the engine (OS media keys, headphones)', async () => {
    const engine = make()
    await engine.play()
    audio().pause()
    expect(engine.state.isPlaying).toBe(false)
    audio().play()
    expect(engine.state.isPlaying).toBe(true)
  })

  it('tracks buffering through waiting / playing', async () => {
    const engine = make()
    await engine.play()
    audio().fire('waiting')
    expect(engine.state.isLoading).toBe(true)
    audio().fire('playing')
    expect(engine.state.isLoading).toBe(false)
  })

  it('surfaces media errors', async () => {
    const engine = make()
    const onError = vi.fn()
    engine.subscribe('error', onError)
    await engine.play()
    audio().fail()
    expect(engine.state).toMatchObject({ isPlaying: false, error: 'media-error' })
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'media-error', track: TRACKS[0] }),
    )
  })
})

describe('navigation', () => {
  it('next() wraps around and emits trackchange', () => {
    const engine = make()
    const onChange = vi.fn()
    engine.subscribe('trackchange', onChange)
    engine.next()
    engine.next()
    engine.next()
    expect(engine.state.currentTrack).toBe(0)
    expect(engine.state.trackChangeCount).toBe(3)
    expect(onChange).toHaveBeenLastCalledWith({ from: 2, to: 0, track: TRACKS[0] })
  })

  it('prev() restarts the track past 3 s, otherwise goes back', async () => {
    const engine = make()
    await engine.play()
    audio().setDuration(120)
    audio().advance(42)
    engine.prev()
    expect(engine.state.currentTrack).toBe(0)
    expect(engine.state.currentTime).toBe(0)
    engine.prev()
    expect(engine.state.currentTrack).toBe(2)
  })

  it('keeps playing across a track change', async () => {
    const engine = make()
    await engine.play()
    engine.next()
    await tick()
    expect(engine.state.isPlaying).toBe(true)
    expect(audio().src).toBe('http://localhost/audio/two.mp3')
    expect(audio().paused).toBe(false)
  })

  it('stays paused across a track change when paused', () => {
    const engine = make()
    engine.prepare()
    engine.next()
    expect(engine.state.isPlaying).toBe(false)
    expect(audio().playCalls).toBe(0)
  })

  it('load() ignores invalid indices and honours autoplay', async () => {
    const engine = make()
    engine.load(99)
    engine.load(-1)
    engine.load(1.5)
    expect(engine.state.currentTrack).toBe(0)
    engine.load(2, { autoplay: true })
    await tick()
    expect(engine.state.currentTrack).toBe(2)
    expect(engine.state.isPlaying).toBe(true)
  })
})

describe('end of track', () => {
  it("repeat 'all' advances without a pause flicker", async () => {
    const engine = make()
    const states: boolean[] = []
    engine.onStateChange((s) => states.push(s.isPlaying))
    await engine.play()
    const onEnded = vi.fn()
    engine.subscribe('ended', onEnded)
    audio().setDuration(10)
    audio().finish()
    await tick()
    expect(onEnded).toHaveBeenCalledWith({ track: TRACKS[0] })
    expect(engine.state.currentTrack).toBe(1)
    expect(engine.state.isPlaying).toBe(true)
    expect(engine.state.pauseCount).toBe(0)
    expect(states).not.toContain(false)
  })

  it("repeat 'none' stops after the last track", async () => {
    const engine = make({ repeat: 'none' })
    engine.load(2)
    await engine.play()
    audio().setDuration(10)
    audio().finish()
    expect(engine.state.isPlaying).toBe(false)
    expect(engine.state.currentTrack).toBe(2)
  })

  it("repeat 'one' restarts the same track", async () => {
    const engine = make()
    engine.setRepeat('one')
    await engine.play()
    audio().setDuration(10)
    audio().finish()
    await tick()
    expect(engine.state.currentTrack).toBe(0)
    expect(engine.state.isPlaying).toBe(true)
    expect(audio().currentTime).toBe(0)
  })

  it('a single-track playlist loops instead of freezing in "playing"', async () => {
    const engine = make({ tracks: [TRACKS[0]] })
    await engine.play()
    audio().setDuration(10)
    audio().finish()
    await tick()
    expect(engine.state.isPlaying).toBe(true)
    expect(audio().paused).toBe(false)
  })
})

describe('seeking, volume, buffering', () => {
  it('seek helpers clamp and are no-ops without a duration', async () => {
    const engine = make()
    engine.seek(0.5)
    expect(engine.state.currentTime).toBe(0)
    await engine.play()
    audio().setDuration(200)
    engine.seek(0.5)
    expect(audio().currentTime).toBe(100)
    engine.seekBy(-500)
    expect(engine.state.currentTime).toBe(0)
    engine.seekTo(9999)
    expect(engine.state.currentTime).toBe(200)
    expect(engine.progress).toBe(100)
  })

  it('volume and mute stay in sync with the element', () => {
    const engine = make()
    engine.prepare()
    engine.setVolume(2)
    expect(engine.state.volume).toBe(1)
    engine.toggleMute()
    expect(audio().muted).toBe(true)
    expect(engine.state.muted).toBe(true)
    engine.setVolume(0.3)
    expect(engine.state.muted).toBe(false)
    audio().volume = 0.1
    expect(engine.state.volume).toBe(0.1)
  })

  it('reports the buffered-ahead fraction', async () => {
    const engine = make()
    await engine.play()
    audio().setDuration(100)
    audio().advance(10)
    audio().setBuffered([[0, 40]])
    expect(engine.state.buffered).toBeCloseTo(0.4)
  })
})

describe('setTracks()', () => {
  it('keeps the playing track when it survives the new list', async () => {
    const engine = make()
    engine.load(1)
    await engine.play()
    engine.setTracks([TRACKS[2], TRACKS[1]])
    expect(engine.state.currentTrack).toBe(1)
    expect(engine.state.isPlaying).toBe(true)
  })

  it('loads the start index (paused) otherwise', async () => {
    const engine = make()
    await engine.play()
    const fresh: Track[] = [
      { title: 'X', src: '/x.mp3' },
      { title: 'Y', src: '/y.mp3' },
    ]
    engine.setTracks(fresh, { startIndex: 1 })
    expect(engine.track?.title).toBe('Y')
    expect(engine.state.isPlaying).toBe(false)
    expect(audio().src).toBe('http://localhost/y.mp3')
  })

  it('plays the right track when a cross-origin source forces a new element', async () => {
    const engine = make()
    await engine.play()
    expect(engine.hasLiveSpectrum).toBe(true)
    const remote: Track = { title: 'Remote', src: 'https://cdn.example.com/r.mp3' }
    engine.setTracks([remote, TRACKS[0]])
    await tick()
    expect(engine.state.currentTrack).toBe(1)
    expect(engine.track?.title).toBe('One')
    expect(audio().src).toBe('http://localhost/audio/one.mp3')
    expect(engine.state.isPlaying).toBe(true)
    expect(engine.hasLiveSpectrum).toBe(false)
  })

  it('accepts an empty list', async () => {
    const engine = make()
    await engine.play()
    engine.setTracks([])
    expect(engine.track).toBeNull()
    expect(engine.state.isPlaying).toBe(false)
  })
})

describe('listeners', () => {
  it('isolates a throwing listener', async () => {
    const engine = make()
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const good = vi.fn()
    engine.subscribe('play', () => {
      throw new Error('boom')
    })
    engine.subscribe('play', good)
    await engine.play()
    expect(good).toHaveBeenCalled()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('unsubscribe detaches', async () => {
    const engine = make()
    const fn = vi.fn()
    const off = engine.subscribe('play', fn)
    off()
    await engine.play()
    expect(fn).not.toHaveBeenCalled()
  })
})

describe('visualiser', () => {
  it('wires a real analyser for same-origin audio', async () => {
    const engine = make()
    await engine.play()
    expect(StubAudioContext.instances).toHaveLength(1)
    expect(StubAudioContext.instances[0].sources).toBe(1)
    expect(engine.hasLiveSpectrum).toBe(true)
  })

  it('never captures cross-origin audio without CORS (it would be silent)', async () => {
    const engine = make({ tracks: [{ title: 'Remote', src: 'https://cdn.example.com/a.mp3' }] })
    await engine.play()
    expect(StubAudioContext.instances).toHaveLength(0)
    expect(engine.hasLiveSpectrum).toBe(false)
  })

  it('captures cross-origin audio when crossOrigin is declared', async () => {
    const engine = make({
      tracks: [{ title: 'Remote', src: 'https://cdn.example.com/a.mp3' }],
      crossOrigin: 'anonymous',
    })
    await engine.play()
    expect(audio().crossOrigin).toBe('anonymous')
    expect(engine.hasLiveSpectrum).toBe(true)
  })

  it('never routes audio into a context that stays suspended', async () => {
    StubAudioContext.initialState = 'suspended'
    const engine = make()
    await engine.play()
    await tick()
    expect(StubAudioContext.instances[0].sources).toBe(0)
    expect(StubAudioContext.instances[0].state).toBe('closed')
  })

  it('respects visualizer: false', async () => {
    const engine = make({ visualizer: false })
    await engine.play()
    expect(StubAudioContext.instances).toHaveLength(0)
  })

  it('runs the frame loop only while playing, then settles and stops', async () => {
    const engine = make({ bands: 8 })
    const frames: number[] = []
    engine.onFrame((f) => frames.push(f.energy))
    expect(pendingFrames()).toBe(0)
    await engine.play()
    StubAudioContext.instances[0].analyser.level = 200
    flushFrames(10)
    expect(frames.length).toBe(10)
    expect(frames.at(-1)).toBeGreaterThan(0.3)
    engine.pause()
    flushFrames(120)
    expect(frames.at(-1)).toBeLessThan(0.002)
    expect(pendingFrames()).toBe(0)
  })

  it('synthesises frames when no real spectrum is available', async () => {
    const engine = make({ visualizer: false, bands: 4 })
    let last: { synthetic: boolean; energy: number } | undefined
    engine.onFrame((f) => (last = { synthetic: f.synthetic, energy: f.energy }))
    await engine.play()
    flushFrames(30)
    expect(last?.synthetic).toBe(true)
    expect(last?.energy).toBeGreaterThan(0)
  })
})

describe('Media Session', () => {
  it('publishes metadata, playback state and handles OS actions', async () => {
    const session = installMediaSessionStub()
    const engine = make({ mediaSession: true })
    await engine.play()
    expect(session.metadata).toMatchObject({ title: 'One', artist: 'A' })
    expect(session.playbackState).toBe('playing')
    session.handlers.get('nexttrack')!({})
    expect(engine.state.currentTrack).toBe(1)
    session.handlers.get('pause')!({})
    expect(session.playbackState).toBe('paused')
    engine.dispose()
    expect(session.handlers.get('play')).toBeNull()
  })
})

describe('Media Session ownership', () => {
  it('leaves the OS media controls alone with mediaSession: false', async () => {
    const session = installMediaSessionStub()
    const engine = make({ mediaSession: false })
    await engine.play()
    engine.next()
    expect(session.metadata).toBeNull()
    expect(session.playbackState).toBe('none')
  })
})

describe('lifecycle', () => {
  it('dispose() releases the element and the engine stays usable', async () => {
    const engine = make()
    await engine.play()
    const first = audio()
    engine.dispose()
    expect(first.src).toBe('')
    expect(engine.state.isPlaying).toBe(false)
    await engine.play()
    expect(FakeAudio.instances).toHaveLength(2)
    expect(engine.state.isPlaying).toBe(true)
  })

  it('open() / close() drive the floating-player visibility', async () => {
    const engine = make()
    engine.open()
    expect(engine.state.isVisible).toBe(true)
    await engine.play()
    engine.close()
    expect(engine.state).toMatchObject({ isVisible: false, isPlaying: false })
  })
})
