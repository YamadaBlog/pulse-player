import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end checks against real browsers:
 *  - `site`: the showcase (built, served by `astro preview`)
 *  - `lab`:  the component lab page of the plain-HTML example
 *
 * `PULSE_SITE_URL` points the site project at a deployed URL instead
 * (used by the post-deploy smoke test on GitHub Pages).
 */
const deployed = process.env.PULSE_SITE_URL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'site',
      testMatch: /site\..*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: deployed ?? 'http://localhost:4174/' },
    },
    {
      name: 'site-mobile',
      testMatch: /site\.smoke\.spec\.ts/,
      use: { ...devices['Pixel 7'], baseURL: deployed ?? 'http://localhost:4174/' },
    },
    {
      name: 'lab',
      testMatch: /lab\..*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:4180/' },
    },
  ],
  webServer: deployed
    ? undefined
    : [
        {
          command: 'npm run preview -w @pulse-music/site -- --port 4174',
          url: 'http://localhost:4174/',
          reuseExistingServer: !process.env.CI,
        },
        {
          command: 'npm run preview -w @pulse-music/demo-vanilla -- --port 4180 --strictPort',
          url: 'http://localhost:4180/lab.html',
          reuseExistingServer: !process.env.CI,
        },
      ],
})
