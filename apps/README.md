# Apps

| App                                        | What it is                                                                                                                                                                          | Run                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [`site`](./site)                           | The showcase deployed to [GitHub Pages](https://yamadablog.github.io/pulse-player/). Astro (static), the web component, raw WebGL2; the mixing desk is a `@pulse-music/vue` island. | `npm run dev`                              |
| [`demo-vanilla`](./demo-vanilla)           | Plain HTML with `<pulse-track>` markup. `lab.html` renders every width and theme — it is also the fixture for the component e2e tests.                                              | `npm run dev -w @pulse-music/demo-vanilla` |
| [`demo-react`](./demo-react)               | Minimal React 19 app: `<PulsePlayer />`, `<PulseFab />`, `usePulseAudio()`.                                                                                                         | `npm run dev -w @pulse-music/demo-react`   |
| [`demo-svelte`](./demo-svelte)             | Minimal Svelte 5 app: native elements and the `$audio` store.                                                                                                                       | `npm run dev -w @pulse-music/demo-svelte`  |
| [`demo-react-native`](./demo-react-native) | Expo app for the experimental native renderer (installs separately).                                                                                                                | see its README                             |

The web apps resolve the packages from their TypeScript sources (`workspace-aliases.ts`), so library edits hot-reload. They share the demo media from `site/public` and the playlist from `shared-tracks.ts`.
