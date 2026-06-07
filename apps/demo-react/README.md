# `@pulse/demo-react` — React example

A Vite + React app that uses `@pulse/react`:

- `<PulsePlayer />` with a live variant picker
- `<PulseFab pulso />` floating button
- `usePulseAudio()` hook driving a Prev / Play / Next transport
- Live event log (every `onPlay`, `onPause`, `onTrackChange`, `onError`)

## Run locally

From the repo root after `npm install`:

```bash
npm run dev --workspace=@pulse/demo-react
# → http://localhost:5181
```

The Vite config aliases every `@pulse/*` package to the workspace TS source, so edits in `packages/*/src/` reflect immediately without rebuilding.

## Status

Reflects the current `@pulse/web-component` skeleton (~30 % of Vue v2.3.4 chrome): play / pause, title, cover, progress, 8 mood variants, ambient EQ, pulso heartbeat, container-aware `--pulse-scale`. Drag-to-resize, three responsive states, social icons, prev / next on the inline card, FAB drag etc. ship in later alphas. See [`docs/frameworks/web-component.md`](../../docs/frameworks/web-component.md) for the honest parity matrix.
