#!/usr/bin/env node
/**
 * consumer-smoke.mjs — prove the PACKED artefacts work for a real
 * consumer, not just the workspace sources.
 *
 * Audit №5 root-cause : the rc.0/rc.1 npm publish shipped dist/ files
 * built BEFORE the @pulse/* → @pulse-music/* scope rename. Every
 * repo test passed (they run on sources via workspaces) while every
 * actual `npm install @pulse-music/web-component && vite build`
 * failed with "Rollup failed to resolve import '@pulse/core'".
 * Nothing in CI consumed a tarball — this script closes that hole.
 *
 * What it does, per buildable package + the root Vue lib :
 *   1. `npm pack` the package (after the workspace build).
 *   2. Scaffold a THROWAWAY consumer project in a temp dir
 *      (real package.json, no workspace links).
 *   3. Install the tarball(s) from disk.
 *   4. Vite-build an entry that imports the public surface.
 *   5. Assert the bundle contains no stale-scope imports.
 *
 * Exit codes : 0 = all consumers build ; 1 = a consumer failed ;
 * the failing package and the build output are printed.
 *
 * Usage :  node scripts/consumer-smoke.mjs
 *          (CI: .github/workflows/consumer-smoke.yml)
 */

import { execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '..', '..')
const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf-8' })

/** Pack a workspace package, return absolute tarball path. */
function pack(dir) {
  const out = sh('npm pack --silent', dir).trim().split('\n').pop()
  return join(dir, out)
}

function scaffold(name) {
  const dir = mkdtempSync(join(tmpdir(), `pulse-smoke-${name}-`))
  mkdirSync(join(dir, 'src'), { recursive: true })
  return dir
}

function buildConsumer(dir, entryCode, deps, extraPkg = {}) {
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify(
      {
        name: 'smoke',
        private: true,
        type: 'module',
        scripts: { build: 'vite build' },
        devDependencies: { vite: '^5.0.0', ...(extraPkg.devDependencies ?? {}) },
        dependencies: extraPkg.dependencies ?? {},
      },
      null,
      2,
    ),
  )
  writeFileSync(join(dir, 'index.html'), '<!doctype html><div id="app"></div><script type="module" src="/src/main.js"></script>')
  writeFileSync(join(dir, 'src/main.js'), entryCode)
  if (extraPkg.files) for (const [p, c] of Object.entries(extraPkg.files)) writeFileSync(join(dir, p), c)
  sh('npm install --no-audit --silent --fund=false', dir)
  if (deps.length) sh(`npm install --no-audit --silent --fund=false ${deps.map((d) => JSON.stringify(d)).join(' ')}`, dir)
  sh('npm run build', dir)
  // Stale-scope assertion on the produced bundle.
  const assets = join(dir, 'dist', 'assets')
  for (const f of readdirSync(assets)) {
    const body = readFileSync(join(assets, f), 'utf-8')
    if (/@pulse\//.test(body)) throw new Error(`stale @pulse/ scope found in built ${f}`)
  }
}

const failures = []

function run(name, fn) {
  process.stdout.write(`▶ consumer: ${name} … `)
  try {
    fn()
    console.log('✅')
  } catch (err) {
    console.log('❌')
    failures.push({ name, err: String(err.stdout || err.message || err).slice(-2000) })
  }
}

// ─── 1. Web Component chain (types + tokens + core + web-component) ──
run('web-component (vanilla)', () => {
  const tarballs = ['types', 'tokens', 'core', 'web-component'].map((p) => pack(join(ROOT, 'packages', p)))
  const dir = scaffold('wc')
  buildConsumer(dir, `import '@pulse-music/web-component'\nif(!customElements.get('pulse-player')) throw new Error('element not registered')\n`, tarballs)
  rmSync(dir, { recursive: true, force: true })
})

// ─── 2. React wrapper chain ──────────────────────────────────────────
run('react wrapper', () => {
  const tarballs = ['types', 'tokens', 'core', 'web-component', 'react'].map((p) => pack(join(ROOT, 'packages', p)))
  const dir = scaffold('react')
  buildConsumer(
    dir,
    `import { PulsePlayer } from '@pulse-music/react'\nimport React from 'react'\nimport { createRoot } from 'react-dom/client'\ncreateRoot(document.getElementById('app')).render(React.createElement(PulsePlayer, { variant: 'aurora' }))\n`,
    tarballs,
    { dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' } },
  )
  rmSync(dir, { recursive: true, force: true })
})

// ─── 3. Svelte wrapper chain (plain TS hook — no compiler needed) ────
run('svelte wrapper', () => {
  const tarballs = ['types', 'tokens', 'core', 'web-component', 'svelte'].map((p) => pack(join(ROOT, 'packages', p)))
  const dir = scaffold('svelte')
  buildConsumer(dir, `import { usePulseAudio, ALL_VARIANTS } from '@pulse-music/svelte'\nconsole.log(typeof usePulseAudio, ALL_VARIANTS.length)\n`, tarballs)
  rmSync(dir, { recursive: true, force: true })
})

// ─── 4. Root Vue library tarball ─────────────────────────────────────
run('vue root lib', () => {
  sh('npm run build:lib', ROOT)
  const tarball = pack(ROOT)
  const dir = scaffold('vue')
  buildConsumer(
    dir,
    `import { createApp, h } from 'vue'\nimport { createPinia } from 'pinia'\nimport { MusicPlayer, setAudioTracks } from 'pulse-player'\nimport 'pulse-player/style.css'\nsetAudioTracks([{ title: 'T', src: '/x.webm', cover: '/x.webp', coverPos: '50% 50%' }])\ncreateApp({ render: () => h(MusicPlayer, { variant: 'midnight' }) }).use(createPinia()).mount('#app')\n`,
    [tarball],
    {
      dependencies: { vue: '^3.4.0', pinia: '^2.1.0' },
      devDependencies: { '@vitejs/plugin-vue': '^5.0.0' },
      files: {
        'vite.config.js': `import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\nexport default defineConfig({ plugins: [vue()] })\n`,
      },
    },
  )
  rmSync(dir, { recursive: true, force: true })
  rmSync(tarball, { force: true })
})

// Clean package tarballs left in workspace dirs.
for (const p of ['types', 'tokens', 'core', 'web-component', 'react', 'svelte']) {
  const dir = join(ROOT, 'packages', p)
  for (const f of readdirSync(dir)) if (f.endsWith('.tgz')) rmSync(join(dir, f), { force: true })
}

if (failures.length) {
  console.error(`\n✗ ${failures.length} consumer build(s) FAILED :`)
  for (const f of failures) console.error(`\n── ${f.name} ──\n${f.err}`)
  process.exit(1)
}
console.log('\n✅ every packed artefact builds in a clean consumer project.')
