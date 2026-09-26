#!/usr/bin/env node
/**
 * Lint every publishable package the way npm consumers will see it:
 *  - publint: package.json exports / files / module format consistency
 *  - @arethetypeswrong/cli: type resolution under every TS resolution mode
 *
 * Run after `npm run build:packages`.
 */
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const workspaces = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).workspaces

const packages = readdirSync(join(ROOT, 'packages'))
  .map((dir) => ({ dir: join(ROOT, 'packages', dir), rel: `packages/${dir}` }))
  .filter(({ rel }) => workspaces.includes(rel))
  .map((p) => ({ ...p, pkg: JSON.parse(readFileSync(join(p.dir, 'package.json'), 'utf8')) }))
  .filter(({ pkg }) => !pkg.private)

let failed = false
for (const { dir, pkg } of packages) {
  for (const [label, cmd] of [
    ['publint', 'npx publint --strict'],
    // ESM-only packages: the node10 / CJS-require resolution modes don't apply.
    ['attw', 'npx attw --pack . --profile esm-only --format ascii'],
  ]) {
    try {
      execSync(cmd, { cwd: dir, stdio: 'pipe', encoding: 'utf8' })
      console.log(`✅ ${pkg.name.padEnd(28)} ${label}`)
    } catch (error) {
      failed = true
      console.log(`❌ ${pkg.name.padEnd(28)} ${label}\n${error.stdout || error.stderr}`)
    }
  }
}
process.exit(failed ? 1 : 0)
