import { fileURLToPath } from 'node:url'

/**
 * Resolve the workspace packages to their TypeScript sources, so the
 * apps hot-reload on library edits without a rebuild. (The published
 * builds are exercised separately by `npm run test:consumer`.)
 */
export const workspaceAliases = Object.fromEntries(
  ['types', 'core', 'tokens', 'web-component', 'react', 'svelte', 'vue'].map((name) => [
    `@pulse-music/${name}`,
    fileURLToPath(new URL(`../packages/${name}/src/index.ts`, import.meta.url)),
  ]),
)
