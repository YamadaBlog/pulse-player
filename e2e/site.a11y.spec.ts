import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { mockMetrics } from './support/metrics'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Reduced motion renders the final state of every entrance animation, so
// contrast is measured on what users actually read.
test.use({ reducedMotion: 'reduce' })
test.beforeEach(async ({ page }) => {
  await mockMetrics(page)
})

async function audit(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
}

for (const path of ['./', './playground/', './specs/', './specs/engine/']) {
  test(`${path} has no WCAG 2.2 AA violations`, async ({ page }) => {
    await page.goto(path)
    await page.locator('pulse-player, .prose').first().waitFor()
    await page.waitForTimeout(500)
    expect(await audit(page)).toEqual([])
  })
}

test('…including while music plays', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Drop the needle' }).click()
  await page.waitForTimeout(800)
  expect(await audit(page)).toEqual([])
})

test('reduced motion turns off smooth scrolling and the scroll-scrubbed scene', async ({
  page,
}) => {
  await page.goto('./')
  await expect(page.locator('html')).toHaveClass(/reduced/)
  await expect(page.locator('html')).not.toHaveClass(/lenis/)
  // The width scene falls back to a plain slider.
  const range = page.getByRole('slider', { name: /Width/ })
  await range.fill('150')
  await expect(page.locator('[data-grows-tier]')).toHaveText('Compact')
})

test('the mixing desk is operable from the keyboard', async ({ page }) => {
  await page.goto('./playground/')
  const tabs = page.getByRole('tablist', { name: 'Framework' })
  await tabs.getByRole('tab', { name: 'HTML' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.getByRole('tab', { name: 'Vue' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#desk-code pre')).toContainText('@pulse-music/vue')

  await page.getByRole('radio', { name: 'Aurora' }).check()
  await expect(page.locator('#desk-code pre')).toContainText('variant="aurora"')
})
