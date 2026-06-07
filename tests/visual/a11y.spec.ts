/**
 * Axe-core accessibility scan against the Vue v2.3.4 demo.
 *
 * Skipped by default — runs in the dedicated `.github/workflows/a11y.yml`
 * workflow that boots Chromium + the Vue dev server. Enable locally with
 * `PULSE_A11Y=1 npm run test:a11y`.
 *
 * The first run will record a baseline list of "expected" violations
 * that the maintainer triages: each one is either fixed, suppressed
 * with a documented reason, or escalated as a regression. After
 * triage, the workflow's `continue-on-error: true` flag is removed and
 * any new violation breaks the build.
 */
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Vue v2.3.4 demo — Axe-core a11y scan', () => {
  test.skip(
    !process.env.PULSE_A11Y,
    'Axe-core scan requires PULSE_A11Y=1 + Vue dev server on :5174. Runs in CI workflow `.github/workflows/a11y.yml`.',
  )

  test('home page — WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })

  test('variants gallery — WCAG 2.1 AA', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('section.variants, .variants').first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(600)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('section.variants, .variants')
      .analyze()

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })
})
