/**
 * Visual regression baselines for the Vue v2.3.4 demo.
 *
 * These tests capture the validated rendering of `src/App.vue` +
 * `src/lib/MusicPlayer.vue` + `src/lib/MiniPlayer.vue`. Two
 * stable baselines for now:
 *
 *   - **hero** — the transparent variant in its hero context
 *   - **home-fold** — above-the-fold of the demo home page
 *
 * Two more targeted baselines (`.resize-stage` and `.variants`
 * gallery) were attempted but the running ambient EQ / pulso CSS
 * animations under scroll caused Playwright's stability heuristic
 * to never converge. Adding `prefers-reduced-motion` emulation
 * didn't help — the demo's auto-tour rAF loop still mutates the
 * page state. Those captures need either:
 *   - explicit demo-pause hook (`window.__pulsePauseDemo = true`)
 *   - or fullPage captures with a higher `maxDiffPixelRatio`
 * Tracked for v3.0.0-alpha.8.
 *
 * Purpose: gate the alpha.9 Vue migration (`src/lib/` →
 * `packages/vue/`). Any pixel drift in the two captures blocks
 * the merge.
 */
import { test, expect } from '@playwright/test'

test.describe('Vue v2.3.4 demo — visual regression baselines', () => {
  test('hero — transparent variant + ambient EQ', async ({ page }) => {
    // Freeze animations via prefers-reduced-motion (the Vue demo's
    // CSS honours this and snaps every animation to frame 0).
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(600)
    const hero = page.locator('.hero').first()
    await expect(hero).toHaveScreenshot('hero.png')
  })

  test('home page above the fold', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    await expect(page).toHaveScreenshot('home-fold.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.01,
    })
  })

})

/**
 * Captures attempted for `.resize-stage` and `.variants` gallery
 * sections didn't converge under the running demo's ambient EQ +
 * pulso animation loops, even with `prefers-reduced-motion: reduce`
 * emulation and explicit element masking. The two captures above
 * (`hero` + `home-fold`) cover the highest-visibility surface and
 * are stable across runs — enough to gate the alpha.9 Vue
 * migration's most critical visual surface. See
 * `docs/universal/BLOCKERS.md` #4 for the deferred follow-up.
 */
