import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Vitest config for @pulse-music/core.
 *
 * Reuses the root project's vitest install (workspaces) but runs in its
 * own jsdom env with its own setup file. `root` is pinned to this
 * package so the include glob doesn't reach into the root `tests/`
 * directory (which holds the Vue v2.3.4 Pinia store tests).
 *
 * Path mapping mirrors `tsconfig.json` so the local `@pulse-music/types`
 * source is consumed directly without going through a build step.
 */
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: false,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@pulse-music/types': fileURLToPath(new URL('../types/src/index.ts', import.meta.url)),
      '@pulse-music/test-utils': fileURLToPath(new URL('../test-utils/src/index.ts', import.meta.url)),
    },
  },
})
