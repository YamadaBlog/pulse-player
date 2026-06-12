#!/usr/bin/env node
/**
 * generate-hero-backdrop.mjs — round-16 raster-cost removal.
 *
 * The hero backdrop used to be the LIVE cover image under a CSS
 * `filter: blur(110px) saturate(1.5) brightness(0.92)` — the single
 * most expensive rasterised layer on the page (a ~2700×1500 surface
 * with a 110 px kernel, re-rasterised on every tile churn during fast
 * scrolling at 2K). This script BAKES that exact look offline :
 *
 *   public/audio/cover.svg   → public/audio/cover-blur.webp
 *   public/audio/cover2.svg  → public/audio/cover2-blur.webp
 *
 * Technique : rasterise at 1280 px, downscale to 640 (kernel cost ↓),
 * sharp blur σ28 (≈ CSS blur 110 px after the 2× stretch), saturation
 * ×1.5 and brightness ×0.92 baked via modulate(), WebP q80. The CSS
 * then ships `filter: none` — the layer composites as a plain quad.
 *
 * Re-run if the cover artwork changes :  npm run generate:backdrop
 */

import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const AUDIO = join(ROOT, 'public', 'audio')

for (const name of ['cover', 'cover2']) {
  const src = join(AUDIO, `${name}.svg`)
  const out = join(AUDIO, `${name}-blur.webp`)
  await sharp(src, { density: 192 })
    .resize(640, 640, { fit: 'cover' })
    .blur(28)
    .modulate({ saturation: 1.5, brightness: 0.92 })
    .webp({ quality: 80 })
    .toFile(out)
  const meta = await sharp(out).metadata()
  console.log(`✓ ${name}-blur.webp ${meta.width}×${meta.height}`)
}
console.log('✅ hero backdrops baked — CSS blur(110px) layer retired.')
