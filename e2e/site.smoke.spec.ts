import { expect, test, type Page } from '@playwright/test'
import { mockMetrics } from './support/metrics'

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

const hero = (page: Page) => page.locator('.console pulse-player')

// The live metrics call public APIs (rate-limited): answer them locally so
// the suite is hermetic. The UI itself degrades to "—" when they fail.
test.beforeEach(async ({ page }) => {
  await mockMetrics(page)
})

for (const path of ['./', './playground/', './specs/', './specs/engine/']) {
  test(`${path} loads cleanly, with every asset`, async ({ page }) => {
    const problems = watch(page)
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 50))
      }
    })
    await page.waitForTimeout(500)
    expect(problems).toEqual([])
  })
}

test('never scrolls horizontally', async ({ page }) => {
  for (const path of ['./', './playground/', './specs/']) {
    await page.goto(path)
    for (const width of [360, 390, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await page.waitForTimeout(150)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow, `horizontal overflow on ${path} at ${width}px`).toBeLessThanOrEqual(0)
    }
  }
})

test('dropping the needle plays, reveals the floating player, and lifts again', async ({
  page,
}) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A music player')
  await expect(hero(page).locator('.title')).toHaveText('Protofunk')
  const fab = page.locator('body > pulse-fab')
  await expect(fab.locator('.fab')).not.toHaveAttribute('data-shown', '')

  await page.getByRole('button', { name: 'Drop the needle' }).click()
  await expect(hero(page).getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await expect(fab.locator('.fab')).toHaveAttribute('data-shown', '')
  await expect(page.locator('html')).toHaveAttribute('data-playing', '')
  await expect
    .poll(() => hero(page).locator('.progress').getAttribute('aria-valuenow'), { timeout: 10_000 })
    .not.toBe('0')

  await page.getByRole('button', { name: 'Lift the needle' }).click()
  await expect(hero(page).getByRole('button', { name: 'Play', exact: true })).toBeVisible()
})

test('the music keeps playing across pages', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Drop the needle' }).click()
  await expect(hero(page).getByRole('button', { name: 'Pause', exact: true })).toBeVisible()

  await page.getByRole('link', { name: 'Mixing desk' }).first().click()
  await expect(page).toHaveURL(/playground\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Mix it')
  const desk = page.locator('.monitor pulse-player')
  await expect(desk.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await expect(page.locator('body > pulse-fab .fab')).toHaveAttribute('data-shown', '')
})

test('keyboard shortcuts work inside a player', async ({ page }) => {
  await page.goto('./')
  await hero(page).getByRole('button', { name: 'Next track' }).focus()
  await page.keyboard.press('k')
  await expect(hero(page).getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await page.keyboard.press('Shift+N')
  await expect(hero(page).locator('.title')).toHaveText('Lobby Time')
  await page.keyboard.press('k')
  await expect(hero(page).getByRole('button', { name: 'Play', exact: true })).toBeVisible()
})

test('live repository metrics fill the matrix', async ({ page }) => {
  await page.goto('./')
  await expect(page.locator('.matrix [data-metric="stars"]')).toHaveText('12')
  await expect(page.locator('.matrix [data-metric="version"]')).toHaveText('3.0.0')
  await expect(page.locator('.head__gh [data-metric]')).toHaveText('★ 12')
})

test('a mood retints every following player and is remembered', async ({ page }) => {
  await page.goto('./')
  await page.locator('button[data-mood="aurora"]').click()
  await expect(page.locator('button[data-mood="aurora"]')).toHaveAttribute('aria-pressed', 'true')
  await expect(hero(page)).toHaveAttribute('variant', 'aurora')
  await expect(page.locator('[data-heard-count]')).toHaveText('1')
  await page.reload()
  await expect(hero(page)).toHaveAttribute('variant', 'aurora')
})

test('the tracklist opens, navigates and closes from the keyboard', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Tracklist' }).click()
  const dialog = page.getByRole('dialog', { name: 'Tracklist' })
  await expect(dialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await page.getByRole('button', { name: 'Tracklist' }).click()
  await dialog.getByRole('link', { name: /Liner notes/ }).click()
  await expect(page).toHaveURL(/specs\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Web Components reference')
})
