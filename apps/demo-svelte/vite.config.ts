import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { workspaceAliases } from '../workspace-aliases.ts'

export default defineConfig({
  plugins: [svelte()],
  publicDir: '../site/public',
  server: { port: 5182 },
  resolve: { alias: workspaceAliases },
})
