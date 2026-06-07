# Pulse — production-framework integration snippets

Copy-paste-friendly integration patterns for the production-grade meta-frameworks. Each example is **the smallest possible integration** that gets Pulse rendering in the corresponding framework — no dependencies beyond what the framework needs, no extra abstractions.

Once `@pulse/*` lands on npm (see [`PUBLISH_CHECKLIST.md`](../../docs/universal/PUBLISH_CHECKLIST.md)), every snippet here becomes copy-paste-runnable in a fresh project of the matching framework.

## Index

| Framework | Snippet | Real-world fit |
| --- | --- | --- |
| [Next.js 14+ (App Router)](./next-app-router.md) | client-component pattern + dynamic import for SSR safety | Portfolio sites, blog audio post intros, marketing pages with sound effects |
| [Nuxt 3+](./nuxt.md) | auto-imports + `<ClientOnly>` wrapper | Vue-native projects that want Pulse out of the box |
| [SvelteKit 2+](./sveltekit.md) | `+page.svelte` with `usePulseAudio` store | Svelte adopter projects |
| [Astro 4+](./astro.md) | `client:load` directive on the Web Component | Content-first sites that island-load Pulse only on relevant pages |
| [Vanilla HTML + CDN](./vanilla-cdn.md) | one `<script type="module">` line | Quick prototypes, CodePen demos, no build step at all |

## What every snippet has in common

- ~30-50 lines, all the way through render.
- Imports the framework's lightest Pulse package (`@pulse/react` / `@pulse/svelte` / `@pulse/web-component`).
- Wires at minimum: `variant` prop, `ambient-eq`, `pulso`, an event handler.
- Documents the one SSR/hydration gotcha that always trips first-time integrators.

## What every snippet does NOT have

- Routing setup (use the framework's tutorial).
- State management beyond Pulse's own engine.
- Production audio CDN integration (bring your own URLs).
- Custom variant authoring (see [`docs/CUSTOMIZATION.md`](../../docs/CUSTOMIZATION.md)).
- Authentication or analytics (orthogonal concern).

## Pre-publish status

Every snippet works **today** if you `git clone` this monorepo and reference `@pulse/*` via the local workspace (the apps/ demos do exactly this). After `npm publish @pulse/*`, the snippets work in any fresh project of the matching framework.

The CHANGELOG entry for the alpha that ships the first npm publish will include a one-liner "examples/integrations/* now work standalone" line so the timeline is unambiguous.
