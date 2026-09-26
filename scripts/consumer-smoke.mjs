#!/usr/bin/env node
/**
 * Prove the *packed* packages work for a real consumer — not just the
 * workspace sources the unit tests run on.
 *
 * For each scenario: `npm pack` the packages, install the tarballs into a
 * throwaway project outside the monorepo, then
 *   1. import the package in plain Node (server-side rendering must not throw),
 *   2. `vite build` an entry that uses the public API.
 *
 * Run after `npm run build:packages`.  Exit code 1 if any consumer fails.
 */
import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' })

const packed = new Map()
function pack(name) {
  if (!packed.has(name)) {
    const dir = join(ROOT, 'packages', name)
    const file = sh('npm pack --silent --pack-destination ' + JSON.stringify(tmpdir()), dir)
      .trim()
      .split('\n')
      .pop()
    packed.set(name, join(tmpdir(), file))
  }
  return packed.get(name)
}

const BASE = ['types', 'core', 'tokens', 'web-component']

const scenarios = [
  {
    name: 'web-component',
    packages: BASE,
    ssr: '@pulse-music/web-component',
    entry: `import '@pulse-music/web-component'
if (!customElements.get('pulse-player') || !customElements.get('pulse-fab')) throw new Error('not registered')
document.body.innerHTML = '<pulse-player><pulse-track src="/a.mp3" title="A"></pulse-track></pulse-player>'`,
  },
  {
    name: 'react',
    packages: [...BASE, 'react'],
    ssr: '@pulse-music/react',
    deps: { react: '^19.0.0', 'react-dom': '^19.0.0' },
    entry: `import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse-music/react'
function App() {
  const { isPlaying } = usePulseAudio()
  return createElement('div', null, createElement(PulsePlayer, { variant: 'aurora', ambientEq: true }), createElement(PulseFab), String(isPlaying))
}
createRoot(document.getElementById('app')).render(createElement(App))`,
  },
  {
    name: 'vue',
    packages: [...BASE, 'vue'],
    ssr: '@pulse-music/vue',
    deps: { vue: '^3.5.0' },
    entry: `import { createApp, h } from 'vue'
import { PulsePlayer, PulseFab, usePulseAudio } from '@pulse-music/vue'
createApp({ setup() { const { isPlaying } = usePulseAudio(); return () => [h(PulsePlayer, { variant: 'vinyl' }), h(PulseFab), String(isPlaying.value)] } }).mount('#app')`,
  },
  {
    name: 'svelte',
    packages: [...BASE, 'svelte'],
    ssr: '@pulse-music/svelte',
    deps: { svelte: '^5.0.0' },
    entry: `import { usePulseAudio } from '@pulse-music/svelte'
const audio = usePulseAudio()
audio.subscribe((s) => (document.title = String(s.isPlaying)))`,
  },
]

const failures = []
for (const s of scenarios) {
  process.stdout.write(`▶ ${s.name.padEnd(14)} `)
  const dir = mkdtempSync(join(tmpdir(), `pulse-consumer-${s.name}-`))
  try {
    mkdirSync(join(dir, 'src'))
    writeFileSync(
      join(dir, 'package.json'),
      JSON.stringify({
        name: `consumer-${s.name}`,
        private: true,
        type: 'module',
        dependencies: s.deps ?? {},
        devDependencies: { vite: '^8.0.0' },
      }),
    )
    writeFileSync(
      join(dir, 'index.html'),
      '<div id="app"></div><script type="module" src="/src/main.js"></script>',
    )
    writeFileSync(join(dir, 'src/main.js'), s.entry)
    const tarballs = s.packages
      .map(pack)
      .map((t) => JSON.stringify(t))
      .join(' ')
    sh(`npm install --no-audit --no-fund --silent ${tarballs}`, dir)
    // Server-side import: must not touch window/document at module load.
    sh(`node --input-type=module -e "await import('${s.ssr}')"`, dir)
    sh('npx vite build --logLevel error', dir)
    console.log('✅ SSR import + build')
  } catch (error) {
    console.log('❌')
    failures.push(
      `${s.name}: ${String(error.stderr || error.stdout || error.message).slice(-1500)}`,
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
for (const file of packed.values()) rmSync(file, { force: true })

if (failures.length) {
  console.error('\n' + failures.join('\n\n'))
  process.exit(1)
}
console.log('\nAll consumers install, import on the server and build.')
