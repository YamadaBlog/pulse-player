import { describe, expect, it, vi } from 'vitest'
import type { PulseFabElement } from '../src/index'
import { $, key, makeEngine, mount, settle } from './helpers'

const shown = (el: PulseFabElement): boolean => $(el, '.fab').hasAttribute('data-shown')

describe('<pulse-fab>', () => {
  it('stays hidden until playback starts, then pops in', async () => {
    const engine = makeEngine()
    const el = await mount<PulseFabElement>('<pulse-fab></pulse-fab>', engine)
    expect(shown(el)).toBe(false)
    await engine.play()
    await settle(el)
    expect(shown(el)).toBe(true)
  })

  it('can always be visible', async () => {
    const el = await mount<PulseFabElement>('<pulse-fab reveal="always"></pulse-fab>', makeEngine())
    expect(shown(el)).toBe(true)
  })

  it('toggles playback on tap and labels the disc with the track', async () => {
    const engine = makeEngine()
    const el = await mount<PulseFabElement>('<pulse-fab reveal="always"></pulse-fab>', engine)
    const disc = $<HTMLButtonElement>(el, '.disc')
    expect(disc.getAttribute('aria-label')).toBe('Play: Projector Screen')
    disc.click()
    await settle(el)
    expect(engine.state.isPlaying).toBe(true)
    expect(disc.getAttribute('aria-label')).toBe('Pause: Projector Screen')
  })

  it('opens an accessible menu and handles its actions', async () => {
    const engine = makeEngine()
    const el = await mount<PulseFabElement>('<pulse-fab reveal="always"></pulse-fab>', engine)
    const more = $<HTMLButtonElement>(el, '.more')
    more.click()
    await settle(el)
    expect(more.getAttribute('aria-expanded')).toBe('true')
    const items = el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
    expect(items).toHaveLength(3)
    expect(items[0].tabIndex).toBe(0)
    items[1].click()
    await settle(el)
    expect(engine.state.currentTrack).toBe(1)
    expect($(el, '.fab').hasAttribute('data-menu')).toBe(false)
  })

  it('closes the menu with Escape', async () => {
    const el = await mount<PulseFabElement>('<pulse-fab reveal="always"></pulse-fab>', makeEngine())
    $<HTMLButtonElement>(el, '.more').click()
    await settle(el)
    key($(el, '.item'), 'Escape')
    await settle(el)
    expect($(el, '.fab').hasAttribute('data-menu')).toBe(false)
  })

  it('opens the menu on right-click and from the keyboard', async () => {
    const el = await mount<PulseFabElement>('<pulse-fab reveal="always"></pulse-fab>', makeEngine())
    const disc = $(el, '.disc')
    disc.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }))
    await settle(el)
    expect($(el, '.fab').hasAttribute('data-menu')).toBe(true)
    key($(el, '.item'), 'Escape')
    await settle(el)
    key(disc, 'F10', { shiftKey: true })
    await settle(el)
    expect($(el, '.fab').hasAttribute('data-menu')).toBe(true)
  })

  it('closing from the menu stops playback and hides the FAB', async () => {
    const engine = makeEngine()
    const el = await mount<PulseFabElement>('<pulse-fab></pulse-fab>', engine)
    await engine.play()
    await settle(el)
    $<HTMLButtonElement>(el, '.more').click()
    await settle(el)
    el.shadowRoot!.querySelector<HTMLButtonElement>('.item--close')!.click()
    await settle(el)
    expect(engine.state.isPlaying).toBe(false)
    expect(shown(el)).toBe(false)
  })

  it('opens the menu on long-press without toggling playback', async () => {
    vi.useFakeTimers()
    const engine = makeEngine()
    const el = await mount<PulseFabElement>('<pulse-fab reveal="always"></pulse-fab>', engine)
    const disc = $(el, '.disc')
    disc.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 10, clientY: 10 }),
    )
    vi.advanceTimersByTime(500)
    disc.dispatchEvent(
      new PointerEvent('pointerup', { button: 0, pointerId: 1, clientX: 10, clientY: 10 }),
    )
    disc.click()
    vi.useRealTimers()
    await settle(el)
    expect($(el, '.fab').hasAttribute('data-menu')).toBe(true)
    expect(engine.state.isPlaying).toBe(false)
  })

  it('drags, snaps to an edge and remembers the position', async () => {
    const engine = makeEngine()
    const el = await mount<PulseFabElement>(
      '<pulse-fab reveal="always" persist-key="test-fab"></pulse-fab>',
      engine,
    )
    // happy-dom doesn't lay out: give the FAB a real box so it can snap.
    el.getBoundingClientRect = () =>
      ({
        left: 300,
        top: 300,
        width: 64,
        height: 64,
        right: 364,
        bottom: 364,
        x: 300,
        y: 300,
      }) as DOMRect
    const disc = $(el, '.disc')
    disc.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 2, clientX: 100, clientY: 100 }),
    )
    disc.dispatchEvent(new PointerEvent('pointermove', { pointerId: 2, clientX: 40, clientY: 30 }))
    await settle(el)
    expect($(el, '.fab').hasAttribute('data-dragging')).toBe(true)
    disc.dispatchEvent(
      new PointerEvent('pointerup', { button: 0, pointerId: 2, clientX: 40, clientY: 30 }),
    )
    disc.click()
    await settle(el)
    expect(engine.state.isPlaying).toBe(false)
    expect(localStorage.getItem('test-fab')).toMatch(/"x":/)
  })

  it('a cancelled drag never swallows the next tap', async () => {
    const engine = makeEngine()
    const el = await mount<PulseFabElement>(
      '<pulse-fab reveal="always" persist-key=""></pulse-fab>',
      engine,
    )
    const disc = $(el, '.disc')
    const fire = (type: string, id: number, x = 0) =>
      disc.dispatchEvent(
        new PointerEvent(type, { button: 0, pointerId: id, clientX: x, clientY: x }),
      )
    fire('pointerdown', 4)
    fire('pointermove', 4, 50)
    fire('pointercancel', 4, 50)
    fire('pointerdown', 5)
    fire('pointerup', 5)
    disc.click()
    await settle(el)
    expect(engine.state.isPlaying).toBe(true)
  })

  it('never leaves focus on a hidden menu item', async () => {
    const el = await mount<PulseFabElement>('<pulse-fab reveal="always"></pulse-fab>', makeEngine())
    const isItem = () => el.shadowRoot!.activeElement?.classList.contains('item') ?? false
    $<HTMLButtonElement>(el, '.more').click()
    await settle(el)
    expect(isItem()).toBe(true)
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
    await settle(el)
    expect(isItem()).toBe(false)

    $<HTMLButtonElement>(el, '.more').click()
    await settle(el)
    key(el.shadowRoot!.activeElement!, 'Tab')
    await settle(el)
    expect(el.shadowRoot!.activeElement?.classList.contains('disc')).toBe(true)
  })

  it('does not move when locked or inline', async () => {
    const el = await mount<PulseFabElement>(
      '<pulse-fab reveal="always" locked></pulse-fab>',
      makeEngine(),
    )
    const disc = $(el, '.disc')
    disc.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 3, clientX: 0, clientY: 0 }),
    )
    disc.dispatchEvent(new PointerEvent('pointermove', { pointerId: 3, clientX: 90, clientY: 90 }))
    await settle(el)
    expect($(el, '.fab').hasAttribute('data-dragging')).toBe(false)
    expect(el.style.translate).toBe('')
  })
})
