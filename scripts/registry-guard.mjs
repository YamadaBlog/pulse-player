#!/usr/bin/env node
/**
 * registry-guard.mjs — the regression net for the audit #5/#6 P0.
 *
 * That incident: the PUBLISHED @pulse-music/* dist bundles imported
 * the pre-rename @pulse/* scope and failed every real consumer build,
 * for weeks, with zero signal — because every CI suite ran on local
 * sources/tarballs, never on what the registry actually serves.
 *
 * This guard closes that blind spot from the OTHER side: it downloads
 * the LIVE published tarballs (npm pack <name>@<tag>), unpacks them,
 * and fails if any shipped artefact imports a stale @pulse/* scope OR
 * if the package whose `latest` tag should resolve is missing. Run it
 * in CI on a schedule + on demand — if it ever goes red, the registry
 * is serving broken packages again.
 *
 *   node scripts/registry-guard.mjs            # checks dist-tag "latest"
 *   node scripts/registry-guard.mjs --tag next
 *
 * Exit 0 = every published package resolves the correct scope.
 * Exit 1 = a published tarball is broken (prints which + the imports).
 */

import { execSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const TAG = (() => {
  const i = process.argv.indexOf('--tag')
  return i >= 0 ? process.argv[i + 1] : 'latest'
})()

// The packages that ship a built dist (the ones that broke in #5/#6).
// types/tokens carry only generated declarations; react-native ships
// source — all are still scope-checked for completeness.
const PACKAGES = [
  '@pulse-music/types',
  '@pulse-music/tokens',
  '@pulse-music/core',
  '@pulse-music/web-component',
  '@pulse-music/react',
  '@pulse-music/svelte',
  '@pulse-music/react-native',
]

// A stale import is `@pulse/<word>` (NOT `@pulse-music/...`) appearing
// in an actual MODULE-RESOLUTION position — `from '…'`, `require('…')`,
// `import('…')`. Plain `@pulse/x` text in a JSDoc comment or a sourcemap
// is harmless documentation (the old package names) and must NOT trip
// the guard — only a real import that the bundler would try to resolve
// breaks a consumer. (The historical #5/#6 break WAS a real
// `require("@pulse/core")` import, so this still catches it.)
const STALE = /(?:from|require\(|import\()\s*['"](@pulse\/[a-z-]+)['"]/g
const isStale = (s) => {
  const out = []
  for (const m of s.matchAll(STALE)) if (!m[1].startsWith('@pulse-music')) out.push(m[1])
  return out
}

const sh = (cmd, cwd) =>
  execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' })

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(js|cjs|mjs|ts|cts|mts)$/.test(e) && !/\.map$/.test(e)) out.push(p)
  }
  return out
}

const failures = []
let checked = 0

for (const name of PACKAGES) {
  const dir = mkdtempSync(join(tmpdir(), 'reg-guard-'))
  try {
    // Resolve the version behind the tag (fails loudly if unpublished).
    const version = sh(`npm view ${name}@${TAG} version`).trim()
    process.stdout.write(`▶ ${name}@${version} … `)
    // Download + unpack the LIVE tarball.
    const tgz = sh(`npm pack ${name}@${version} --silent`, dir).trim().split('\n').pop()
    sh(`tar -xzf "${tgz}"`, dir)
    const pkgDir = join(dir, 'package')
    const stale = new Set()
    for (const f of walk(pkgDir)) {
      for (const s of isStale(readFileSync(f, 'utf-8'))) stale.add(s)
    }
    checked++
    if (stale.size) {
      console.log('❌')
      failures.push({ name, version, stale: [...stale] })
    } else {
      console.log('✅')
    }
  } catch (err) {
    console.log('⚠️')
    failures.push({ name, error: String(err.stderr || err.message || err).slice(-300) })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

if (failures.length) {
  console.error(`\n✗ registry-guard FAILED for ${failures.length} package(s):`)
  for (const f of failures) {
    console.error(`\n── ${f.name}${f.version ? '@' + f.version : ''} ──`)
    if (f.stale) console.error(`  stale scope imports: ${f.stale.join(', ')}`)
    if (f.error) console.error(`  ${f.error}`)
  }
  console.error('\nThe registry is serving broken packages. Republish a clean build (rc.x+1).')
  process.exit(1)
}

console.log(
  `\n✅ ${checked} published packages clean — no stale @pulse/* scope on the "${TAG}" tag.`,
)
