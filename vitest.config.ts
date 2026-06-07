import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/composables/**'],
      exclude: ['**/*.vue', '**/index.ts'],
      reporter: ['text', 'html'],
      thresholds: {
        // Modest floors — tests focus on the high-leverage store + tour
        // composable. Vue SFCs are covered by smoke tests in the demo.
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
})
