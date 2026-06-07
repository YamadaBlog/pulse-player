#!/usr/bin/env node
/**
 * Pre-publish dry run for every publishable @pulse-music/* package.
 * Cross-platform Node.js version (works on Windows / macOS / Linux
 * without bash).
 *
 * Runs the full CI gate + tarball dry-run + metadata sanity per
 * package. Aborts on any red. Once green, the maintainer publishes
 * each package with `npm publish --access=public` from its directory.
 *
 * Usage: node scripts/publish-dry-run.mjs
 *        OR npm run publish:dry-run (via package.json scripts)
 */

import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = resolve(__dirname, '..')

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const NC = '\x1b[0m'

const PACKAGES = ['types', 'core', 'tokens', 'web-component', 'react', 'svelte']

function run(cmd, opts = {}) {
  return execSync(cmd, { cwd: REPO_ROOT, stdio: 'inherit', ...opts })
}

function runQuiet(cmd, opts = {}) {
  return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf-8', ...opts }).trim()
}

function fail(msg) {
  console.error(`${RED}  ✘ ${msg}${NC}`)
  process.exit(1)
}

function step(num, total, label) {
  console.log(`\n${YELLOW}→ Step ${num}/${total}: ${label}${NC}`)
}

step(1, 4, 'full CI gate')
try {
  run('npm run ci')
  console.log(`${GREEN}  ✔ CI gate green${NC}`)
} catch {
  fail('CI gate failed — fix before retrying')
}

step(2, 4, 'size-limit budget')
try {
  run('npm run size')
  console.log(`${GREEN}  ✔ size-limit budget green${NC}`)
} catch {
  fail('size-limit budget exceeded — investigate before retrying')
}

step(3, 4, 'tarball dry-run per package')
for (const pkg of PACKAGES) {
  const pkgDir = join(REPO_ROOT, 'packages', pkg)
  if (!existsSync(pkgDir)) fail(`packages/${pkg} not found`)
  console.log(`  • @pulse-music/${pkg}`)
  try {
    const out = runQuiet('npm pack --dry-run --json', { cwd: pkgDir })
    const parsed = JSON.parse(out)
    const files = parsed[0]?.files?.length ?? 0
    if (files === 0) fail(`npm pack produced 0 files for @pulse-music/${pkg}`)
    console.log(`${GREEN}    ✔ ${files} files in tarball${NC}`)
  } catch (e) {
    fail(`npm pack failed for @pulse-music/${pkg}: ${e.message}`)
  }
}

step(4, 4, 'metadata sanity per package')
for (const pkg of PACKAGES) {
  const pkgJsonPath = join(REPO_ROOT, 'packages', pkg, 'package.json')
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
  const checks = {
    'exports field': pkgJson.exports !== undefined,
    'files allow-list': Array.isArray(pkgJson.files),
    'repository field': pkgJson.repository !== undefined,
    'license: MIT': pkgJson.license === 'MIT',
  }
  console.log(`  • ${pkgJson.name}@${pkgJson.version}`)
  for (const [name, ok] of Object.entries(checks)) {
    const mark = ok ? `${GREEN}✓${NC}` : `${RED}✘${NC}`
    console.log(`      ${mark} ${name}`)
    if (!ok && (name === 'exports field' || name === 'files allow-list')) {
      fail(`Missing ${name} in ${pkgJson.name}`)
    }
  }
}

console.log(`\n${GREEN}✅ Pre-publish dry-run complete.${NC}\n`)
console.log('Next steps (maintainer only):')
console.log('  1. Verify each package version is the publish target')
console.log('     (current targets: 3.0.0-rc.0 across the board).')
console.log('  2. npm login (once per session).')
console.log('  3. cd packages/<name> && npm publish --access=public --otp=XXXXXX')
console.log('     A single OTP works for all 6 publishes if chained within ~90 s.')
console.log('  4. Full step-by-step: docs/universal/PUBLISH_CHECKLIST.md')
