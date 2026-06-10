#!/usr/bin/env node
/**
 * check-lib-byte-identical.mjs — assert src/lib/ is unchanged vs the
 * frozen v2.3.4 baseline.
 *
 * Why : alpha.33 → alpha.37 cycles introduce demo-page and styling
 * changes, but the public library (`src/lib/MusicPlayer.vue`,
 * `MiniPlayer.vue`, `useAudioStore.ts`, `shared/*`, `index.ts`) MUST
 * stay byte-identical so consumers of `pulse-player@2.3.4` never see
 * silent behaviour drift. The audit (P2.5) called this contract out
 * as load-bearing but enforced only by manual `diff` checks.
 *
 * This script runs `git ls-tree -r v2.3.4 src/lib/` then
 * `git ls-tree -r HEAD src/lib/` and compares the SHA-1 of every file.
 * Exit code :
 *   0  — every src/lib/ file is byte-identical to v2.3.4
 *   1  — at least one file changed (prints the diff)
 *   2  — git invocation failed (no `v2.3.4` tag fetched, no git in
 *        PATH, repo corrupt, etc.) — treated as a HARD error so CI
 *        doesn't silently pass when the comparison didn't actually run.
 *
 * Usage : node scripts/check-lib-byte-identical.mjs
 *         or  npm run check:lib-identical
 *
 * Designed to drop into a CI step :
 *
 *   - name: Vue v2.3.4 library byte-identical
 *     run: npm run check:lib-identical
 */

import { execFileSync } from 'node:child_process'
import process from 'node:process'

const BASELINE_REF = process.env.PULSE_LIB_BASELINE_REF ?? 'v2.3.4'
const TARGET_REF = process.env.PULSE_LIB_TARGET_REF ?? 'HEAD'
const LIB_PATH = 'src/lib/'

/**
 * Run `git ls-tree -r <ref> <path>` and return a Map of relative path →
 * blob SHA-1. Exits 2 if the ref doesn't exist.
 */
function lsTree(ref) {
  let raw
  try {
    raw = execFileSync('git', ['ls-tree', '-r', ref, '--', LIB_PATH], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (err) {
    console.error(`✗ git ls-tree -r ${ref} -- ${LIB_PATH} failed`)
    console.error(err.message ?? err)
    process.exit(2)
  }
  const map = new Map()
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue
    // Format : "<mode> <type> <sha>\t<path>"
    const [meta, path] = line.split('\t')
    if (!meta || !path) continue
    const parts = meta.split(/\s+/)
    if (parts.length < 3) continue
    map.set(path, parts[2])
  }
  return map
}

const baseline = lsTree(BASELINE_REF)
const target = lsTree(TARGET_REF)

if (baseline.size === 0) {
  console.error(`✗ Baseline ref ${BASELINE_REF} has no files under ${LIB_PATH}.`)
  console.error('  Did you fetch tags? Try: git fetch --tags')
  process.exit(2)
}

const drift = []
const allPaths = new Set([...baseline.keys(), ...target.keys()])
for (const p of allPaths) {
  const a = baseline.get(p)
  const b = target.get(p)
  if (a !== b) {
    drift.push({
      path: p,
      baseline: a ?? '(missing)',
      target: b ?? '(missing)',
    })
  }
}

if (drift.length === 0) {
  console.log(
    `✓ src/lib/ is byte-identical between ${BASELINE_REF} and ${TARGET_REF} ` +
      `(${baseline.size} file${baseline.size === 1 ? '' : 's'}).`,
  )
  process.exit(0)
}

console.error(`✗ src/lib/ drift detected — ${drift.length} file(s) changed vs ${BASELINE_REF} :`)
for (const d of drift) {
  console.error(`    ${d.path}`)
  console.error(`      baseline ${BASELINE_REF}: ${d.baseline}`)
  console.error(`      target   ${TARGET_REF}: ${d.target}`)
}
console.error('')
console.error('Resolution :')
console.error('  - If the change is intentional, bump the library version and')
console.error('    update PULSE_LIB_BASELINE_REF (or this script\'s default).')
console.error('  - Otherwise revert the offending change so consumers of')
console.error('    pulse-player@2.3.4 keep getting the same library bytes.')
process.exit(1)
