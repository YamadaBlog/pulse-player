import { act, cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createFakeAudio, ENGINE_ACTIONS, expectActionsForwarded } from '@pulse-music/test-utils'
import { PulseEngine, PulseFab, PulsePlayer, usePulseAudio, type Track } from '../src/index'

const TRACKS: Track[] = [
  { title: 'One', artist: 'A', src: '/one.mp3' },
  { title: 'Two', artist: 'B', src: '/two.mp3' },
]
const makeEngine = (): PulseEngine =>
  new PulseEngine({ tracks: TRACKS, createAudio: createFakeAudio, mediaSession: false })

afterEach(cleanup)

type LitLike = HTMLElement & Record<string, unknown> & { updateComplete: Promise<boolean> }
const element = (container: Element, tag: string): LitLike =>
  container.querySelector(tag) as LitLike

describe('usePulseAudio', () => {
  it('re-renders on engine changes and exposes stable actions', async () => {
    const engine = makeEngine()
    const { result } = renderHook(() => usePulseAudio({ engine }))
    const firstToggle = result.current.toggle
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.track?.title).toBe('One')
    await act(() => engine.play())
    expect(result.current.isPlaying).toBe(true)
    act(() => result.current.next())
    expect(result.current.track?.title).toBe('Two')
    expect(result.current.toggle).toBe(firstToggle)
    expect(result.current.fmt(75)).toBe('1:15')
  })
})

describe('usePulseAudio actions', () => {
  it('forward to the engine', () => {
    const engine = makeEngine()
    const { result } = renderHook(() => usePulseAudio({ engine }))
    expectActionsForwarded(engine, result.current as unknown as Record<string, unknown>, [
      ...ENGINE_ACTIONS,
      'setMuted',
      'open',
    ])
  })
})

describe('<PulsePlayer />', () => {
  it('renders the custom element with properties, not stringified attributes', async () => {
    const engine = makeEngine()
    const labels = { play: 'Lecture' }
    const { container } = render(
      <PulsePlayer engine={engine} variant="aurora" ambientEq labels={labels} className="hero" />,
    )
    const el = element(container, 'pulse-player')
    await el.updateComplete
    expect(el.getAttribute('variant')).toBe('aurora')
    expect(el.engine).toBe(engine)
    expect(el.ambientEq).toBe(true)
    expect(el.labels).toBe(labels)
    expect(el.className).toBe('hero')
  })

  it('maps pulse-* events to callback props, using the latest callback', async () => {
    const engine = makeEngine()
    const first = vi.fn()
    const second = vi.fn()
    const { container, rerender } = render(<PulsePlayer engine={engine} onTrackChange={first} />)
    rerender(<PulsePlayer engine={engine} onTrackChange={second} />)
    await element(container, 'pulse-player').updateComplete
    act(() => engine.next())
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith(expect.objectContaining({ from: 0, to: 1 }))
  })

  it('passes children through (declarative tracks, actions slot)', () => {
    const { container } = render(
      <PulsePlayer engine={makeEngine()}>
        <a slot="actions" href="#x">
          x
        </a>
      </PulsePlayer>,
    )
    expect(container.querySelector('pulse-player > a[slot="actions"]')).not.toBeNull()
  })
})

describe('<PulseFab />', () => {
  it('forwards its options', async () => {
    const { container } = render(
      <PulseFab engine={makeEngine()} placement="bottom-start" pulso size={72} />,
    )
    const el = element(container, 'pulse-fab')
    await el.updateComplete
    expect(el.getAttribute('placement')).toBe('bottom-start')
    expect(el.pulso).toBe(true)
    expect(el.size).toBe(72)
  })
})
