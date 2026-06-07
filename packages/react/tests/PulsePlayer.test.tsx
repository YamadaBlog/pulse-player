/**
 * `<PulsePlayer />` React wrapper tests.
 *
 * Verifies the adapter contract:
 *   - The wrapper renders a `<pulse-player>` Custom Element into the DOM.
 *   - React props map to DOM attributes (variant, accent-color).
 *   - on{Event} props are attached as DOM CustomEvent listeners.
 *   - Listener cleanup detaches on unmount (no leaks).
 *
 * Behavioural correctness of the underlying audio engine is gated by
 * the 27 @pulse/core tests; this suite focuses on the React ↔ DOM
 * bridge.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { PulsePlayer } from '../src/PulsePlayer'
import { PulseEngine, setSharedEngine } from '../src/index'

beforeEach(() => {
  // Reset the singleton between tests so playCount / isPlaying /
  // currentTrack don't leak.
  setSharedEngine(new PulseEngine())
})

afterEach(() => {
  cleanup()
})

describe('<PulsePlayer />', () => {
  it('renders a <pulse-player> Custom Element', () => {
    const { container } = render(<PulsePlayer />)
    const el = container.querySelector('pulse-player')
    expect(el).not.toBeNull()
    expect(el).toBeInstanceOf(HTMLElement)
  })

  it('maps the `variant` prop to the kebab-case attribute', () => {
    const { container } = render(<PulsePlayer variant="midnight" />)
    const el = container.querySelector('pulse-player')!
    expect(el.getAttribute('variant')).toBe('midnight')
  })

  it('maps `accentColor` to `accent-color`', () => {
    const { container } = render(<PulsePlayer accentColor="#8B5CF6" />)
    const el = container.querySelector('pulse-player')!
    expect(el.getAttribute('accent-color')).toBe('#8B5CF6')
  })

  it('forwards `onPlay` when the engine emits play', async () => {
    const onPlay = vi.fn()
    const { container } = render(<PulsePlayer onPlay={onPlay} />)
    const el = container.querySelector('pulse-player')!
    // Wait one microtask for Lit's first updateComplete + React's
    // useEffect attachment.
    await (el as HTMLElement & { updateComplete?: Promise<boolean> }).updateComplete

    const engine = setSharedEngine.length
      ? (await import('../src/index')).getSharedEngine()
      : (await import('../src/index')).getSharedEngine()
    engine.toggle()
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onPlay.mock.calls[0][0].track.title).toBeDefined()
    expect(typeof onPlay.mock.calls[0][0].time).toBe('number')
  })

  it('forwards `onPause` on the second toggle', async () => {
    const onPause = vi.fn()
    const { container } = render(<PulsePlayer onPause={onPause} />)
    const el = container.querySelector('pulse-player')!
    await (el as HTMLElement & { updateComplete?: Promise<boolean> }).updateComplete

    const { getSharedEngine } = await import('../src/index')
    const engine = getSharedEngine()
    engine.toggle() // play
    engine.toggle() // pause
    expect(onPause).toHaveBeenCalledTimes(1)
  })

  it('forwards `onTrackChange` on next()', async () => {
    const onTrackChange = vi.fn()
    const { container } = render(<PulsePlayer onTrackChange={onTrackChange} />)
    const el = container.querySelector('pulse-player')!
    await (el as HTMLElement & { updateComplete?: Promise<boolean> }).updateComplete

    const { getSharedEngine } = await import('../src/index')
    getSharedEngine().next()
    expect(onTrackChange).toHaveBeenCalledTimes(1)
    expect(onTrackChange.mock.calls[0][0].to).toBeDefined()
  })

  it('detaches handlers on unmount (no leak)', async () => {
    const onPlay = vi.fn()
    const { container, unmount } = render(<PulsePlayer onPlay={onPlay} />)
    const el = container.querySelector('pulse-player')!
    await (el as HTMLElement & { updateComplete?: Promise<boolean> }).updateComplete

    unmount()

    const { getSharedEngine } = await import('../src/index')
    getSharedEngine().toggle()
    expect(onPlay).not.toHaveBeenCalled()
  })

  it('passes pass-through className to the Custom Element', () => {
    const { container } = render(<PulsePlayer className="my-player" />)
    const el = container.querySelector('pulse-player')!
    expect(el.getAttribute('class')).toBe('my-player')
  })
})
