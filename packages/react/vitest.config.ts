import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Vitest config for @pulse-music/react.
 *
 * jsdom env + setup file matching @pulse-music/core's. JSX is handled by
 * vitest's esbuild loader (the `.tsx` extension + a `jsx: 'automatic'`
 * defaults inferred from tsconfig).
 *
 * Workspace path aliases so the tests consume the local TS sources
 * directly — no build step required between an edit and a run.
 */
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: __dirname,
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: false,
    include: ['tests/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@pulse-music/types': fileURLToPath(new URL('../types/src/index.ts', import.meta.url)),
      '@pulse-music/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      '@pulse-music/web-component': fileURLToPath(
        new URL('../web-component/src/index.ts', import.meta.url),
      ),
      '@pulse-music/tokens': fileURLToPath(new URL('../tokens/src/index.ts', import.meta.url)),
      '@pulse-music/test-utils': fileURLToPath(new URL('../test-utils/src/index.ts', import.meta.url)),
    },
  },
})
