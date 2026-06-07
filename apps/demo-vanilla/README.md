# `@pulse-music/demo-vanilla` — Web Component demo (no framework)

A single `index.html` that uses `<pulse-player>` and `<pulse-fab>` directly. Zero framework, zero bundler.

## Run locally

```bash
# From the repo root (after `npm install` + `npm run build:packages` so dist/ exists)
npx http-server apps/demo-vanilla -p 5180 -c-1
# → http://localhost:5180
```

The `<script type="module">` imports from the workspace package's built ESM bundle (`../../packages/web-component/dist/index.js`), so you need a build step once:

```bash
npm run build:packages
```

After that, refreshing the page picks up any new build.

## What it demonstrates

- Side-effect import registers `<pulse-player>` + `<pulse-fab>` Custom Elements.
- Variant picker switches the `variant` attribute on both elements.
- Both elements share the same singleton `PulseEngine` — toggling one toggles the other.
- DOM `CustomEvent`s (`pulse-play`, `pulse-pause`, `pulse-trackchange`, `pulse-error`) are forwarded into a live log.

## Status

Reflects the current `@pulse-music/web-component` skeleton — about 30 % of the Vue v2.3.4 chrome (play / pause, title, cover, progress, time, 8 variants, ambient EQ, pulso heartbeat). Drag-to-resize, three responsive states, social icons, prev / next, FAB drag etc. ship in later alphas. See [`docs/frameworks/web-component.md`](../../docs/frameworks/web-component.md) for the honest parity matrix.
