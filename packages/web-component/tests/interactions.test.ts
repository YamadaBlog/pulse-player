import { describe, expect, it, vi } from 'vitest'
import { flushFrames, StubAudioContext } from '@pulse-music/test-utils'
import type { PulsePlayerElement } from '../src/index'
import { $, audio, makeEngine, mount, settle } from './helpers'

const pointer = (type: string, init: PointerEventInit = {}): PointerEvent =>
  new PointerEvent(type, { bubbles: true, composed: true, button: 0, pointerId: 1, ...init })

function stubRect(el: Element, width: number): void {
  el.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width,
      height: 20,
      right: width,
      bottom: 20,
      x: 0,
      y: 0,
      toJSON() {},
    }) as DOMRect
}

describe('<pulse-player> pointer interactions', () => {
  it('scrubs with a pointer drag and seeks on release', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    await engine.play()
    audio().setDuration(200)
    await settle(el)
    const bar = $(el, '.progress')
    stubRect(bar, 400)
    bar.setPointerCapture = vi.fn()
    bar.hasPointerCapture = () => true
    bar.releasePointerCapture = vi.fn()

    bar.dispatchEvent(pointer('pointerdown', { clientX: 100 }))
    bar.dispatchEvent(pointer('pointermove', { clientX: 300 }))
    await settle(el)
    expect(bar.hasAttribute('data-scrubbing')).toBe(true)
    // While scrubbing, the display follows the pointer but nothing is seeked yet.
    expect(bar.getAttribute('aria-valuenow')).toBe('150')
    expect(engine.state.currentTime).toBe(0)

    bar.dispatchEvent(pointer('pointerup', { clientX: 300 }))
    await settle(el)
    expect(engine.state.currentTime).toBe(150)
    expect(bar.hasAttribute('data-scrubbing')).toBe(false)
  })

  it('ignores scrubbing before the duration is known', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    const bar = $(el, '.progress')
    bar.dispatchEvent(pointer('pointerdown', { clientX: 10 }))
    await settle(el)
    expect(bar.hasAttribute('data-scrubbing')).toBe(false)
  })

  it('resizes with the corner handle, and resets on double-click', async () => {
    const el = await mount<PulsePlayerElement>(
      '<pulse-player resizable resize-min="100" resize-max="500"></pulse-player>',
      makeEngine(),
    )
    stubRect(el, 300)
    const handle = $(el, '.resize')
    handle.setPointerCapture = vi.fn()
    handle.hasPointerCapture = () => true
    handle.releasePointerCapture = vi.fn()
    const widths: number[] = []
    el.addEventListener('pulse-resize', (e) => widths.push((e as CustomEvent).detail.width))

    handle.dispatchEvent(pointer('pointerdown', { clientX: 300 }))
    handle.dispatchEvent(pointer('pointermove', { clientX: 900 }))
    handle.dispatchEvent(pointer('pointermove', { clientX: -900 }))
    handle.dispatchEvent(pointer('pointerup', { clientX: -900 }))
    expect(widths).toEqual([500, 100])
    expect(el.style.width).toBe('100px')

    handle.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    expect(el.style.width).toBe('')
  })

  it('toggles playback from the artwork and the disc', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    $(el, '.art').click()
    await settle(el)
    expect(engine.state.isPlaying).toBe(true)
    $<HTMLButtonElement>(el, '.disc-toggle').click()
    expect(engine.state.isPlaying).toBe(false)
  })
})

describe('<pulse-player> visualiser', () => {
  it('drives the equaliser, ambient bars and glow from engine frames, then releases them', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player ambient-eq></pulse-player>', engine)
    await engine.play()
    StubAudioContext.instances[0]!.analyser.level = 220
    flushFrames(8)
    const bar = el.shadowRoot!.querySelector<HTMLElement>('.eq i')!
    const ambient = el.shadowRoot!.querySelector<HTMLElement>('.ambient i')!
    const glow = $(el, '.backdrop__glow')
    expect(bar.style.transform).toMatch(/scaleY\(0\.[3-9]|scaleY\(1/)
    expect(ambient.style.transform).toMatch(/^scaleY/)
    expect(Number(glow.style.opacity)).toBeGreaterThan(0.2)

    el.remove()
    expect(bar.style.transform).toBe('')
  })
})

describe('regressions', () => {
  it('hands its playlist to a new session when the session changes', async () => {
    const el = await mount<PulsePlayerElement>(
      '<pulse-player session="reg-a"><pulse-track src="/x.mp3" title="X"></pulse-track></pulse-player>',
    )
    el.session = 'reg-b'
    await settle(el)
    expect($(el, '.title').textContent).toBe('X')
  })

  it('clears the playlist when every <pulse-track> is removed', async () => {
    const engine = makeEngine([])
    const el = await mount<PulsePlayerElement>(
      '<pulse-player><pulse-track src="/x.mp3" title="X"></pulse-track></pulse-player>',
      engine,
    )
    expect(engine.tracks).toHaveLength(1)
    el.querySelector('pulse-track')!.remove()
    await new Promise((r) => setTimeout(r, 0))
    expect(engine.tracks).toHaveLength(0)
  })

  it('can grow past its current width, and exposes a keyboard splitter', async () => {
    const el = await mount<PulsePlayerElement>(
      '<pulse-player resizable resize-min="100" resize-max="600" style="width: 300px"></pulse-player>',
      makeEngine(),
    )
    stubRect(el, 300)
    const handle = $(el, '.resize')
    expect(handle.getAttribute('role')).toBe('separator')
    handle.setPointerCapture = vi.fn()
    handle.hasPointerCapture = () => false
    handle.dispatchEvent(pointer('pointerdown', { clientX: 300 }))
    handle.dispatchEvent(pointer('pointermove', { clientX: 500 }))
    handle.dispatchEvent(pointer('pointerup', { clientX: 500 }))
    expect(el.style.width).toBe('500px')
    const press = (k: string) =>
      handle.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }))
    press('End')
    expect(el.style.width).toBe('600px')
    press('Home')
    expect(el.style.width).toBe('100px')
    press('Enter')
    expect(el.style.width).toBe('')
  })
})

describe('engine binding', () => {
  it('rebinds when the engine property changes', async () => {
    const a = makeEngine()
    const b = makeEngine([{ title: 'From B', src: '/b.mp3' }])
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', a)
    el.engine = b
    await settle(el)
    expect($(el, '.title').textContent).toBe('From B')
    const onPlay = vi.fn()
    el.addEventListener('pulse-play', onPlay)
    await a.play()
    expect(onPlay).not.toHaveBeenCalled()
    await b.play()
    expect(onPlay).toHaveBeenCalledTimes(1)
  })

  it('resubscribes after being moved in the DOM', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    const onChange = vi.fn()
    el.addEventListener('pulse-trackchange', onChange)
    document.body.append(el)
    engine.next()
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
