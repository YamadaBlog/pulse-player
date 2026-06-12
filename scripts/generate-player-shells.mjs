#!/usr/bin/env node
/**
 * generate-player-shells.mjs — round-14 shell-capture pipeline.
 *
 * Renders every decorative MusicPlayer configuration through the
 * showcase rig (`?showcase=1&v=…&a=…&w=…&bg=…&t=0&clean=1`), element-
 * screenshots the `.mp` card at DPR 2, converts to WebP (sharp), and
 * writes the assets consumed by PlayerShell.vue.
 *
 * Why : the demo used to mount 25 FULL player instances (29 live
 * backdrop-filters, 45 blur layers). Decorative cards are now
 * pre-rendered pixels — this script is the single source of those
 * pixels. Re-run after any lib visual change :
 *
 *   npm run generate:shells
 *
 * Requires a prod build in dist/ (BASE_PATH=/pulse-player/) — the
 * script boots its own `vite preview` on :4943 and tears it down.
 */

import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const OUT = join(ROOT, 'src', 'assets', 'shells')
mkdirSync(OUT, { recursive: true })

/** Every decorative card on the demo page, by section. */
const SPECS = [
  // Pick a mood — 9 cards (PickAMoodSection.vue variant specs).
  { name: 'mood-auto', v: 'auto', w: 536 },
  { name: 'mood-vinyl', v: 'vinyl', a: '#C8A97E', w: 536 },
  { name: 'mood-sunset', v: 'sunset', a: '#F59E0B', w: 536 },
  { name: 'mood-midnight', v: 'midnight', a: '#8B5CF6', w: 536 },
  { name: 'mood-aurora', v: 'aurora', a: '#06B6D4', w: 536 },
  { name: 'mood-dark', v: 'dark', w: 536 },
  { name: 'mood-light', v: 'light', a: '#6750A4', w: 536 },
  { name: 'mood-transparent', v: 'transparent', w: 536, alpha: true },
  {
    name: 'mood-custom-brown',
    v: 'custom',
    a: '#E8A87C',
    w: 536,
    bg: 'linear-gradient(135deg, #2c1610 0%, #4a2c1f 45%, #6b4226 100%)',
  },
  // Three widths — auto variant at the three demo breakpoints.
  { name: 'width-320', v: 'auto', w: 320 },
  { name: 'width-480', v: 'auto', w: 480 },
  { name: 'width-720', v: 'auto', w: 720 },
  // Rotate-3D faces.
  { name: 'face-front-auto', v: 'auto', w: 460 },
  { name: 'face-back-sunset', v: 'sunset', a: '#F59E0B', w: 460 },
  // Phone showcase widget.
  { name: 'phone-auto', v: 'auto', w: 340 },
]

// ─── boot a throwaway preview server ─────────────────────────────────
const PORT = 4943
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  cwd: ROOT,
  shell: true,
  env: { ...process.env, BASE_PATH: '/pulse-player/' },
  stdio: 'ignore',
})
const url = (q) => `http://localhost:${PORT}/pulse-player/?showcase=1&t=0&clean=1&${q}`
await new Promise((r) => setTimeout(r, 2500))

const browser = await chromium.launch()
const ctx = await browser.newContext({
  viewport: { width: 1400, height: 900 },
  deviceScaleFactor: 2,
})
const page = await ctx.newPage()

const manifest = {}
for (const s of SPECS) {
  const q = new URLSearchParams()
  q.set('v', s.v)
  if (s.a) q.set('a', s.a)
  if (s.w) q.set('w', String(s.w))
  if (s.bg) q.set('bg', s.bg)
  await page.goto(url(q.toString()), { waitUntil: 'networkidle' })
  // Round-20 user report ("coins noirs") — the first pipeline only
  // cleared html/body, but `.app` (and the showcase stage) kept their
  // dark backgrounds BEHIND the player, so omitBackground had nothing
  // transparent to reveal : every capture shipped opaque corners
  // (hasAlpha=false). Clear the WHOLE ancestor chain — the rounded
  // card then keeps true alpha corners.
  await page.addStyleTag({
    content:
      'html,body,#app,.app,.showcase,.showcase__player{background:transparent!important}' +
      '.app::before,.app::after,.showcase::before,.showcase::after{display:none!important}' +
      // Round-21 ('coins sombres' follow-up) : the card's own
      // box-shadow paints INSIDE the screenshot rect beyond the
      // rounded corners (alpha~18 black pixels). Kill it at capture
      // time — PlayerShell re-creates it at display time with
      // drop-shadow, which follows the alpha (i.e. the radius).
      '.showcase .mp{box-shadow:none!important}',
  })
  await page.waitForSelector('.showcase .mp', { timeout: 15000 })
  // Let the cover image decode + the card settle.
  await page.waitForTimeout(1200)
  const el = page.locator('.showcase .mp').first()
  const png = await el.screenshot({ omitBackground: true, type: 'png' })
  // Round-21 — ALPHA EROSION : some component-internal overlay paints
  // a faint veil (alpha ~18) across the whole rect, including the
  // corners beyond the border-radius — the user's residual 'coins
  // sombres' on light backdrops. Squash any alpha below 32 to 0
  // (nothing legitimate in the chrome sits under ~12 % opacity ; the
  // glassy `transparent` variant lives well above it).
  const rawImg = sharp(png).ensureAlpha()
  const { data, info } = await rawImg.raw().toBuffer({ resolveWithObject: true })
  for (let i = 3; i < data.length; i += 4) if (data[i] < 32) data[i] = 0
  const img = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  const meta = info
  const out = join(OUT, `${s.name}.webp`)
  await img.webp({ quality: 84, alphaQuality: 90 }).toFile(out)
  manifest[s.name] = {
    w: meta.width,
    h: meta.height,
    ratio: +(meta.width / meta.height).toFixed(4),
  }
  console.log(`✓ ${s.name}.webp  ${meta.width}×${meta.height}`)
}

writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`\n✅ ${SPECS.length} shells written to src/assets/shells/ (+ manifest.json)`)

await browser.close()
srv.kill()
process.exit(0)
