import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// Workspace-aware Vite config: aliases at the TS source level so the
// dev server runs against the latest local edits to every @pulse-music/*
// package without needing `npm run build:packages` first.
export default defineConfig({
  plugins: [react()],
  server: { port: 5181 },
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
      '@pulse-music/react': fileURLToPath(
        new URL('../../packages/react/src/index.ts', import.meta.url),
      ),
    },
  },
})
