import { describe, expect, it, vi } from 'vitest'
import { getSharedEngine, type PulsePlayerElement } from '../src/index'
import { $, audio, key, makeEngine, mount, settle, TRACKS } from './helpers'

describe('<pulse-player>', () => {
  it('registers every element exactly once', async () => {
    expect(customElements.get('pulse-player')).toBeDefined()
    expect(customElements.get('pulse-fab')).toBeDefined()
    expect(customElements.get('pulse-track')).toBeDefined()
    // Re-importing must not throw "already defined".
    await expect(import('../src/index')).resolves.toBeDefined()
  })

  it('renders the active track', async () => {
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', makeEngine())
    expect($(el, '.title').textContent).toBe('Projector Screen')
    expect($(el, '.artist').textContent).toBe('HoliznaCC0')
    expect($(el, '.player').getAttribute('aria-label')).toBe(
      'Music player: Projector Screen, HoliznaCC0',
    )
  })

  it('shows an explicit empty state', async () => {
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', makeEngine([]))
    expect($(el, '.title').textContent).toBe('Nothing queued')
    expect($<HTMLButtonElement>(el, '.btn--main').disabled).toBe(true)
    expect($(el, '.progress').getAttribute('tabindex')).toBe('-1')
  })

  it('toggles playback and relabels the main button', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    const btn = $<HTMLButtonElement>(el, '.btn--main')
    expect(btn.getAttribute('aria-label')).toBe('Play')
    btn.click()
    await settle(el)
    expect(engine.state.isPlaying).toBe(true)
    expect(btn.getAttribute('aria-label')).toBe('Pause')
    btn.click()
    await settle(el)
    expect(engine.state.isPlaying).toBe(false)
  })

  it('wires previous / next / mute', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    const [prev, , next, mute] =
      el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.controls .btn')
    next.click()
    expect(engine.state.currentTrack).toBe(1)
    prev.click()
    expect(engine.state.currentTrack).toBe(0)
    mute.click()
    await settle(el)
    expect(engine.state.muted).toBe(true)
    expect(mute.getAttribute('aria-pressed')).toBe('true')
    expect(mute.getAttribute('aria-label')).toBe('Unmute')
  })

  it('re-dispatches engine events on the element, without bubbling', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    const onPlay = vi.fn()
    const onDocument = vi.fn()
    el.addEventListener('pulse-play', onPlay)
    document.addEventListener('pulse-play', onDocument)
    await engine.play()
    expect(onPlay).toHaveBeenCalledTimes(1)
    expect((onPlay.mock.calls[0][0] as CustomEvent).detail.track.title).toBe('Projector Screen')
    expect(onDocument).not.toHaveBeenCalled()
    document.removeEventListener('pulse-play', onDocument)
  })

  it('stops forwarding once removed from the DOM', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    const onTrack = vi.fn()
    el.addEventListener('pulse-trackchange', onTrack)
    el.remove()
    engine.next()
    expect(onTrack).not.toHaveBeenCalled()
  })

  it('reads a declarative <pulse-track> playlist and follows changes', async () => {
    const engine = makeEngine([])
    const el = await mount<PulsePlayerElement>(
      `<pulse-player>
        <pulse-track src="/a.mp3" title="Alpha" artist="A" cover="/a.svg"></pulse-track>
        <pulse-track src="/b.mp3" title="Beta"></pulse-track>
      </pulse-player>`,
      engine,
    )
    expect(engine.tracks.map((t) => t.title)).toEqual(['Alpha', 'Beta'])
    el.querySelector('pulse-track')!.setAttribute('title', 'Alpha (edit)')
    await new Promise((r) => setTimeout(r, 0))
    expect(engine.tracks[0]).toMatchObject({ title: 'Alpha (edit)', artist: 'A', cover: '/a.svg' })
  })

  it('accepts a tracks property', async () => {
    const engine = makeEngine([])
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    el.tracks = TRACKS
    await settle(el)
    expect($(el, '.title').textContent).toBe('Projector Screen')
  })

  it('exposes an accessible seek slider driven by the keyboard', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    await engine.play()
    audio().setDuration(180)
    audio().advance(60)
    await settle(el)
    const slider = $(el, '.progress')
    expect(slider.getAttribute('role')).toBe('slider')
    expect(slider.getAttribute('aria-valuemax')).toBe('180')
    expect(slider.getAttribute('aria-valuetext')).toBe('1:00 of 3:00')
    key(slider, 'ArrowRight')
    expect(engine.state.currentTime).toBe(65)
    key(slider, 'PageDown')
    expect(engine.state.currentTime).toBe(35)
    key(slider, 'Home')
    expect(engine.state.currentTime).toBe(0)
  })

  it('supports media shortcuts while focus is inside the player', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    const slider = $(el, '.progress')
    key(slider, 'k')
    await settle(el)
    expect(engine.state.isPlaying).toBe(true)
    audio().setDuration(100)
    key(slider, 'l')
    expect(engine.state.currentTime).toBe(10)
    key(slider, 'm')
    expect(engine.state.muted).toBe(true)
    key(slider, 'N', { shiftKey: true })
    expect(engine.state.currentTrack).toBe(1)
  })

  it('does not steal Space from a focused button', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    key($(el, '.btn--main'), ' ')
    expect(engine.state.isPlaying).toBe(false)
  })

  it('reflects theming options', async () => {
    const el = await mount<PulsePlayerElement>(
      '<pulse-player variant="midnight" accent-color="#ff0066" ambient-eq grain="false"></pulse-player>',
      makeEngine(),
    )
    expect(el.getAttribute('variant')).toBe('midnight')
    expect($(el, '.player').style.getPropertyValue('--pulse-accent')).toBe('#ff0066')
    expect(el.shadowRoot!.querySelectorAll('.ambient i').length).toBe(28)
    expect(el.shadowRoot!.querySelector('.grain')).toBeNull()
  })

  it('surfaces playback errors', async () => {
    const engine = makeEngine()
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', engine)
    await engine.play()
    audio().fail()
    await settle(el)
    expect($(el, '.player').hasAttribute('data-error')).toBe(true)
    expect($(el, '.eyebrow__label').textContent).toBe("Couldn't play this track")
    expect($(el, '[role="status"]').textContent).toBe("Couldn't play this track")
  })

  it('is localisable', async () => {
    const el = await mount<PulsePlayerElement>('<pulse-player></pulse-player>', makeEngine())
    el.labels = { play: 'Lecture', nowPlaying: 'En cours' }
    await settle(el)
    expect($(el, '.btn--main').getAttribute('aria-label')).toBe('Lecture')
    expect($(el, '.eyebrow__label').textContent).toBe('En cours')
  })

  it('resizes with the keyboard and reports it', async () => {
    const el = await mount<PulsePlayerElement>(
      '<pulse-player resizable></pulse-player>',
      makeEngine(),
    )
    const onResize = vi.fn()
    el.addEventListener('pulse-resize', onResize)
    key($(el, '.resize'), 'ArrowRight')
    expect(onResize).toHaveBeenCalledTimes(1)
    expect(el.style.width).toMatch(/px$/)
  })

  it('joins named sessions independently', async () => {
    const a = await mount<PulsePlayerElement>('<pulse-player session="a"></pulse-player>')
    const b = await mount<PulsePlayerElement>('<pulse-player session="b"></pulse-player>')
    getSharedEngine('a').setTracks([{ title: 'Only A', src: '/a.mp3' }])
    getSharedEngine('b').setTracks([{ title: 'Only B', src: '/b.mp3' }])
    await settle(a)
    await settle(b)
    expect($(a, '.title').textContent).toBe('Only A')
    expect($(b, '.title').textContent).toBe('Only B')
  })
})
