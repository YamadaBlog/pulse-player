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

    // Round-15 — the demo now ships loading="lazy" shell captures
    // inside content-visibility sections : below-fold images stay
    // naturalWidth=0 BY DESIGN until approached. Walk the page so
    // every lazy image gets its load kick, settle, THEN assert —
    // the broken-image net keeps covering ALL images (a 404 shell is
    // still caught here and by the failedRequests assertion).
    await page.evaluate(async () => {
      const step = window.innerHeight
      for (let y = 0; y <= document.body.scrollHeight; y += step) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 120))
      }
      window.scrollTo(0, 0)
    })
    // Round-19 — the walk alone is racy on real-network latency :
    // Chromium does not even START a lazy fetch for images that cross
    // the viewport in ~120 ms, so distant shells stayed naturalWidth=0
    // depending on machine/network timing (local run vs CI runner
    // diverged). Deterministic instead : flip every <img> to eager and
    // await settlement — a 404 still fires onerror and is caught below.
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((img) => {
          img.loading = 'eager'
          if (img.complete) return null
          return new Promise((r) => {
            img.onload = img.onerror = r
            setTimeout(r, 8000) // safety: never hang the spec
          })
        }),
      ),
    )
    await page.waitForTimeout(300)

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

  test('deployed tracks are the catalogue ones, not the silent fallback (audit №4)', async ({
    request,
  }) => {
    // The deploy pipeline has a graceful degradation chain :
    // incompetech download → in-repo composed fallback. Graceful is
    // right for availability, but it also means a broken catalogue URL
    // would SILENTLY swap professionally-produced music for the
    // composed pads — a quality regression with zero CI signal. Size
    // is a cheap discriminator : the MacLeod tracks transcode to
    // ~1.8-2.6 MB opus, the composed pads to ~0.9-1.4 MB. The 1.6 MB
    // floor splits the two populations cleanly. If the default music
    // changes, update the floor alongside NOTICE.md §3bis.
    const MIN_CATALOGUE_BYTES = 1_600_000
    for (const file of ['audio/track1.webm', 'audio/track2.webm']) {
      const res = await request.get(`${PAGES_URL}${file}`)
      expect(res.status(), `${file} should be deployed`).toBe(200)
      const bytes = (await res.body()).length
      expect(
        bytes,
        `${file} is ${bytes} B — below the ${MIN_CATALOGUE_BYTES} B catalogue floor : ` +
          `the deploy likely fell back to the composed tracks (download failure upstream?)`,
      ).toBeGreaterThanOrEqual(MIN_CATALOGUE_BYTES)
    }
  })

  test('play actually plays — audio survives the click (round-6)', async ({ page }) => {
    await page.goto(`${PAGES_URL}?intro=skip`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)

    // Keyboard activation instead of click : the hero idle animations
    // (floating bob) keep the player moving, so pointer clicks either
    // trip the stability heuristic or land beside the moving target —
    // and a force-click is not always treated as user activation by
    // headless Chromium's autoplay policy. focus() + Enter is
    // position-independent AND a trusted activation (verified working
    // against the live deploy where force-click failed).
    const art = page.locator('.hero .mp__art').first()
    await art.focus()
    await page.keyboard.press('Enter')

    // Behavioural proxy for "sound is coming out" : the store's
    // safePlay() ROLLS BACK isPlaying (and the button flips back to
    // "Play") if HTMLMediaElement.play() rejects — which is exactly
    // what happens when the .webm is missing (the pre-round-6 state
    // of the deployed demo). If after 2.5 s the surface still shows
    // "Pause", the play() Promise resolved : the track loaded and is
    // genuinely progressing.
    await page.waitForTimeout(2500)
    await expect(art).toHaveAttribute('aria-label', 'Pause')
    await expect(art).toHaveAttribute('aria-pressed', 'true')
  })
})
