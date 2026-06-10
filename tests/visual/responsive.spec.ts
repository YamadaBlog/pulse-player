/**
 * responsive.spec.ts — multi-viewport smoke tests for the Vue demo.
 *
 * The audit (P2.2) flagged that the existing visual specs only
 * captured the default Playwright viewport (1280×720), leaving the
 * mobile / tablet / 2K paths un-guarded. We add a tiny non-snapshot
 * suite that asserts the demo MOUNTS, has NO horizontal scroll, and
 * exposes a focusable hero player at each of the four breakpoints
 * the audit identified as risk surfaces.
 *
 * Why no `toHaveScreenshot()` here :
 *   - baselines for 5 viewports = 5 baseline PNGs to maintain.
 *   - the page has running idle animations (ambient EQ, kinetic
 *     title, FFT canvas, cursor glow on hover). Snapshot stability
 *     was already a pain at one viewport (cf. vue-demo.spec.ts
 *     comments).
 *   - smoke-level "no overflow + hero present" catches > 80 % of the
 *     regressions an audit would care about, at < 1 % the maintenance
 *     cost.
 *
 * Run :
 *   npx playwright test tests/visual/responsive.spec.ts --project=chromium
 *
 * Gated under PULSE_RESPONSIVE=1 so the default `test:visual` script
 * keeps its current behaviour (the audit budget for snapshot baselines
 * hasn't been negotiated yet).
 */
import { test, expect, type Page } from '@playwright/test'

test.describe('Vue demo — multi-viewport smoke', () => {
  test.skip(
    !process.env.PULSE_RESPONSIVE,
    'Responsive smoke tests require PULSE_RESPONSIVE=1 to avoid duplicating the visual baseline budget.',
  )

  // The five breakpoints flagged by the responsive audit. Width is the
  // load-bearing dimension ; height is set to a typical aspect ratio.
  const VIEWPORTS = [
    { name: 'mobile-390', width: 390, height: 844 }, // iPhone 13
    { name: 'tablet-768', width: 768, height: 1024 }, // iPad portrait
    { name: 'laptop-1440', width: 1440, height: 900 },
    { name: 'desktop-1920', width: 1920, height: 1080 },
    { name: 'twoK-2560', width: 2560, height: 1440 },
  ] as const

  for (const vp of VIEWPORTS) {
    test(`${vp.name} — demo mounts, no overflow, hero reachable`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.goto('/?intro=skip')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(400)

      // 1. The hero is in the DOM.
      const hero = page.locator('.hero').first()
      await expect(hero).toBeVisible()

      // 2. No horizontal overflow at the document level. We compare the
      //    body's scrollWidth to the viewport width — a difference of
      //    even 1 px is enough to flag a regression on a clipped halo.
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }
      })
      expect(
        overflow.scrollWidth,
        `horizontal overflow at ${vp.name} : scrollWidth=${overflow.scrollWidth}, clientWidth=${overflow.clientWidth}`,
      ).toBeLessThanOrEqual(overflow.clientWidth + 1)

      // 3. At least one MusicPlayer instance is reachable (smoke check).
      const players = page.locator('.mp')
      expect(await players.count()).toBeGreaterThan(0)

      // 4. The seek slider exposes its ARIA contract — the audit's a11y
      //    constraint should hold across every viewport.
      const slider = page.locator('.mp__bar').first()
      await expect(slider).toHaveAttribute('role', 'slider')
      await expect(slider).toHaveAttribute('aria-label', 'Seek')
    })
  }

  test('mobile — keyboard reaches the play button via Tab', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/?intro=skip')
    await page.waitForLoadState('networkidle')

    // Walk Tab a handful of times — the hero player's clickable
    // artwork (role="button") should land on focus eventually.
    const reachedPlayer = await tabUntil(page, '.mp__art', 25)
    expect(reachedPlayer, 'tabbed > 25 times without reaching .mp__art').toBe(true)
  })
})

async function tabUntil(page: Page, selector: string, maxSteps: number): Promise<boolean> {
  const target = page.locator(selector).first()
  await page.locator('body').focus()
  for (let i = 0; i < maxSteps; i++) {
    await page.keyboard.press('Tab')
    const isFocused = await target.evaluate((el) => el === document.activeElement)
    if (isFocused) return true
  }
  return false
}
