#!/usr/bin/env node
/**
 * assets-license-check.mjs — machine-verified asset provenance.
 *
 * Every binary/media asset that ships (in the npm tarball or on the
 * deployed demo) must have a documented licence. This script enumerates
 * them and fails if any is neither (a) referenced by filename in
 * NOTICE.md, nor (b) a recognised licence file, nor (c) on the allow-
 * list of self-generated artefacts (covers/backdrops derived from the
 * MIT SVGs, demo screenshots rendered from the component itself).
 *
 * It also prints a weight manifest so asset bloat is visible in CI.
 *
 *   node scripts/assets-license-check.mjs
 *
 * Exit 0 = every shipped asset has documented provenance.
 * Exit 1 = an asset has no licence trail (prints which).
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, basename, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const NOTICE = readFileSync(join(ROOT, 'NOTICE.md'), 'utf-8')

const ASSET_RE = /\.(webp|png|jpe?g|svg|gif|woff2?|ttf|otf|webm|mp3|ogg|wav|mp4)$/i
const SCAN_DIRS = ['public', 'src/lib', 'src/assets']

// Self-generated, in-repo-derived, or licence-carrying files that don't
// need a per-file NOTICE line. Each entry states WHY it is exempt.
const ALLOW = [
  { test: /OFL\.txt$/, why: 'SIL OFL licence text itself (ships beside the fonts)' },
  {
    test: /Geist.*\.woff2$/,
    why: 'Geist (OFL) — documented in NOTICE §3ter, licence at fonts/OFL.txt',
  },
  { test: /favicon\.(svg|png)$/, why: 'project mark, MIT (rendered from the repo)' },
  { test: /og-banner\.png$/, why: 'OG banner rendered from the component, MIT (NOTICE §5)' },
  {
    test: /cover2?-blur\.webp$/,
    why: 'hero backdrop baked from the MIT cover SVGs (generate:backdrop)',
  },
  {
    test: /assets[\\/]shells[\\/].*\.webp$/,
    why: 'PlayerShell captures rendered from the component itself, MIT',
  },
  {
    test: /track[12]\.webm$/,
    why: 'demo music — Kevin MacLeod CC BY 3.0, documented NOTICE §3bis',
  },
  { test: /cover2?\.(webp|svg)$/, why: 'demo cover placeholder, documented NOTICE §3/§5' },
]

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(join(ROOT, dir))
  } catch {
    return out
  }
  for (const e of entries) {
    const rel = join(dir, e)
    const abs = join(ROOT, rel)
    if (statSync(abs).isDirectory()) walk(rel, out)
    else if (ASSET_RE.test(e)) out.push(rel)
  }
  return out
}

const assets = SCAN_DIRS.flatMap((d) => walk(d))
const undocumented = []
let totalBytes = 0

console.log('Asset provenance + weight manifest\n')
for (const rel of assets) {
  const bytes = statSync(join(ROOT, rel)).size
  totalBytes += bytes
  const name = basename(rel)
  const allow = ALLOW.find((a) => a.test.test(rel))
  const inNotice = NOTICE.includes(name)
  const ok = allow || inNotice
  const tag = allow ? `allow: ${allow.why}` : inNotice ? 'NOTICE.md' : 'UNDOCUMENTED'
  console.log(`  ${ok ? '✅' : '❌'} ${(bytes / 1024).toFixed(1).padStart(7)} kB  ${rel}  — ${tag}`)
  if (!ok) undocumented.push(rel)
}
console.log(`\n  total: ${(totalBytes / 1024).toFixed(1)} kB across ${assets.length} assets`)

if (undocumented.length) {
  console.error(`\n✗ ${undocumented.length} asset(s) with no documented provenance:`)
  for (const a of undocumented) console.error(`  - ${relative(ROOT, join(ROOT, a))}`)
  console.error('\nAdd a NOTICE.md entry (by filename) or an ALLOW rule with a stated reason.')
  process.exit(1)
}
console.log('\n✅ every shipped asset has documented provenance.')
