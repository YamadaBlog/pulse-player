# Examples

Integration sketches you can copy and adapt. Each one is **independent of the main repo's build** — copy the folder, run `npm install`, edit freely.

## Vue 3 examples

| Example | Use case |
| --- | --- |
| [`01-vite-spa`](./01-vite-spa) | The minimum drop-in: Vite + Vue 3 + Pinia + `<MusicPlayer />` + `<MiniPlayer />` |
| [`02-custom-playlist`](./02-custom-playlist) | Swap the default playlist via `setAudioTracks()`, render a custom controls strip |
| [`03-event-subscriptions`](./03-event-subscriptions) | Wire the opt-in event bus (`store.subscribe('play', …)`) into your analytics layer |

These ship the historical Vue v2.3.4 component API. After `npm publish @pulse-music/vue`, the import path becomes `import { … } from '@pulse-music/vue'` — no other change.

## Multi-framework full apps

For the framework wrappers (`@pulse-music/react`, `@pulse-music/svelte`, `@pulse-music/web-component`, `@pulse-music/angular`), the workspace already ships **complete runnable apps** at the repo root under `apps/`. They use the same `@pulse-music/*` packages your downstream consumers will install once npm publishing lands.

| Framework | App | Run command |
| --- | --- | --- |
| Vanilla HTML (no framework) | [`apps/demo-vanilla`](../apps/demo-vanilla) | `npm run dev --workspace=@pulse-music/demo-vanilla` → http://localhost:5180 |
| React 18 / 19 + Vite | [`apps/demo-react`](../apps/demo-react) | `npm run dev --workspace=@pulse-music/demo-react` → http://localhost:5181 |
| Svelte 5 + Vite | [`apps/demo-svelte`](../apps/demo-svelte) | `npm run dev --workspace=@pulse-music/demo-svelte` → http://localhost:5182 |
| Vue 3 (reference) | [`src/App.vue`](../src/App.vue) at repo root | `npm run dev` → http://localhost:5174 |

The apps live under `apps/` (not `examples/`) because they're full Vite projects with their own `vite.config.ts` aliasing the workspace `@pulse-music/*` packages to the local TypeScript sources — that lets edits in `packages/*/src/` reflect immediately in every demo without a rebuild.

## Snippet library (per-framework one-liners)

If you just want the **smallest possible integration snippet** per framework, copy-paste from here:

### React

```tsx
import { PulsePlayer, PulseFab } from '@pulse-music/react'

export function App() {
  return (
    <>
      <PulsePlayer variant="midnight" ambientEq resizable />
      <PulseFab variant="vinyl" pulso draggable showMenu />
    </>
  )
}
```

### Svelte 5

```svelte
<script lang="ts">
  // No <PulsePlayer /> component needed — the Custom Element works directly.
  import '@pulse-music/svelte'
</script>

<pulse-player variant="midnight" ambient-eq resizable></pulse-player>
<pulse-fab variant="vinyl" pulso draggable show-menu></pulse-fab>
```

### Vanilla HTML / Solid / Astro / Qwik

```html
<script type="module" src="https://unpkg.com/@pulse-music/web-component"></script>
<pulse-player variant="midnight" ambient-eq resizable></pulse-player>
<pulse-fab variant="vinyl" pulso draggable show-menu></pulse-fab>
```

### Angular 17+ standalone

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { PulseModule } from '@pulse-music/angular'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PulseModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<pulse-player variant="midnight" [attr.ambient-eq]="true"></pulse-player>`,
})
export class AppComponent {}
```

## Running a Vue example locally

```bash
cd examples/01-vite-spa
npm install
npm run dev   # → http://localhost:5175
```

The example reads its components from `../../src/lib/` so you can edit the library and see the change live in the example tab.

## What each example is *not*

These are integration sketches, not production templates. They skip:

- routing, persistence, SSR
- a real CI / lint / test pipeline (the main repo has those — the examples deliberately stay minimal)
- a custom design system (the components use the default themes)

If you want a production starter, fork the main repo instead — it ships the full quality gate (`npm run ci`), Husky pre-commit hooks, GitHub Actions matrix, Playwright visual regression, and Axe-core a11y workflow.

## Why three Vue examples + four `apps/` demos?

The `examples/` directory keeps **copy-paste-friendly** integration sketches: minimal Vite configs, no workspace dependency, one feature focus each.

The `apps/` directory hosts **workspace-aware** full demos that exercise the multi-framework architecture: they alias the local `@pulse-music/*` packages, share the `node_modules`, and serve as visual regression baselines.

Pick the right shape for your need: **examples** if you're learning the API, **apps** if you're contributing to the library.
