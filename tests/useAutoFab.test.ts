/**
 * useAutoFab.test.ts — scroll-mode + route-mode FAB helpers.
 *
 * jsdom has no IntersectionObserver, so we stub it and capture the
 * constructor callback to fire intersection changes by hand. The
 * composable uses onMounted/onBeforeUnmount, so it runs inside a
 * renderless host (same `withSetup` pattern as useResponsiveWidth).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref, type Ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAudioStore } from '../src/lib'
import { showFabOnRouteChange, useAutoFab } from '../src/composables/useAutoFab'

// ─── IntersectionObserver stub ──────────────────────────────────────
type IOCallback = (entries: Array<{ isIntersecting: boolean; intersectionRatio: number }>) => void
let lastCallback: IOCallback | null = null
let observed = 0
let disconnected = 0

class IOStub {
  constructor(cb: IOCallback) {
    lastCallback = cb
  }
  observe() {
    observed++
  }
  disconnect() {
    disconnected++
  }
  unobserve() {}
  takeRecords() {
    return []
  }
}

/** Fire an intersection change at the captured callback. */
function fireIntersection(isIntersecting: boolean, ratio = isIntersecting ? 1 : 0) {
  lastCallback?.([{ isIntersecting, intersectionRatio: ratio }])
}

function hostWith(run: () => void): VueWrapper {
  const Host = defineComponent({
    setup() {
      run()
      return () => null
    },
  })
  return mount(Host)
}

beforeEach(() => {
  setActivePinia(createPinia())
  lastCallback = null
  observed = 0
  disconnected = 0
  vi.stubGlobal('IntersectionObserver', IOStub as unknown as typeof IntersectionObserver)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAutoFab — scroll mode', () => {
  it('observes the target on mount and disconnects on unmount', () => {
    const el = ref<HTMLElement | null>(document.createElement('div'))
    const wrapper = hostWith(() => useAutoFab(el as Ref<HTMLElement | null>))
    expect(observed).toBe(1)
    wrapper.unmount()
    expect(disconnected).toBe(1)
  })

  it('shows the FAB when the player leaves the viewport', () => {
    const store = useAudioStore()
    const el = ref<HTMLElement | null>(document.createElement('div'))
    hostWith(() => useAutoFab(el as Ref<HTMLElement | null>))
    expect(store.isVisible).toBe(false)
    fireIntersection(false) // scrolled away
    expect(store.isVisible).toBe(true)
  })

  it('hides the FAB when the player returns — WITHOUT pausing playback', () => {
    const store = useAudioStore()
    store.isVisible = true
    store.isPlaying = true // simulate active playback
    const el = ref<HTMLElement | null>(document.createElement('div'))
    hostWith(() => useAutoFab(el as Ref<HTMLElement | null>))
    fireIntersection(true) // back in view
    expect(store.isVisible).toBe(false)
    expect(store.isPlaying).toBe(true) // playback survived (close() would have paused)
  })

  it('requirePlayback:true keeps the FAB hidden until playback has started', () => {
    const store = useAudioStore()
    const el = ref<HTMLElement | null>(document.createElement('div'))
    hostWith(() => useAutoFab(el as Ref<HTMLElement | null>, { requirePlayback: true }))
    fireIntersection(false)
    expect(store.isVisible).toBe(false) // never opened → stays hidden
    store.hasBeenOpened = true
    fireIntersection(false)
    expect(store.isVisible).toBe(true)
  })
})

describe('showFabOnRouteChange — route mode (opt-in)', () => {
  it('surfaces the FAB only after playback by default', () => {
    const store = useAudioStore()
    const onRoute = showFabOnRouteChange()
    onRoute()
    expect(store.isVisible).toBe(false)
    store.hasBeenOpened = true
    onRoute()
    expect(store.isVisible).toBe(true)
  })

  it('always:true surfaces the FAB on every navigation', () => {
    const store = useAudioStore()
    const onRoute = showFabOnRouteChange({ always: true })
    onRoute()
    expect(store.isVisible).toBe(true)
  })
})
