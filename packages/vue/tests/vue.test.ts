import { describe, expect, it } from 'vitest'
import { defineComponent, effectScope, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createFakeAudio } from '@pulse-music/test-utils'
import { PulseEngine, PulseFab, PulsePlayer, usePulseAudio } from '../src/index'

const makeEngine = (): PulseEngine =>
  new PulseEngine({
    tracks: [
      { title: 'One', src: '/one.mp3' },
      { title: 'Two', src: '/two.mp3' },
    ],
    createAudio: createFakeAudio,
    mediaSession: false,
  })

describe('usePulseAudio (Vue)', () => {
  it('tracks engine state and releases the subscription with its scope', async () => {
    const engine = makeEngine()
    const scope = effectScope()
    const audio = scope.run(() => usePulseAudio({ engine }))!
    expect(audio.isPlaying.value).toBe(false)
    await audio.play()
    expect(audio.isPlaying.value).toBe(true)
    audio.next()
    expect(audio.track.value?.title).toBe('Two')
    scope.stop()
    audio.pause()
    expect(audio.state.value.isPlaying).toBe(true)
  })
})

describe('<PulsePlayer>', () => {
  it('sets element properties and re-emits events', async () => {
    const engine = makeEngine()
    const wrapper = mount(PulsePlayer, {
      props: { engine, variant: 'vinyl', ambientEq: true },
      attachTo: document.body,
    })
    const el = wrapper.element as HTMLElement &
      Record<string, unknown> & { updateComplete: Promise<boolean> }
    await el.updateComplete
    expect(el.localName).toBe('pulse-player')
    expect(el.engine).toBe(engine)
    expect(el.ambientEq).toBe(true)
    expect(el.getAttribute('variant')).toBe('vinyl')
    engine.next()
    await nextTick()
    expect(wrapper.emitted('trackchange')?.[0]?.[0]).toMatchObject({ from: 0, to: 1 })
    wrapper.unmount()
  })

  it('leaves unset props to the element defaults', () => {
    const wrapper = mount(PulsePlayer, { props: { engine: makeEngine() } })
    const el = wrapper.element as HTMLElement & Record<string, unknown>
    expect(el.grain).toBe(true)
    expect(el.variant).toBe('auto')
  })

  it('renders the default slot inside the element', () => {
    const Parent = defineComponent({
      render: () =>
        h(PulsePlayer, { engine: makeEngine() }, () => h('a', { slot: 'actions', href: '#' }, 'x')),
    })
    const wrapper = mount(Parent)
    expect(wrapper.element.querySelector('a[slot="actions"]')).not.toBeNull()
  })
})

describe('<PulseFab>', () => {
  it('forwards its options', async () => {
    const wrapper = mount(PulseFab, {
      props: { engine: makeEngine(), placement: 'top-start', pulso: true },
      attachTo: document.body,
    })
    const el = wrapper.element as HTMLElement &
      Record<string, unknown> & { updateComplete: Promise<boolean> }
    await el.updateComplete
    expect(el.getAttribute('placement')).toBe('top-start')
    expect(el.pulso).toBe(true)
  })
})
