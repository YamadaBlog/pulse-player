/**
 * Attribute reflection + behaviour tests for the chrome features
 * added in alpha.6, alpha.7, alpha.8:
 *
 *   <pulse-player>
 *     - ambient-eq (alpha.4)         — boolean reflected
 *     - data-fab    (alpha.7)         — boolean reflected, forces fab size
 *     - resizable   (alpha.7)         — boolean reflected, renders drag handle
 *   <pulse-fab>
 *     - pulso       (alpha.2)         — boolean reflected
 *     - draggable   (alpha.7)         — boolean reflected
 *     - persist-key (alpha.7)         — string
 *     - show-menu   (alpha.8)         — boolean reflected, toggles popover
 *
 * Behavioural correctness of the underlying audio engine is gated by
 * the 27 @pulse/core tests; this suite focuses on the attribute /
 * markup contract.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

let container: HTMLElement

beforeEach(async () => {
  const { PulseEngine, setSharedEngine } = await import('../src/index')
  setSharedEngine(new PulseEngine())
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  container.remove()
})

describe('<pulse-player> new attributes', () => {
  it('reflects `ambient-eq` to the host attribute', async () => {
    container.innerHTML = '<pulse-player ambient-eq></pulse-player>'
    const el = container.querySelector('pulse-player')!
    await el.updateComplete
    expect(el.hasAttribute('ambient-eq')).toBe(true)
  })

  it('renders 12 ambient bars regardless of `ambient-eq` (CSS gates visibility)', async () => {
    container.innerHTML = '<pulse-player ambient-eq></pulse-player>'
    const el = container.querySelector('pulse-player')!
    await el.updateComplete
    const bars = el.shadowRoot!.querySelectorAll('.mp__ambient-bar')
    expect(bars.length).toBe(12)
  })

  it('reflects `data-fab` to the host attribute and applies fab data-size', async () => {
    container.innerHTML = '<pulse-player data-fab></pulse-player>'
    const el = container.querySelector('pulse-player')!
    await el.updateComplete
    expect(el.hasAttribute('data-fab')).toBe(true)
    const mp = el.shadowRoot!.querySelector('.mp')!
    expect(mp.getAttribute('data-size')).toBe('fab')
  })

  it('reflects `resizable` and renders the drag handle when on', async () => {
    container.innerHTML = '<pulse-player resizable></pulse-player>'
    const el = container.querySelector('pulse-player')!
    await el.updateComplete
    expect(el.hasAttribute('resizable')).toBe(true)
    expect(el.shadowRoot!.querySelector('.mp__resize-handle')).not.toBeNull()
  })

  it('does NOT render the drag handle by default', async () => {
    container.innerHTML = '<pulse-player></pulse-player>'
    const el = container.querySelector('pulse-player')!
    await el.updateComplete
    expect(el.shadowRoot!.querySelector('.mp__resize-handle')).toBeNull()
  })

  it('renders prev / next ghost buttons in the controls row', async () => {
    container.innerHTML = '<pulse-player></pulse-player>'
    const el = container.querySelector('pulse-player')!
    await el.updateComplete
    const buttons = el.shadowRoot!.querySelectorAll('.mp__btn--ghost')
    expect(buttons.length).toBe(2)
  })

  it('renders mp__bg cover backdrop and mp__noise overlay', async () => {
    container.innerHTML = '<pulse-player variant="midnight"></pulse-player>'
    const el = container.querySelector('pulse-player')!
    await el.updateComplete
    expect(el.shadowRoot!.querySelector('.mp__bg')).not.toBeNull()
    expect(el.shadowRoot!.querySelector('.mp__noise')).not.toBeNull()
  })
})

describe('<pulse-fab> new attributes', () => {
  it('reflects `draggable` to the host attribute and adds .fab--draggable class', async () => {
    container.innerHTML = '<pulse-fab draggable></pulse-fab>'
    const el = container.querySelector('pulse-fab')!
    await el.updateComplete
    expect(el.hasAttribute('draggable')).toBe(true)
    const btn = el.shadowRoot!.querySelector('.fab')!
    expect(btn.className).toContain('fab--draggable')
  })

  it('accepts `persist-key` attribute', async () => {
    container.innerHTML = '<pulse-fab draggable persist-key="my-fab"></pulse-fab>'
    const el = container.querySelector('pulse-fab') as HTMLElement & { persistKey: string }
    await el.updateComplete
    expect(el.persistKey).toBe('my-fab')
  })

  it('reflects `show-menu` and renders the menu toggle when on', async () => {
    container.innerHTML = '<pulse-fab show-menu></pulse-fab>'
    const el = container.querySelector('pulse-fab')!
    await el.updateComplete
    expect(el.hasAttribute('show-menu')).toBe(true)
    expect(el.shadowRoot!.querySelector('.fab__menu-toggle')).not.toBeNull()
  })

  it('does NOT render the menu toggle by default', async () => {
    container.innerHTML = '<pulse-fab></pulse-fab>'
    const el = container.querySelector('pulse-fab')!
    await el.updateComplete
    expect(el.shadowRoot!.querySelector('.fab__menu-toggle')).toBeNull()
  })

  it('opens the menu on toggle click', async () => {
    container.innerHTML = '<pulse-fab show-menu></pulse-fab>'
    const el = container.querySelector('pulse-fab')!
    await el.updateComplete
    expect(el.shadowRoot!.querySelector('.fab__menu')).toBeNull()
    const toggle = el.shadowRoot!.querySelector('.fab__menu-toggle') as HTMLButtonElement
    toggle.click()
    await el.updateComplete
    expect(el.shadowRoot!.querySelector('.fab__menu')).not.toBeNull()
  })

  it('menu palette renders 9 variant chips (excluding "custom")', async () => {
    container.innerHTML = '<pulse-fab show-menu></pulse-fab>'
    const el = container.querySelector('pulse-fab')!
    await el.updateComplete
    const toggle = el.shadowRoot!.querySelector('.fab__menu-toggle') as HTMLButtonElement
    toggle.click()
    await el.updateComplete
    const chips = el.shadowRoot!.querySelectorAll('.fab__chip')
    expect(chips.length).toBe(9)
  })
})
