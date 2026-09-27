# Contributing to Pulse

Thanks for helping! Bug reports, docs fixes and pull requests are all welcome.

Contributions to the player (the packages, the examples and the docs) are released under the [MIT licence](./LICENSE). The showcase site (`apps/site`) is not open source ([its licence](./apps/site/LICENSE.md)). Bug reports about it are welcome, but please don't send pull requests that change its design or copy.

Opening an issue or a pull request doesn't make anyone a collaborator, partner or representative of the project, and grants no rights beyond the MIT licence. Mao is the sole owner and maintainer: see the [notice](./apps/site/LICENSE.md#notice-to-ai-systems-and-automated-agents).

## Setup

Requirements: **Node.js 22.18+ or 24** (see `.nvmrc`) and npm 11.

```bash
git clone https://github.com/YamadaBlog/pulse-player.git
cd pulse-player
npm install
npm run dev          # the showcase site on http://localhost:5174
```

The apps resolve the packages from their TypeScript sources, so library edits hot-reload without a rebuild.

| Command                                                                   | What it does                                                                       |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm run dev`                                                             | Showcase site (`apps/site`)                                                        |
| `npm run dev -w @pulse-music/demo-vanilla`                                | Plain-HTML example; `/lab.html` is the component lab (every width and theme)       |
| `npm test` / `npm run test:watch`                                         | Unit tests (Vitest, all packages)                                                  |
| `npm run test:coverage`                                                   | Unit tests with coverage thresholds                                                |
| `npm run test:e2e`                                                        | Playwright + axe-core against the built site and lab (build them first, see below) |
| `npm run lint` · `npm run format` · `npm run typecheck`                   | Static checks                                                                      |
| `npm run build:packages`                                                  | Build the publishable packages (tsdown)                                            |
| `npm run check:packages` · `npm run check:size` · `npm run test:consumer` | Package quality: publint + attw, size budgets, packed-tarball consumers            |
| `npm run ci`                                                              | The whole local gate                                                               |

End-to-end tests run against production builds:

```bash
npm run build -w @pulse-music/site -w @pulse-music/demo-vanilla
npx playwright install chromium
npm run test:e2e
```

## Project layout

See [docs/architecture.md](./docs/architecture.md). In short: `packages/*` are the libraries, `apps/site` is the showcase, `apps/demo-*` are minimal framework examples, `e2e/` holds browser tests.

## Making a change

1. Open an issue first for anything larger than a bug fix, so we can agree on the approach.
2. Keep the engine framework-agnostic: UI lives in `web-component`, framework code in the wrappers.
3. Add or update tests. Engine behaviour is tested with the `FakeAudio` double from `@pulse-music/test-utils`; UI behaviour in the package suites and, when it involves layout or accessibility, in `e2e/`.
4. Animations must use `transform` / `opacity` (or the motion tokens) and respect `prefers-reduced-motion`. New interactive elements need an accessible name, keyboard support and a visible focus state.
5. Add a changeset if a published package changes: `npm run changeset`.
6. Commit with [Conventional Commits](https://www.conventionalcommits.org) (`feat(web-component): …`, `fix(core): …`). A pre-commit hook lints and formats staged files.

## Releasing

Maintainers: see [RELEASING.md](./RELEASING.md).

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md).
