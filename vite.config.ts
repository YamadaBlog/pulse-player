import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

/**
 * Two build modes:
 *
 *   `npm run dev`        → demo on http://localhost:5174
 *   `npm run build`      → demo bundle in `dist/` (live preview output;
 *                          NOT what consumers install)
 *   `npm run build:lib`  → published library bundle in `dist/lib/`
 *                          (ES module + CJS + CSS). Triggered by setting
 *                          `VITE_BUILD_TARGET=lib`.
 *
 * The library build uses Vite's library mode, externalises Vue / Pinia /
 * lucide-vue-next (peer deps — consumers ship their own), and emits
 * both an ES module (default) and a CommonJS bundle for the stragglers.
 */
const isLib = process.env.VITE_BUILD_TARGET === 'lib'

// GitHub Pages serves the demo from `https://<user>.github.io/<repo>/`
// — Vite needs the sub-path so asset URLs resolve. Set `BASE_PATH=/`
// (or leave undefined) for local dev and any non-Pages deploy.
const basePath = process.env.BASE_PATH || '/'

export default defineConfig({
  plugins: [vue()],
  server: { port: 5174 },
  base: isLib ? '/' : basePath,
  // Library mode must NOT copy `public/` (demo audio + cover art = 8 MB+).
  // The demo build does copy it — that's where the files belong.
  publicDir: isLib ? false : 'public',
  build: isLib
    ? {
        outDir: 'dist/lib',
        emptyOutDir: true,
        cssCodeSplit: false,
        lib: {
          entry: resolve(__dirname, 'src/lib/index.ts'),
          name: 'PulsePlayer',
          formats: ['es', 'cjs'],
          fileName: (format) => `pulse-player.${format}.js`,
        },
        rollupOptions: {
          external: ['vue', 'pinia', 'lucide-vue-next'],
          output: {
            globals: { vue: 'Vue', pinia: 'Pinia', 'lucide-vue-next': 'LucideVueNext' },
            assetFileNames: 'pulse-player.[ext]',
          },
        },
      }
    : {
        outDir: 'dist',
      },
})
