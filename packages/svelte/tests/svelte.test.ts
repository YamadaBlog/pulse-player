import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createFakeAudio, ENGINE_ACTIONS, expectActionsForwarded } from '@pulse-music/test-utils'
import { PulseEngine, usePulseAudio } from '../src/index'

const makeEngine = (): PulseEngine =>
  new PulseEngine({
    tracks: [
      { title: 'One', src: '/one.mp3' },
      { title: 'Two', src: '/two.mp3' },
    ],
    createAudio: createFakeAudio,
    mediaSession: false,
  })

describe('usePulseAudio (Svelte store)', () => {
  it('honours the store contract: sync first value, then updates, then unsubscribe', async () => {
    const engine = makeEngine()
    const audio = usePulseAudio({ engine })
    const seen: boolean[] = []
    const unsubscribe = audio.subscribe((s) => seen.push(s.isPlaying))
    expect(seen).toEqual([false])
    await audio.play()
    expect(seen.at(-1)).toBe(true)
    unsubscribe()
    audio.pause()
    expect(seen.at(-1)).toBe(true)
  })

  it('works with svelte/store helpers and derives track + progress', () => {
    const engine = makeEngine()
    const audio = usePulseAudio({ engine })
    audio.next()
    const snapshot = get(audio)
    expect(snapshot.track?.title).toBe('Two')
    expect(snapshot.progress).toBe(0)
    expect(snapshot.tracks).toHaveLength(2)
  })

  it('forwards every action to the engine', () => {
    const engine = makeEngine()
    const audio = usePulseAudio({ engine })
    expectActionsForwarded(
      engine,
      audio as unknown as Record<string, unknown>,
      ENGINE_ACTIONS.filter((n) => n !== 'subscribe'),
    )
  })

  it('registers the custom elements', () => {
    expect(customElements.get('pulse-player')).toBeDefined()
  })
})
