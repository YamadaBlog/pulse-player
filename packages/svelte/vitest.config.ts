import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

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
      '@pulse/web-component': fileURLToPath(
        new URL('../web-component/src/index.ts', import.meta.url),
      ),
      '@pulse/tokens': fileURLToPath(new URL('../tokens/src/index.ts', import.meta.url)),
      '@pulse/test-utils': fileURLToPath(new URL('../test-utils/src/index.ts', import.meta.url)),
    },
  },
})
