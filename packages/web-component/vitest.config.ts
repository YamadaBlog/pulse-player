import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Vitest config for @pulse/web-component.
 *
 * Same jsdom setup as @pulse/core, with additional path aliases to
 * the workspace packages so the test runner consumes the local TS
 * sources directly.
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
      '@pulse/types': fileURLToPath(new URL('../types/src/index.ts', import.meta.url)),
      '@pulse/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      '@pulse/tokens': fileURLToPath(new URL('../tokens/src/index.ts', import.meta.url)),
      '@pulse/test-utils': fileURLToPath(new URL('../test-utils/src/index.ts', import.meta.url)),
    },
  },
})
