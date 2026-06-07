import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [svelte()],
  server: { port: 5182 },
  resolve: {
    alias: {
      '@pulse-music/types': fileURLToPath(new URL('../../packages/types/src/index.ts', import.meta.url)),
      '@pulse-music/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      '@pulse-music/tokens': fileURLToPath(
        new URL('../../packages/tokens/src/index.ts', import.meta.url),
      ),
      '@pulse-music/web-component': fileURLToPath(
        new URL('../../packages/web-component/src/index.ts', import.meta.url),
      ),
      '@pulse-music/svelte': fileURLToPath(
        new URL('../../packages/svelte/src/index.ts', import.meta.url),
      ),
    },
  },
})
