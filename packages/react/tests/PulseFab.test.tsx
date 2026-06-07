/**
 * `<PulseFab />` React wrapper tests.
 *
 * Verifies the adapter contract:
 *   - Renders a `<pulse-fab>` Custom Element
 *   - `variant`, `pulso`, `showMenu`, `draggable`, `persistKey` map
 *     to the right attributes (boolean / string)
 *   - on{Event} props forward as DOM CustomEvent listeners
 *   - Detach on unmount
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { PulseFab } from '../src/PulseFab'
import { PulseEngine, setSharedEngine } from '../src/index'

beforeEach(() => {
  setSharedEngine(new PulseEngine())
})

afterEach(() => {
  cleanup()
})

describe('<PulseFab />', () => {
  it('renders a <pulse-fab> Custom Element', () => {
    const { container } = render(<PulseFab />)
    expect(container.querySelector('pulse-fab')).not.toBeNull()
  })

  it('maps the `variant` prop to the attribute', () => {
    const { container } = render(<PulseFab variant="vinyl" />)
    const el = container.querySelector('pulse-fab')!
    expect(el.getAttribute('variant')).toBe('vinyl')
  })

  it('sets `pulso` as boolean presence attribute when true', () => {
    const { container } = render(<PulseFab pulso />)
    const el = container.querySelector('pulse-fab')!
    expect(el.hasAttribute('pulso')).toBe(true)
  })

  it('removes `pulso` attribute when false', () => {
    const { container } = render(<PulseFab pulso={false} />)
    const el = container.querySelector('pulse-fab')!
    expect(el.hasAttribute('pulso')).toBe(false)
  })

  it('sets `show-menu` as boolean presence attribute', () => {
    const { container } = render(<PulseFab showMenu />)
    const el = container.querySelector('pulse-fab')!
    expect(el.hasAttribute('show-menu')).toBe(true)
  })

  it('sets `draggable` and `persist-key` attributes', () => {
    const { container } = render(<PulseFab draggable persistKey="my-app-fab" />)
    const el = container.querySelector('pulse-fab')!
    expect(el.hasAttribute('draggable')).toBe(true)
    expect(el.getAttribute('persist-key')).toBe('my-app-fab')
  })

  it('forwards onPlay when the engine plays', async () => {
    const onPlay = vi.fn()
    const { container } = render(<PulseFab onPlay={onPlay} />)
    const el = container.querySelector('pulse-fab') as HTMLElement & {
      updateComplete?: Promise<boolean>
    }
    await el.updateComplete

    const { getSharedEngine } = await import('../src/index')
    getSharedEngine().toggle()

    expect(onPlay).toHaveBeenCalledTimes(1)
    expect(onPlay.mock.calls[0][0].track.title).toBeDefined()
  })

  it('detaches onPlay on unmount', async () => {
    const onPlay = vi.fn()
    const { container, unmount } = render(<PulseFab onPlay={onPlay} />)
    const el = container.querySelector('pulse-fab') as HTMLElement & {
      updateComplete?: Promise<boolean>
    }
    await el.updateComplete

    unmount()

    const { getSharedEngine } = await import('../src/index')
    getSharedEngine().toggle()
    expect(onPlay).not.toHaveBeenCalled()
  })
})
