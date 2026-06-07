# `@pulse-music/demo-svelte` — Svelte 5 example

A Vite + Svelte 5 app that uses `@pulse-music/svelte`:

- `<pulse-player>` Custom Element directly in the template (no Svelte component wrapper needed)
- `<pulse-fab pulso>` floating button
- `usePulseAudio()` Svelte classic-store + `$store` autosubscribe
- Live event log via `onpulse-play` / `onpulse-pause` / `onpulse-trackchange`
- Variant picker

## Run locally

From the repo root after `npm install`:

```bash
npm run dev --workspace=@pulse-music/demo-svelte
# → http://localhost:5182
```

The Vite config aliases every `@pulse-music/*` package to the workspace TS source.

## Status

Reflects the current `@pulse-music/web-component` chrome (~60 %): play / pause / cover / progress / 8 variants / ambient EQ / pulso / `--pulse-scale` ResizeObserver / 3 responsive states / prev / next / social icons / mp__bg blur backdrop / mp__noise SVG filter / data-fab override / drag-to-resize handle (when `resizable`) / FAB drag-to-reposition (when `draggable`). See [`docs/frameworks/web-component.md`](../../docs/frameworks/web-component.md) for the honest parity matrix vs Vue v2.3.4.
