import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node', // RN sentinels don't need a DOM
    globals: false,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@pulse/types': fileURLToPath(new URL('../types/src/index.ts', import.meta.url)),
    },
  },
})
