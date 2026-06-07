/**
 * `usePulseAudio()` tests — verifies the Svelte classic-store
 * subscribe contract:
 *
 *   - `subscribe(run)` fires `run(snapshot)` SYNCHRONOUSLY on
 *     subscription (Svelte's contract; matters for `$store`
 *     autosubscribe to populate the initial render).
 *   - `subscribe(run)` then fires `run(newSnapshot)` on every
 *     engine state change.
 *   - The returned function is the unsubscribe; calling it detaches
 *     the listener so no further snapshots arrive.
 *   - `toggle`, `next`, `seek`, etc. proxy to the engine.
 *   - The exposed `engine` is the shared singleton.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PulseEngine, setSharedEngine, getSharedEngine } from '../src/index'
import { usePulseAudio } from '../src/usePulseAudio'

beforeEach(() => {
  setSharedEngine(new PulseEngine())
})

describe('usePulseAudio() — Svelte classic-store contract', () => {
  it('fires the snapshot synchronously on subscribe', () => {
    const audio = usePulseAudio()
    const seen: Array<{ isPlaying: boolean }> = []
    const unsub = audio.subscribe((s) => seen.push({ isPlaying: s.isPlaying }))
    expect(seen).toHaveLength(1)
    expect(seen[0].isPlaying).toBe(false)
    unsub()
  })

  it('fires again on every engine state change', () => {
    const audio = usePulseAudio()
    const seen: Array<{ isPlaying: boolean; playCount: number }> = []
    const unsub = audio.subscribe((s) =>
      seen.push({ isPlaying: s.isPlaying, playCount: s.playCount }),
    )
    audio.toggle() // play
    audio.toggle() // pause
    audio.toggle() // play again
    // 1 sync on subscribe + 3 on each toggle = 4
    expect(seen.length).toBeGreaterThanOrEqual(4)
    expect(seen[seen.length - 1].isPlaying).toBe(true)
    expect(seen[seen.length - 1].playCount).toBe(2)
    unsub()
  })

  it('detaches via the returned unsubscribe', () => {
    const audio = usePulseAudio()
    const cb = vi.fn()
    const unsub = audio.subscribe(cb)
    const before = cb.mock.calls.length
    unsub()
    audio.toggle()
    expect(cb.mock.calls.length).toBe(before)
  })

  it('includes derived `track` and `progress` in the snapshot', () => {
    const audio = usePulseAudio()
    let snapshot: ReturnType<typeof getSnapshot> | null = null
    function getSnapshot() {
      return null
    }
    audio.subscribe((s) => {
      snapshot = s as any
    })
    expect(snapshot!.track.title).toBeDefined()
    expect(typeof snapshot!.progress).toBe('number')
  })

  it('proxies `toggle` to the engine', () => {
    const audio = usePulseAudio()
    expect(getSharedEngine().state.isPlaying).toBe(false)
    audio.toggle()
    expect(getSharedEngine().state.isPlaying).toBe(true)
  })

  it('proxies `next` and bumps trackChangeCount', () => {
    const audio = usePulseAudio()
    expect(getSharedEngine().state.trackChangeCount).toBe(0)
    audio.next()
    expect(getSharedEngine().state.trackChangeCount).toBe(1)
  })

  it('exposes the shared engine for advanced consumers', () => {
    const audio = usePulseAudio()
    expect(audio.engine).toBe(getSharedEngine())
  })

  it('`fmt(s)` formats seconds as m:ss', () => {
    const audio = usePulseAudio()
    expect(audio.fmt(0)).toBe('0:00')
    expect(audio.fmt(65)).toBe('1:05')
    expect(audio.fmt(125)).toBe('2:05')
  })
})
