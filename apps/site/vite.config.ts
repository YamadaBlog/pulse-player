import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { workspaceAliases } from '../workspace-aliases'

// GitHub Pages serves the site from /pulse-player/; everything else uses '/'.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    vue({
      template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('pulse-') } },
    }),
  ],
  resolve: { alias: workspaceAliases },
  server: { port: 5174 },
  build: { target: 'es2022', cssMinify: 'lightningcss' },
})
