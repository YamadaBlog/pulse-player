import { expect, test, type Page } from '@playwright/test'

/** Collect console errors and failed requests (aborted media range requests are normal). */
function watch(page: Page): string[] {
  const problems: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(`console: ${msg.text()}`)
  })
  page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`))
  page.on('requestfailed', (req) => {
    const aborted = req.failure()?.errorText.includes('ABORTED')
    if (!(aborted && req.resourceType() === 'media')) problems.push(`failed: ${req.url()}`)
  })
  page.on('response', (res) => {
    if (res.status() >= 400) problems.push(`${res.status()}: ${res.url()}`)
  })
  return problems
}

test('loads cleanly, with every asset', async ({ page }) => {
  const problems = watch(page)
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('grows with your page')
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
  })
  await page.locator('pulse-player .title').first().waitFor()
  await page.waitForTimeout(500)
  expect(problems).toEqual([])
})

test('never scrolls horizontally', async ({ page }) => {
  await page.goto('./')
  for (const width of [360, 390, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 })
    await page.waitForTimeout(150)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(0)
  }
})

test('plays music from the hero and reveals the floating player', async ({ page }) => {
  await page.goto('./')
  const hero = page.locator('.hero pulse-player')
  await expect(hero.locator('.title')).toHaveText('Protofunk')
  const fab = page.locator('#app > pulse-fab')
  await expect(fab.locator('.fab')).not.toHaveAttribute('data-shown', '')

  await page.getByRole('button', { name: 'Play a track' }).click()
  await expect(hero.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await expect(fab.locator('.fab')).toHaveAttribute('data-shown', '')
  await expect
    .poll(() => hero.locator('.progress').getAttribute('aria-valuenow'), { timeout: 10_000 })
    .not.toBe('0')

  await page.getByRole('button', { name: 'Pause the music' }).click()
  await expect(hero.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
})

test('keyboard shortcuts work inside a player', async ({ page }) => {
  await page.goto('./')
  const hero = page.locator('.hero pulse-player')
  await hero.getByRole('button', { name: 'Next track' }).focus()
  await page.keyboard.press('k')
  await expect(hero.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await page.keyboard.press('Shift+N')
  await expect(hero.locator('.title')).toHaveText('Lobby Time')
  await page.keyboard.press('k')
  await expect(hero.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
})
