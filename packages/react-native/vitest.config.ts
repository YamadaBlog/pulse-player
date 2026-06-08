import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@pulse-music/types': fileURLToPath(
        new URL('../types/src/index.ts', import.meta.url),
      ),
      // Mock RN-only peer deps so PulseEngineRN + the index can be
      // imported in Node. Component-render tests (PulsePlayer /
      // PulseFab) require a real RN runtime and are exercised in
      // the Expo demo app, not vitest.
      'expo-av': fileURLToPath(
        new URL('./tests/__mocks__/expo-av.ts', import.meta.url),
      ),
      'react-native': fileURLToPath(
        new URL('./tests/__mocks__/react-native.ts', import.meta.url),
      ),
      'react-native-reanimated': fileURLToPath(
        new URL('./tests/__mocks__/react-native-reanimated.ts', import.meta.url),
      ),
    },
  },
})
