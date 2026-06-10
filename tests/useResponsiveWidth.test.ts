/**
 * useResponsiveWidth.test.ts — piecewise-linear sizing curve + options.
 *
 * Audit follow-up (round 4) : this composable was at 0 % coverage while
 * sitting inside the coverage `include` scope, contributing to the
 * Coverage workflow being red on main since alpha.29. Unlike the four
 * GSAP/DOM motion composables (excluded from the scope in the same
 * change — they drive rAF/ScrollTrigger pipelines jsdom can't observe),
 * this one is pure math behind a window.innerWidth read : fully
 * testable.
 *
 * Technique : composables using lifecycle hooks (onMounted /
 * onBeforeUnmount) must run inside a component `setup()`. The
 * `withSetup` helper mounts a renderless host so the hooks fire, and
 * returns both the composable's output and the wrapper for unmount
 * tests.
 */
import { describe, expect, it } from 'vitest'
import { defineComponent, type Ref } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { useResponsiveWidth } from '../src/composables/useResponsiveWidth'

function withSetup(composable: () => Ref<number>): { width: Ref<number>; wrapper: VueWrapper } {
  let width!: Ref<number>
  const Host = defineComponent({
    setup() {
      width = composable()
      return () => null
    },
  })
  const wrapper = mount(Host)
  return { width, wrapper }
}

/** Set jsdom's viewport width and fire the resize event the composable
 *  listens to. */
function setViewportWidth(px: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: px })
  window.dispatchEvent(new Event('resize'))
}

describe('useResponsiveWidth', () => {
  describe('preset curve (multiplier 1, no caps hit)', () => {
    // [viewport, expected] pairs straight from the PRESET table.
    it.each([
      [720, 660],
      [1280, 720],
      [1920, 860],
      [2560, 1040],
    ])('viewport %i px → player %i px (exact preset point)', (vw, expected) => {
      setViewportWidth(vw)
      const { width, wrapper } = withSetup(() => useResponsiveWidth())
      expect(width.value).toBe(expected)
      wrapper.unmount()
    })

    it('interpolates linearly between preset points (1360 → midway 720..780)', () => {
      setViewportWidth(1360) // halfway between 1280 (720) and 1440 (780)
      const { width, wrapper } = withSetup(() => useResponsiveWidth())
      expect(width.value).toBe(750)
      wrapper.unmount()
    })

    it('clamps to the first preset below 320', () => {
      setViewportWidth(200)
      const { width, wrapper } = withSetup(() => useResponsiveWidth({ min: 0 }))
      // preset floor is 296, but the 0.92 viewport cap (200 × 0.92 = 184)
      // bites first — both behaviours combined give 184.
      expect(width.value).toBe(184)
      wrapper.unmount()
    })

    it('clamps to the last preset above 3840', () => {
      setViewportWidth(5000)
      const { width, wrapper } = withSetup(() => useResponsiveWidth({ max: 9999 }))
      expect(width.value).toBe(1320)
      wrapper.unmount()
    })
  })

  describe('options', () => {
    it('applies the multiplier', () => {
      setViewportWidth(1920) // preset 860
      const { width, wrapper } = withSetup(() => useResponsiveWidth({ multiplier: 1.05 }))
      expect(width.value).toBe(903) // round(860 × 1.05)
      wrapper.unmount()
    })

    it('enforces the min floor', () => {
      setViewportWidth(1920)
      const { width, wrapper } = withSetup(() => useResponsiveWidth({ multiplier: 0.1, min: 400 }))
      // 860 × 0.1 = 86 → floored to 400
      expect(width.value).toBe(400)
      wrapper.unmount()
    })

    it('enforces the max ceiling', () => {
      setViewportWidth(3840)
      const { width, wrapper } = withSetup(() => useResponsiveWidth({ max: 1080 }))
      // preset 1320 → capped to 1080
      expect(width.value).toBe(1080)
      wrapper.unmount()
    })

    it('caps at fractionOfViewport so the chrome never kisses the bezel', () => {
      setViewportWidth(720) // preset 660 ; 0.5 × 720 = 360 cap
      const { width, wrapper } = withSetup(() => useResponsiveWidth({ fractionOfViewport: 0.5 }))
      expect(width.value).toBe(360)
      wrapper.unmount()
    })
  })

  describe('reactivity', () => {
    it('recomputes on window resize', () => {
      setViewportWidth(1280)
      const { width, wrapper } = withSetup(() => useResponsiveWidth())
      expect(width.value).toBe(720)
      setViewportWidth(2560)
      expect(width.value).toBe(1040)
      wrapper.unmount()
    })

    it('stops listening after unmount (no update, no throw)', () => {
      setViewportWidth(1280)
      const { width, wrapper } = withSetup(() => useResponsiveWidth())
      wrapper.unmount()
      const frozen = width.value
      setViewportWidth(3840)
      expect(width.value).toBe(frozen)
    })
  })
})
