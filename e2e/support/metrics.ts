import type { Page } from '@playwright/test'

/**
 * The site's live metrics call public, rate-limited APIs (GitHub, npm).
 * Answer them locally so the suites are hermetic.
 */
export async function mockMetrics(page: Page): Promise<void> {
  const json = (body: object) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
  await page.route('https://api.github.com/repos/**', (route) =>
    route.fulfill(
      json({
        stargazers_count: 12,
        forks_count: 2,
        open_issues_count: 3,
        pushed_at: '2026-09-01T10:00:00Z',
      }),
    ),
  )
  await page.route('https://api.npmjs.org/**', (route) => route.fulfill(json({ downloads: 42 })))
  await page.route('https://registry.npmjs.org/**', (route) =>
    route.fulfill(json({ version: '3.0.0' })),
  )
}
