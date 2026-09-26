import { describe, expect, it } from 'vitest'
import { ALL_VARIANTS } from '@pulse-music/types'
import { EASING, VARIANTS, createMotionCss, createVariantCss, resolveVariant } from '../src/index'

const HEX = /^#[0-9a-f]{6}$/i

describe('VARIANTS', () => {
  it('covers every named variant (all but custom)', () => {
    expect(Object.keys(VARIANTS).sort()).toEqual(ALL_VARIANTS.filter((v) => v !== 'custom').sort())
  })

  it.each(Object.entries(VARIANTS))('%s has a complete, valid token set', (_, v) => {
    expect(v.accent).toMatch(HEX)
    expect(v.label.length).toBeGreaterThan(0)
    expect(['dark', 'light']).toContain(v.scheme)
    // Modern space-separated colour syntax only: "rgb(1, 2, 3 / .5)" is invalid CSS.
    for (const value of [v.background, v.muted, v.border]) {
      expect(value).not.toMatch(/rgb\([^)]*,[^)]*\//)
    }
  })

  it('is frozen', () => {
    expect(Object.isFrozen(VARIANTS)).toBe(true)
  })

  it('resolveVariant falls back to solid', () => {
    expect(resolveVariant('custom')).toBe(VARIANTS.solid)
    expect(resolveVariant('nope')).toBe(VARIANTS.solid)
    expect(resolveVariant('midnight')).toBe(VARIANTS.midnight)
  })
})

describe('CSS generators', () => {
  it('emits one rule per variant with the private custom properties', () => {
    const css = createVariantCss((v) => `[data-v='${v}']`)
    for (const name of Object.keys(VARIANTS)) {
      expect(css).toContain(`[data-v='${name}'] {`)
    }
    for (const prop of ['--_bg', '--_fg', '--_muted', '--_accent', '--_border', 'color-scheme']) {
      expect(css.split(prop).length - 1).toBe(Object.keys(VARIANTS).length)
    }
  })

  it('emits motion tokens with valid linear() springs', () => {
    const css = createMotionCss(':host')
    expect(css).toContain('--pulse-ease-pop: linear(0,')
    for (const curve of [EASING.smooth, EASING.gentle, EASING.pop]) {
      const points = curve.slice(7, -1).split(',').map(Number)
      expect(points[0]).toBe(0)
      expect(points.at(-1)).toBe(1)
      expect(points.every(Number.isFinite)).toBe(true)
    }
  })
})
