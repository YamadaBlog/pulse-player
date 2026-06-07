import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for visual regression of the Vue v2.3.4 demo
 * (`src/App.vue` + `src/lib/*`).
 *
 * Scope: capture a small set of high-signal screenshots from the
 * running Vue demo so future refactors (especially the alpha.9 Vue
 * migration `src/lib/` → `packages/vue/`) can be gated on
 * pixel-perfect parity. We don't snapshot every viewport — three
 * scenarios are enough to catch the regressions that would matter.
 *
 * Storage:
 *   - Baselines live at `tests/visual/__screenshots__/<test>-chromium-…png`
 *   - First run writes them; subsequent runs diff against them.
 *   - Commit the baselines so CI can verify them.
 */
export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5174',
    // The Vue demo runs ambient EQ + idle animations. Bump the
    // action timeout so Playwright's stability heuristic has time
    // to converge on a frame; `animations: 'disabled'` in the
    // expect config below already snaps to the first frame, but
    // the stability check still needs slack.
    actionTimeout: 15000,
    trace: 'retain-on-failure',
  },
  timeout: 60_000,
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  expect: {
    toHaveScreenshot: {
      // Allow tiny anti-aliasing differences across Chromium versions.
      maxDiffPixelRatio: 0.005,
      // Threshold for individual pixel comparison (0..1).
      threshold: 0.15,
      animations: 'disabled',
    },
  },
})
