import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * Vitest config for @pulse-music/angular smoke tests.
 *
 * We don't bootstrap the full Angular runtime here — the module is a
 * thin shell over `<pulse-player>` / `<pulse-fab>` Custom Elements,
 * so the smoke test verifies that importing the package side-effect-
 * registers the elements and that the re-exports resolve to the
 * right `@pulse-music/web-component` symbols. That's enough coverage given
 * the module's actual size (~30 LOC).
 *
 * Full Angular integration tests would need `@angular/platform-browser-dynamic`
 * + Karma or Jest, which is a separate testing pipeline.
 */
const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: __dirname,
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: false,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@pulse-music/types': fileURLToPath(new URL('../types/src/index.ts', import.meta.url)),
      '@pulse-music/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      '@pulse-music/tokens': fileURLToPath(new URL('../tokens/src/index.ts', import.meta.url)),
      '@pulse-music/web-component': fileURLToPath(
        new URL('../web-component/src/index.ts', import.meta.url),
      ),
      '@pulse-music/test-utils': fileURLToPath(new URL('../test-utils/src/index.ts', import.meta.url)),
      '@angular/core': fileURLToPath(new URL('./tests/angular-core-stub.ts', import.meta.url)),
    },
  },
})
