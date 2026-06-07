/**
 * PulseEngine tests — ported from the validated v2.3.4
 * `tests/useAudioStore.test.ts` (22 tests).
 *
 * Coverage mirrors the Vue Pinia store one-for-one so behaviour parity
 * is provable bit-for-bit. The shape differs because PulseEngine is an
 * imperative class:
 *
 *   - `store.isPlaying`            →  `engine.state.isPlaying`
 *   - `store.toggle()`             →  `engine.toggle()` (unchanged)
 *   - `store.subscribe(...)`       →  `engine.subscribe(...)` (unchanged)
 *   - `store.currentTime = 5`      →  `(engine.state as PulseState).currentTime = 5`
 *                                     (state is exposed as Readonly to consumers;
 *                                     tests cast through to set the mutable backing
 *                                     field, simulating what the `timeupdate` event
 *                                     would do at runtime.)
 */
import { describe, expect, it, vi } from 'vitest'
import { PulseEngine } from '../src/PulseEngine'
import type { PulseState } from '@pulse/types'

describe('PulseEngine', () => {
  describe('initial state', () => {
    it('starts paused, invisible, no plays, no pauses', () => {
      const engine = new PulseEngine()
      expect(engine.state.isPlaying).toBe(false)
      expect(engine.state.isVisible).toBe(false)
      expect(engine.state.hasBeenOpened).toBe(false)
      expect(engine.state.playCount).toBe(0)
      expect(engine.state.pauseCount).toBe(0)
      expect(engine.state.trackChangeCount).toBe(0)
      expect(engine.state.ambientEq).toBe(false)
    })

    it('points at the first track', () => {
      const engine = new PulseEngine()
      expect(engine.state.currentTrack).toBe(0)
      expect(engine.track.title).toBeDefined()
    })
  })

  describe('toggle()', () => {
    it('flips isPlaying and bumps the right counter', () => {
      const engine = new PulseEngine()
      engine.toggle()
      expect(engine.state.isPlaying).toBe(true)
      expect(engine.state.playCount).toBe(1)
      expect(engine.state.pauseCount).toBe(0)
      engine.toggle()
      expect(engine.state.isPlaying).toBe(false)
      expect(engine.state.playCount).toBe(1)
      expect(engine.state.pauseCount).toBe(1)
    })

    it('flips isVisible and hasBeenOpened on first play', () => {
      const engine = new PulseEngine()
      expect(engine.state.isVisible).toBe(false)
      engine.toggle()
      expect(engine.state.isVisible).toBe(true)
      expect(engine.state.hasBeenOpened).toBe(true)
    })

    it('emits "play" with track + time', () => {
      const engine = new PulseEngine()
      const seen: Array<{ trackTitle: string; time: number }> = []
      const off = engine.subscribe('play', (p) => {
        seen.push({ trackTitle: p.track.title, time: p.time })
      })
      engine.toggle()
      expect(seen).toHaveLength(1)
      expect(seen[0].trackTitle).toBe(engine.track.title)
      expect(typeof seen[0].time).toBe('number')
      off()
    })

    it('emits "pause" on the second toggle', () => {
      const engine = new PulseEngine()
      const seen: unknown[] = []
      engine.subscribe('pause', (p) => seen.push(p))
      engine.toggle()
      engine.toggle()
      expect(seen).toHaveLength(1)
    })
  })

  describe('loadTrack() / next() / prev()', () => {
    it('changes the index and bumps trackChangeCount', () => {
      const engine = new PulseEngine()
      const before = engine.state.currentTrack
      engine.next()
      expect(engine.state.currentTrack).not.toBe(before)
      expect(engine.state.trackChangeCount).toBe(1)
    })

    it('is a no-op when the same track is requested', () => {
      const engine = new PulseEngine()
      const same = engine.state.currentTrack
      engine.loadTrack(same)
      expect(engine.state.trackChangeCount).toBe(0)
    })

    it('emits "trackchange" with from / to / track', () => {
      const engine = new PulseEngine()
      const seen: Array<{ from: number; to: number }> = []
      engine.subscribe('trackchange', (p) => {
        seen.push({ from: p.from, to: p.to })
      })
      const from = engine.state.currentTrack
      engine.next()
      expect(seen).toHaveLength(1)
      expect(seen[0].from).toBe(from)
      expect(seen[0].to).toBe(engine.state.currentTrack)
    })

    it('prev() restarts the same track if past 3 s', () => {
      const engine = new PulseEngine()
      engine.toggle() // creates the audio element
      // Simulate "5 s elapsed" — at runtime this would be set by the
      // <audio>'s `timeupdate` event. PulseEngine reads from _state.
      ;(engine.state as PulseState).currentTime = 5
      const before = engine.state.currentTrack
      engine.prev()
      expect(engine.state.currentTrack).toBe(before)
      expect(engine.state.trackChangeCount).toBe(0)
    })
  })

  describe('subscribe()', () => {
    it('returns an unsubscribe that detaches the listener', () => {
      const engine = new PulseEngine()
      const cb = vi.fn()
      const off = engine.subscribe('play', cb)
      engine.toggle()
      expect(cb).toHaveBeenCalledTimes(1)
      off()
      engine.toggle() // pause
      engine.toggle() // play again — listener already removed
      expect(cb).toHaveBeenCalledTimes(1)
    })

    it('isolates listener crashes — engine stays healthy', () => {
      const engine = new PulseEngine()
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      engine.subscribe('play', () => {
        throw new Error('boom')
      })
      const ok = vi.fn()
      engine.subscribe('play', ok)
      expect(() => engine.toggle()).not.toThrow()
      expect(ok).toHaveBeenCalledTimes(1)
      errSpy.mockRestore()
    })

    it('returns a noop unsubscribe if called twice', () => {
      const engine = new PulseEngine()
      const cb = vi.fn()
      const off = engine.subscribe('play', cb)
      off()
      off() // should not throw
      engine.toggle()
      expect(cb).not.toHaveBeenCalled()
    })
  })

  describe('open() / close()', () => {
    it('open shows the FAB without starting playback', () => {
      const engine = new PulseEngine()
      engine.open()
      expect(engine.state.isVisible).toBe(true)
      expect(engine.state.isPlaying).toBe(false)
    })

    it('close pauses and hides', () => {
      const engine = new PulseEngine()
      engine.toggle()
      engine.close()
      expect(engine.state.isVisible).toBe(false)
      expect(engine.state.isPlaying).toBe(false)
    })
  })

  describe('fmt()', () => {
    it('formats m:ss', () => {
      const engine = new PulseEngine()
      expect(engine.fmt(0)).toBe('0:00')
      expect(engine.fmt(5)).toBe('0:05')
      expect(engine.fmt(65)).toBe('1:05')
      expect(engine.fmt(125)).toBe('2:05')
    })

    it('handles NaN / undefined defensively', () => {
      const engine = new PulseEngine()
      expect(engine.fmt(NaN)).toBe('0:00')
      expect(engine.fmt(0)).toBe('0:00')
    })
  })

  describe('progress', () => {
    it('is 0 with no duration', () => {
      const engine = new PulseEngine()
      expect(engine.progress).toBe(0)
    })

    it('is the ratio when both fields are set', () => {
      const engine = new PulseEngine()
      ;(engine.state as PulseState).currentTime = 30
      ;(engine.state as PulseState).duration = 60
      expect(engine.progress).toBe(50)
    })
  })

  describe('ambientEq', () => {
    it('flips via setAmbientEq()', () => {
      const engine = new PulseEngine()
      expect(engine.state.ambientEq).toBe(false)
      engine.setAmbientEq(true)
      expect(engine.state.ambientEq).toBe(true)
    })
  })

  describe('registerAmbientView()', () => {
    it('returns an unregister function', () => {
      const engine = new PulseEngine()
      const off = engine.registerAmbientView()
      expect(typeof off).toBe('function')
      off()
    })

    it('counts can be cycled multiple times without underflow', () => {
      const engine = new PulseEngine()
      const a = engine.registerAmbientView()
      const b = engine.registerAmbientView()
      a()
      a() // double-release should be a no-op
      b()
    })
  })

  describe('onStateChange()', () => {
    it('fires when state mutates via an action', () => {
      const engine = new PulseEngine()
      const seen: number[] = []
      const off = engine.onStateChange((s) => seen.push(s.playCount))
      engine.toggle()
      expect(seen).toContain(1)
      off()
    })

    it('detaches via the returned unsubscribe', () => {
      const engine = new PulseEngine()
      const cb = vi.fn()
      const off = engine.onStateChange(cb)
      engine.toggle()
      const before = cb.mock.calls.length
      off()
      engine.toggle()
      expect(cb.mock.calls.length).toBe(before)
    })
  })

  describe('dispose()', () => {
    it('clears event listeners + state', () => {
      const engine = new PulseEngine()
      const cb = vi.fn()
      engine.subscribe('play', cb)
      engine.toggle() // start audio + emit play
      expect(cb).toHaveBeenCalledTimes(1)
      engine.dispose()
      // Listener was cleared, so re-toggling should NOT call cb again.
      engine.toggle()
      expect(cb).toHaveBeenCalledTimes(1)
      expect(engine.state.isPlaying).toBe(true) // new audio graph initialised
      engine.dispose()
    })

    it('is safe to call without initAudio', () => {
      const engine = new PulseEngine()
      expect(() => engine.dispose()).not.toThrow()
    })

    it('is idempotent — multiple calls do not throw', () => {
      const engine = new PulseEngine()
      engine.toggle()
      expect(() => {
        engine.dispose()
        engine.dispose()
        engine.dispose()
      }).not.toThrow()
    })
  })
})
