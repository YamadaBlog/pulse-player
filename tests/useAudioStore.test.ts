import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAudioStore } from '../src/lib/useAudioStore'

describe('useAudioStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('starts paused, invisible, no plays, no pauses', () => {
      const store = useAudioStore()
      expect(store.isPlaying).toBe(false)
      expect(store.isVisible).toBe(false)
      expect(store.hasBeenOpened).toBe(false)
      expect(store.playCount).toBe(0)
      expect(store.pauseCount).toBe(0)
      expect(store.trackChangeCount).toBe(0)
      expect(store.ambientEq).toBe(false)
    })

    it('points at the first track', () => {
      const store = useAudioStore()
      expect(store.currentTrack).toBe(0)
      expect(store.track.title).toBeDefined()
    })
  })

  describe('toggle()', () => {
    it('flips isPlaying and bumps the right counter', () => {
      const store = useAudioStore()
      store.toggle()
      expect(store.isPlaying).toBe(true)
      expect(store.playCount).toBe(1)
      expect(store.pauseCount).toBe(0)
      store.toggle()
      expect(store.isPlaying).toBe(false)
      expect(store.playCount).toBe(1)
      expect(store.pauseCount).toBe(1)
    })

    it('flips isVisible and hasBeenOpened on first play', () => {
      const store = useAudioStore()
      expect(store.isVisible).toBe(false)
      store.toggle()
      expect(store.isVisible).toBe(true)
      expect(store.hasBeenOpened).toBe(true)
    })

    it('emits "play" with track + time', () => {
      const store = useAudioStore()
      const seen: Array<{ trackTitle: string; time: number }> = []
      const off = store.subscribe('play', (p) => {
        const payload = p as { track: { title: string }; time: number }
        seen.push({ trackTitle: payload.track.title, time: payload.time })
      })
      store.toggle()
      expect(seen).toHaveLength(1)
      expect(seen[0].trackTitle).toBe(store.track.title)
      expect(typeof seen[0].time).toBe('number')
      off()
    })

    it('emits "pause" on the second toggle', () => {
      const store = useAudioStore()
      const seen: unknown[] = []
      store.subscribe('pause', (p) => seen.push(p))
      store.toggle()
      store.toggle()
      expect(seen).toHaveLength(1)
    })
  })

  describe('loadTrack() / next() / prev()', () => {
    it('changes the index and bumps trackChangeCount', () => {
      const store = useAudioStore()
      const before = store.currentTrack
      store.next()
      expect(store.currentTrack).not.toBe(before)
      expect(store.trackChangeCount).toBe(1)
    })

    it('is a no-op when the same track is requested', () => {
      const store = useAudioStore()
      const same = store.currentTrack
      store.loadTrack(same)
      expect(store.trackChangeCount).toBe(0)
    })

    it('emits "trackchange" with from / to / track', () => {
      const store = useAudioStore()
      const seen: Array<{ from: number; to: number }> = []
      store.subscribe('trackchange', (p) => {
        const payload = p as { from: number; to: number }
        seen.push({ from: payload.from, to: payload.to })
      })
      const from = store.currentTrack
      store.next()
      expect(seen).toHaveLength(1)
      expect(seen[0].from).toBe(from)
      expect(seen[0].to).toBe(store.currentTrack)
    })

    it('prev() restarts the same track if past 3 s', () => {
      const store = useAudioStore()
      store.toggle() // creates the audio element
      store.currentTime = 5
      const before = store.currentTrack
      store.prev()
      expect(store.currentTrack).toBe(before)
      expect(store.trackChangeCount).toBe(0)
    })
  })

  describe('subscribe()', () => {
    it('returns an unsubscribe that detaches the listener', () => {
      const store = useAudioStore()
      const cb = vi.fn()
      const off = store.subscribe('play', cb)
      store.toggle()
      expect(cb).toHaveBeenCalledTimes(1)
      off()
      store.toggle() // pause
      store.toggle() // play again — listener already removed
      expect(cb).toHaveBeenCalledTimes(1)
    })

    it('isolates listener crashes — store stays healthy', () => {
      const store = useAudioStore()
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      store.subscribe('play', () => {
        throw new Error('boom')
      })
      const ok = vi.fn()
      store.subscribe('play', ok)
      expect(() => store.toggle()).not.toThrow()
      expect(ok).toHaveBeenCalledTimes(1)
      errSpy.mockRestore()
    })

    it('returns a noop unsubscribe if called twice', () => {
      const store = useAudioStore()
      const cb = vi.fn()
      const off = store.subscribe('play', cb)
      off()
      off() // should not throw
      store.toggle()
      expect(cb).not.toHaveBeenCalled()
    })
  })

  describe('open() / close()', () => {
    it('open shows the FAB without starting playback', () => {
      const store = useAudioStore()
      store.open()
      expect(store.isVisible).toBe(true)
      expect(store.isPlaying).toBe(false)
    })

    it('close pauses and hides', () => {
      const store = useAudioStore()
      store.toggle()
      store.close()
      expect(store.isVisible).toBe(false)
      expect(store.isPlaying).toBe(false)
    })
  })

  describe('fmt()', () => {
    it('formats m:ss', () => {
      const store = useAudioStore()
      expect(store.fmt(0)).toBe('0:00')
      expect(store.fmt(5)).toBe('0:05')
      expect(store.fmt(65)).toBe('1:05')
      expect(store.fmt(125)).toBe('2:05')
    })

    it('handles NaN / undefined defensively', () => {
      const store = useAudioStore()
      expect(store.fmt(NaN)).toBe('0:00')
      expect(store.fmt(0)).toBe('0:00')
    })
  })

  describe('progress', () => {
    it('is 0 with no duration', () => {
      const store = useAudioStore()
      expect(store.progress).toBe(0)
    })

    it('is the ratio when both fields are set', () => {
      const store = useAudioStore()
      store.currentTime = 30
      store.duration = 60
      expect(store.progress).toBe(50)
    })
  })

  describe('ambientEq', () => {
    it('is a writable global flag', () => {
      const store = useAudioStore()
      expect(store.ambientEq).toBe(false)
      store.ambientEq = true
      expect(store.ambientEq).toBe(true)
    })
  })

  describe('registerAmbientView()', () => {
    it('returns an unregister function', () => {
      const store = useAudioStore()
      const off = store.registerAmbientView()
      expect(typeof off).toBe('function')
      off()
    })

    it('counts can be cycled multiple times without underflow', () => {
      const store = useAudioStore()
      const a = store.registerAmbientView()
      const b = store.registerAmbientView()
      a()
      a() // double-release should be a no-op
      b()
    })
  })

  describe('dispose()', () => {
    it('clears event listeners + state', () => {
      const store = useAudioStore()
      const cb = vi.fn()
      store.subscribe('play', cb)
      store.toggle() // start audio + emit play
      expect(cb).toHaveBeenCalledTimes(1)
      store.dispose()
      // Listener was cleared, so re-toggling should NOT call cb again.
      store.toggle()
      expect(cb).toHaveBeenCalledTimes(1)
      expect(store.isPlaying).toBe(true) // new audio graph initialised
      store.dispose()
    })

    it('is safe to call without initAudio', () => {
      const store = useAudioStore()
      expect(() => store.dispose()).not.toThrow()
    })

    it('is idempotent — multiple calls do not throw', () => {
      const store = useAudioStore()
      store.toggle()
      expect(() => {
        store.dispose()
        store.dispose()
        store.dispose()
      }).not.toThrow()
    })
  })
})
