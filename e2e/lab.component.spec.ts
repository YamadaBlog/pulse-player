import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('./lab.html')
})

test('every width and variant is accessible (WCAG 2.2 AA)', async ({ page }) => {
  await page.locator('pulse-player .title').first().waitFor()
  await page.waitForTimeout(500)
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([])
})

test('the layout adapts to the container width', async ({ page }) => {
  const at = (w: number) => page.locator(`#widths pulse-player[data-width="${w}"]`)
  // Full card: volume and time visible.
  await expect(at(720).getByRole('button', { name: 'Mute' })).toBeVisible()
  await expect(at(720).locator('.time')).toBeVisible()
  // Narrow: no previous / next.
  await expect(at(240).getByRole('button', { name: 'Previous track' })).toBeHidden()
  await expect(at(240).getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  // Disc: a single round toggle.
  const disc = at(72).locator('.disc-toggle')
  await expect(disc).toBeVisible()
  const box = await at(72).locator('.player').boundingBox()
  expect(Math.round(box!.width)).toBe(Math.round(box!.height))
})

test('the seek slider follows the keyboard', async ({ page }) => {
  const player = page.locator('#widths pulse-player[data-width="720"]')
  const slider = player.getByRole('slider', { name: 'Seek' })
  await expect.poll(() => slider.getAttribute('aria-valuemax')).not.toBe('0')
  await slider.focus()
  await page.keyboard.press('End')
  await expect
    .poll(async () => Number(await slider.getAttribute('aria-valuenow')))
    .toBeGreaterThan(150)
  await page.keyboard.press('Home')
  await expect(slider).toHaveAttribute('aria-valuenow', '0')
})

test('the resize handle works with the keyboard', async ({ page }) => {
  const player = page.locator('#resizable')
  const before = (await player.boundingBox())!.width
  await player.getByRole('separator', { name: 'Resize player' }).focus()
  await page.keyboard.press('Shift+ArrowLeft')
  await expect.poll(async () => (await player.boundingBox())!.width).toBeLessThan(before)
})

test('the floating player menu is keyboard-accessible', async ({ page }) => {
  const fab = page.locator('pulse-fab')
  await fab.getByRole('button', { name: 'Player options' }).click()
  const menu = fab.getByRole('menu')
  await expect(menu.getByRole('menuitem', { name: 'Previous track' })).toBeFocused()
  await page.keyboard.press('ArrowDown')
  await expect(menu.getByRole('menuitem', { name: 'Next track' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(fab.locator('.fab')).not.toHaveAttribute('data-menu', '')
})
