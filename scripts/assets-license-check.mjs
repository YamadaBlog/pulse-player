#!/usr/bin/env node
/**
 * Every media asset that ships (in a package or on the public site) must
 * have documented provenance: either a mention in NOTICE.md or a rule
 * below explaining why it is exempt. Prints a weight manifest as well.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const NOTICE = readFileSync(join(ROOT, 'NOTICE.md'), 'utf8')
const ASSET = /\.(webp|png|jpe?g|svg|gif|woff2?|ttf|otf|webm|mp3|ogg|wav|mp4)$/i
const SCAN = ['apps/site/public', 'docs', 'packages']

const EXEMPT = [
  {
    test: /^apps\/site\/public\/(favicon\.(svg|png)|og-banner\.png)$/,
    why: 'project mark / banner (MIT)',
  },
  { test: /^docs\/(brand|screenshots)\//, why: 'rendered from this repository (MIT)' },
]

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (ASSET.test(entry.name)) yield full
  }
}

let missing = 0
let total = 0
for (const root of SCAN) {
  for (const file of walk(join(ROOT, root))) {
    const rel = relative(ROOT, file).replaceAll('\\', '/')
    const size = statSync(file).size
    total += size
    const exempt = EXEMPT.find((e) => e.test.test(rel))
    const documented = NOTICE.includes(basename(file))
    const status = documented ? 'NOTICE' : exempt ? exempt.why : 'UNDOCUMENTED'
    if (!documented && !exempt) missing++
    console.log(`${(size / 1024).toFixed(0).padStart(6)} kB  ${rel}  — ${status}`)
  }
}
console.log(`\n${(total / 1024 / 1024).toFixed(2)} MB of assets scanned.`)
if (missing) {
  console.error(`${missing} asset(s) without documented provenance — add them to NOTICE.md.`)
  process.exit(1)
}
