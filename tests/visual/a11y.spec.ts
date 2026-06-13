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
    // Disable animations so the demo's auto-tour + ambient EQ + pulso
    // heartbeat stop moving DOM nodes mid-scan. Without this,
    // Playwright's "wait for element to be stable" times out on CI.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })

  test('variants gallery — WCAG 2.1 AA', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Scroll via direct JS evaluation rather than
    // `scrollIntoViewIfNeeded()`. The latter waits for the target to
    // be "stable" (no incoming layout changes), which the demo's
    // animations defeat on CI even with prefers-reduced-motion. The
    // direct scroll lands us at the section instantly; the subsequent
    // 600 ms timeout settles any post-scroll layout.
    await page.evaluate(() => {
      document.querySelector('section.variants, .variants')?.scrollIntoView()
    })
    await page.waitForTimeout(600)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('section.variants, .variants')
      .analyze()

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })

  test('hero player — PLAYING interactive state — WCAG 2.1 AA', async ({ page }) => {
    // The two scans above cover STATIC states. This one exercises the
    // player's INTERACTIVE a11y surface: once playing, the artwork
    // button flips to aria-pressed="true" / aria-label="Pause", the
    // progress slider exposes aria-valuenow/valuetext, and the EQ is
    // live — none of which the paused scans see. Keyboard activation
    // (focus + Enter) is a trusted gesture and position-independent.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/?intro=skip')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)

    const art = page.locator('.hero .mp__art').first()
    await art.focus()
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1200)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .include('.hero .mp')
      .analyze()

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
  })
})
