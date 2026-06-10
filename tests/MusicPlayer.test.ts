/**
 * MusicPlayer.test.ts — smoke + props + ARIA + event contract.
 *
 * Coverage scope (P1.2 from the audit) :
 * - Mounts cleanly in jsdom with the Pinia + audio store stubs.
 * - Renders the title from the store's active track.
 * - Honours each declared variant via `data-variant` attribute.
 * - Exposes a slider with full ARIA props for the seek bar.
 * - Exposes a button-role art surface for play/pause toggle.
 * - Optional GitHub / Spotify links render as `<a target="_blank">`
 *   with `rel="noopener noreferrer"` when URLs are provided.
 * - Custom `:width` prop drives the underlying CSS width.
 * - Resizable handle renders only when `:resizable="true"`.
 *
 * The point of these tests isn't to mirror MusicPlayer's full DOM —
 * that would just lock the markup in concrete. They assert on the
 * PUBLIC contract a downstream integrator would touch.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MusicPlayer from '../src/lib/MusicPlayer.vue'
import { ALL_VARIANTS } from '../src/lib/shared/types'

const factory = (props: Record<string, unknown> = {}) => {
  return mount(MusicPlayer, {
    props,
    global: {
      plugins: [createPinia()],
    },
  })
}

describe('MusicPlayer', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('mounting', () => {
    it('mounts without throwing', () => {
      const w = factory()
      expect(w.exists()).toBe(true)
    })

    it('renders the active track title in the heading', () => {
      const w = factory()
      const h2 = w.find('h2.mp__title')
      expect(h2.exists()).toBe(true)
      expect(h2.text().length).toBeGreaterThan(0)
    })
  })

  describe('variants', () => {
    it('defaults to variant="auto"', () => {
      const w = factory()
      expect(w.attributes('data-variant')).toBe('auto')
    })

    it.each(ALL_VARIANTS)('renders with variant="%s"', (variant) => {
      const w = factory({ variant })
      expect(w.attributes('data-variant')).toBe(variant)
    })

    it('renders the cover-blur backdrop only on variant="auto"', () => {
      const auto = factory({ variant: 'auto' })
      expect(auto.find('.mp__bg').exists()).toBe(true)
      const sunset = factory({ variant: 'sunset' })
      expect(sunset.find('.mp__bg').exists()).toBe(false)
    })
  })

  describe('accessibility', () => {
    it('exposes the seek bar with full slider ARIA', () => {
      const w = factory()
      const bar = w.find('.mp__bar')
      expect(bar.attributes('role')).toBe('slider')
      expect(bar.attributes('aria-label')).toBe('Seek')
      expect(bar.attributes('aria-valuemin')).toBe('0')
      expect(bar.attributes('aria-valuemax')).toBe('100')
      expect(bar.attributes('aria-valuenow')).toBeDefined()
      expect(bar.attributes('aria-valuetext')).toBeDefined()
    })

    it('art surface is a keyboard-reachable button with aria-pressed', () => {
      const w = factory()
      const art = w.find('.mp__art')
      expect(art.attributes('role')).toBe('button')
      expect(art.attributes('tabindex')).toBe('0')
      expect(art.attributes('aria-pressed')).toBeDefined()
      expect(art.attributes('aria-label')).toMatch(/play|pause/i)
    })

    it('previous / next controls expose aria-labels', () => {
      const w = factory()
      const buttons = w.findAll('button.mp__btn')
      expect(buttons.length).toBeGreaterThanOrEqual(2)
      const labels = buttons.map((b) => b.attributes('aria-label')).filter(Boolean)
      expect(labels).toContain('Previous')
      expect(labels).toContain('Next')
    })
  })

  describe('external links', () => {
    it('renders <a target="_blank" rel="noopener noreferrer"> for github URL', () => {
      const w = factory({ githubUrl: 'https://github.com/test/repo' })
      const link = w.find('a.mp__icon-link')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://github.com/test/repo')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
      expect(link.attributes('aria-label')).toBe('GitHub')
    })

    it('renders a decorative span (no link) when github URL is omitted', () => {
      const w = factory()
      const span = w.find('span.mp__icon-link')
      expect(span.exists()).toBe(true)
      expect(span.attributes('aria-hidden')).toBe('true')
    })

    it('hides both icons when hideIcons=true', () => {
      const w = factory({ hideIcons: true })
      expect(w.find('.mp__icons').exists()).toBe(false)
    })
  })

  describe('resizable', () => {
    it('does NOT render the resize handle by default', () => {
      const w = factory()
      expect(w.find('.mp__resize').exists()).toBe(false)
    })

    it('renders the resize handle with separator role when resizable=true', () => {
      const w = factory({ resizable: true })
      const handle = w.find('.mp__resize')
      expect(handle.exists()).toBe(true)
      expect(handle.attributes('role')).toBe('separator')
      expect(handle.attributes('aria-label')).toBe('Resize player')
    })
  })

  describe('width prop', () => {
    it('applies the width when passed as a number', () => {
      const w = factory({ width: 420 })
      const root = w.element as HTMLElement
      const style = root.getAttribute('style') ?? ''
      expect(style).toContain('420px')
    })
  })

  describe('ambient EQ', () => {
    it('renders 12 ambient bars when ambientEq=true', () => {
      const w = factory({ ambientEq: true })
      const bars = w.findAll('.mp__ambient > i')
      expect(bars.length).toBe(12)
    })

    it('does NOT render the ambient layer when ambientEq=false', () => {
      const w = factory({ ambientEq: false })
      expect(w.find('.mp__ambient').exists()).toBe(false)
    })
  })
})
