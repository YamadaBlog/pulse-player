import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const src = (pkg: string): string =>
  fileURLToPath(new URL(`./packages/${pkg}/src/index.ts`, import.meta.url))

// Tests always run against the TypeScript sources, never against dist/.
const alias = {
  '@pulse-music/types': src('types'),
  '@pulse-music/core': src('core'),
  '@pulse-music/tokens': src('tokens'),
  '@pulse-music/web-component': src('web-component'),
  '@pulse-music/react': src('react'),
  '@pulse-music/svelte': src('svelte'),
  '@pulse-music/vue': src('vue'),
  '@pulse-music/test-utils': src('test-utils'),
}

const dom = (name: string, setup?: string) => ({
  extends: true as const,
  test: {
    name,
    include: [`packages/${name}/tests/**/*.test.{ts,tsx}`],
    environment: 'happy-dom',
    setupFiles: setup ? [setup] : [],
  },
})

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      dom('core', 'packages/core/tests/setup.ts'),
      dom('tokens'),
      dom('web-component', 'packages/test-utils/src/setup-dom.ts'),
      dom('react', 'packages/test-utils/src/setup-dom.ts'),
      dom('svelte', 'packages/test-utils/src/setup-dom.ts'),
      dom('vue', 'packages/test-utils/src/setup-dom.ts'),
      {
        test: {
          name: 'react-native',
          root: 'packages/react-native',
          include: ['tests/**/*.test.ts'],
          environment: 'node',
          alias: {
            '@pulse-music/types': src('types'),
            'expo-av': fileURLToPath(
              new URL('./packages/react-native/tests/__mocks__/expo-av.ts', import.meta.url),
            ),
            'react-native': fileURLToPath(
              new URL('./packages/react-native/tests/__mocks__/react-native.ts', import.meta.url),
            ),
            'react-native-reanimated': fileURLToPath(
              new URL(
                './packages/react-native/tests/__mocks__/react-native-reanimated.ts',
                import.meta.url,
              ),
            ),
          },
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['packages/{core,tokens,web-component,react,svelte,vue}/src/**'],
      reporter: ['text-summary', 'html', 'lcov'],
      thresholds: { lines: 85, functions: 85, branches: 75, statements: 85 },
    },
  },
})
