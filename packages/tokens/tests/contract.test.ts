/**
 * `@pulse/tokens` contract tests.
 *
 * Visual diff tests would need Playwright + a rendered page; for the
 * static token contract, we verify shape and content directly:
 *
 *   - Every variant gradient is declared
 *   - Every accent RGB triplet is present
 *   - The selectors are at the `[data-variant='X']` attribute level
 *     (NOT `:host([variant='X'])` — that would break the document-
 *     level cascade for Vue v2.3.4 consumers)
 *   - Base tokens include the `--pulse-scale` system and the shadow
 *     stack
 *
 * If the CSS string ever drifts from this contract, every visual
 * regression test downstream would break — these unit tests catch
 * the issue at the token level, faster.
 */
import { describe, expect, it } from 'vitest'
import { variantsCss, baseCss } from '../src/index'

const FOUR_NAMED_VARIANTS = ['sunset', 'midnight', 'aurora', 'vinyl'] as const

describe('@pulse/tokens — variantsCss', () => {
  it('declares each of the 4 mood variants exactly once', () => {
    for (const v of FOUR_NAMED_VARIANTS) {
      const occurrences = variantsCss.match(new RegExp(`\\[data-variant='${v}'\\]`, 'g'))
      expect(occurrences?.length).toBe(1)
    }
  })

  it('uses `[data-variant=...]` selectors, not `:host(...)`', () => {
    expect(variantsCss).not.toContain(':host(')
    expect(variantsCss).toContain('[data-variant=')
  })

  it('declares `--variant-bg-gradient` and `--variant-accent-rgb` for every mood', () => {
    for (const v of FOUR_NAMED_VARIANTS) {
      // Loose match: variant block contains both CSS variables.
      const block = variantsCss
        .split(`[data-variant='${v}']`)[1]
        ?.split(/\[data-variant='\w+'\]|$/)[0]
      expect(block).toBeDefined()
      expect(block).toContain('--variant-bg-gradient:')
      expect(block).toContain('--variant-accent-rgb:')
    }
  })

  it('exposes the canonical accent RGB triplet for `midnight`', () => {
    // Pinned value — if this changes intentionally, the test must
    // be updated alongside the design system decision.
    expect(variantsCss).toContain('--variant-accent-rgb: 139, 92, 246')
  })

  it('exposes the canonical accent RGB triplet for `vinyl`', () => {
    expect(variantsCss).toContain('--variant-accent-rgb: 200, 169, 126')
  })
})

describe('@pulse/tokens — baseCss', () => {
  it('targets the `:host` selector for Shadow DOM consumers', () => {
    expect(baseCss).toContain(':host {')
  })

  it('declares the `--pulse-scale` system as a normalised 0..1.3 envelope', () => {
    expect(baseCss).toContain('--pulse-scale: 1;')
    expect(baseCss).toContain('--pulse-scale-min: 0.3;')
    expect(baseCss).toContain('--pulse-scale-max: 1.3;')
  })

  it('declares the 13 derived measurements (art, title, icons, padding, …)', () => {
    const tokens = [
      '--pulse-art',
      '--pulse-title',
      '--pulse-subtitle',
      '--pulse-eyebrow',
      '--pulse-icon',
      '--pulse-icon-sm',
      '--pulse-btn',
      '--pulse-pad',
      '--pulse-gap',
      '--pulse-radius',
      '--pulse-bar-h',
      '--pulse-bar-w',
      '--pulse-progress-h',
    ]
    for (const t of tokens) expect(baseCss).toContain(`${t}:`)
  })

  it('declares the soft + strong shadow stack', () => {
    expect(baseCss).toContain('--pulse-shadow-soft:')
    expect(baseCss).toContain('--pulse-shadow-strong:')
  })

  it('declares the default accent color + RGB triplet', () => {
    expect(baseCss).toContain('--pulse-accent: #3dbda7')
    expect(baseCss).toContain('--pulse-accent-rgb: 61, 189, 167')
  })
})

describe('@pulse/tokens — actual cascade in a real DOM', () => {
  it('inheriting variant gradient from [data-variant] attribute works in jsdom', () => {
    // Smoke test that the cascade strategy works end-to-end: append
    // the tokens stylesheet to the document, set a data-variant
    // attribute, and read the computed --variant-accent-rgb on a
    // child element.
    const style = document.createElement('style')
    style.textContent = variantsCss
    document.head.appendChild(style)

    const host = document.createElement('div')
    host.setAttribute('data-variant', 'midnight')
    const child = document.createElement('span')
    host.appendChild(child)
    document.body.appendChild(host)

    // jsdom's getComputedStyle doesn't fully resolve `var()`, but it
    // does expose the custom property on the host element. The
    // cascade works if the property is set on the host.
    const computed = host.style.getPropertyValue('--variant-accent-rgb') ||
      window.getComputedStyle(host).getPropertyValue('--variant-accent-rgb')
    expect(computed.trim()).toMatch(/139,\s*92,\s*246/)

    document.body.removeChild(host)
    document.head.removeChild(style)
  })
})
