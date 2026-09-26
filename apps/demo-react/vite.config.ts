import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { workspaceAliases } from '../workspace-aliases'

export default defineConfig({
  plugins: [react()],
  publicDir: '../site/public',
  server: { port: 5181 },
  resolve: { alias: workspaceAliases },
})
