import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Reduced motion renders the final state of every entrance animation, so
// contrast is measured on what users actually read.
test.use({ reducedMotion: 'reduce' })

test('the showcase has no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('./')
  await page.locator('pulse-player .title').first().waitFor()
  await page.waitForTimeout(500)
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([])
})

test('…including while music plays', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Play a track' }).click()
  await page.waitForTimeout(800)
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([])
})

test('the playground is operable from the keyboard', async ({ page }) => {
  await page.goto('./#playground')
  const tabs = page.getByRole('tablist', { name: 'Framework' })
  await tabs.getByRole('tab', { name: 'HTML' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.getByRole('tab', { name: 'Vue' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#pg-code pre')).toContainText('@pulse-music/vue')

  await page.getByRole('radio', { name: 'Aurora' }).click()
  await expect(page.locator('#pg-code pre')).toContainText('variant="aurora"')
})
