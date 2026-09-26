import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import { workspaceAliases } from '../workspace-aliases'

// Plain HTML pages; demo media is shared with the showcase site.
export default defineConfig({
  publicDir: '../site/public',
  resolve: { alias: workspaceAliases },
  server: { port: 5180 },
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        lab: resolve(import.meta.dirname, 'lab.html'),
      },
    },
  },
})
