// @ts-check
import sitemap from '@astrojs/sitemap'
import vue from '@astrojs/vue'
import { defineConfig } from 'astro/config'
import { workspaceAliases } from '../workspace-aliases.ts'
import { satteri } from '@astrojs/markdown-satteri'
import { docLinks } from './src/lib/doc-links.mjs'

// GitHub Pages serves the site from /pulse-player/. Locally it lives at /.
const base = process.env.BASE_PATH ?? '/'

export default defineConfig({
  site: 'https://yamadablog.github.io',
  base,
  trailingSlash: 'always',
  integrations: [
    vue({
      template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith('pulse-') } },
    }),
    sitemap(),
  ],
  markdown: {
    shikiConfig: { theme: 'github-dark-default' },
    processor: satteri({ mdastPlugins: [docLinks(base)] }),
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  server: { port: 5174 },
  vite: {
    resolve: { alias: workspaceAliases },
    server: { fs: { allow: ['../..'] } },
  },
})
