/**
 * pages-live.spec.ts — post-deploy smoke against the PUBLIC demo.
 *
 * Audit round-5 follow-up : the GitHub Pages vitrine shipped broken
 * cover images (root-absolute '/audio/…' paths ignoring the
 * '/pulse-player/' base + assets intentionally absent) for weeks
 * without any signal — every existing suite runs against localhost.
 * This spec is the alarm that was missing : it loads the DEPLOYED
 * URL and fails on the exact symptoms a visitor would see.
 *
 * Assertions :
 *   1. zero failed network requests (4xx/5xx) during load + settle ;
 *   2. zero console errors ;
 *   3. the hero renders (visible heading + at least one player) ;
 *   4. every <img> on the page has actually decoded
 *      (naturalWidth > 0 — catches broken-image icons that produce
 *      neither a console error nor a failed request when cached).
 *
 * Gated on PULSE_PAGES_URL so local runs skip it. The pages.yml
 * deploy workflow sets it to the live URL after `deploy-pages`.
 */
import { test, expect } from '@playwright/test'

const PAGES_URL = process.env.PULSE_PAGES_URL

test.describe('GitHub Pages — deployed demo smoke', () => {
  test.skip(!PAGES_URL, 'Set PULSE_PAGES_URL=https://… to run the deployed-demo smoke.')

  test('public demo loads clean — no failed assets, no console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    const failedRequests: string[] = []

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('response', (res) => {
      if (res.status() >= 400) failedRequests.push(`${res.status()} ${res.url()}`)
    })

    await page.goto(`${PAGES_URL}?intro=skip`, { waitUntil: 'networkidle' })
    // Let lazy mounts (gallery players, FAB chrome) settle and fire
    // their asset requests.
    await page.waitForTimeout(2500)

    // 3. Hero present.
    await expect(page.locator('.hero').first()).toBeVisible()
    expect(await page.locator('.mp').count()).toBeGreaterThan(0)

    // 4. Every rendered <img> decoded — a 404 cover produces
    //    naturalWidth === 0 even when the request error was swallowed.
    const brokenImages = await page.evaluate(() =>
      Array.from(document.querySelectorAll('img'))
        .filter((img) => img.src && !img.src.startsWith('data:') && img.naturalWidth === 0)
        .map((img) => img.src),
    )

    expect(failedRequests, `Failed asset requests:\n${failedRequests.join('\n')}`).toEqual([])
    expect(consoleErrors, `Console errors:\n${consoleErrors.join('\n')}`).toEqual([])
    expect(brokenImages, `Broken <img> (naturalWidth=0):\n${brokenImages.join('\n')}`).toEqual([])
  })
})
