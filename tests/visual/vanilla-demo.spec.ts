/**
 * Visual regression for `apps/demo-vanilla/` — the Web Component
 * chrome rendered in a plain HTML page (no framework).
 *
 * Captures `<pulse-player>` and `<pulse-fab>` in their default
 * Custom Element rendering. Acts as a baseline for the alpha.11+
 * chrome work: any unintended drift in `mp__bg`, `mp__noise`,
 * `mp__art`, the variant tokens, the ambient EQ stack, or the FAB
 * shape will surface here.
 */
import { test, expect } from '@playwright/test'

const VANILLA_URL = 'http://localhost:5180'

test.describe('Vanilla demo — Web Component visual baselines', () => {
  test.skip(
    !process.env.PULSE_VISUAL_FULL,
    'Vanilla demo captures require the demo-vanilla server running on :5180. Run with PULSE_VISUAL_FULL=1 to enable.',
  )

  test('pulse-player default variant', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(VANILLA_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    const player = page.locator('pulse-player').first()
    await expect(player).toHaveScreenshot('vanilla-pulse-player.png', {
      maxDiffPixelRatio: 0.05,
      timeout: 15_000,
    })
  })

  test('pulse-fab default variant', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(VANILLA_URL)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    const fab = page.locator('pulse-fab').first()
    await expect(fab).toHaveScreenshot('vanilla-pulse-fab.png', {
      maxDiffPixelRatio: 0.05,
      timeout: 15_000,
    })
  })
})
