# 02 — Custom playlist + custom controls

Two things this example shows:

1. **Replace the default playlist** at boot time with `setAudioTracks()`.
2. **Build your own controls** by reading and calling the store
   directly — the bundled `<MusicPlayer />` is just one possible UI.

## Run

```bash
npm install
npm run dev   # http://localhost:5176
```

## Key files

- [`src/main.ts`](./src/main.ts) — calls `setAudioTracks(myList)` BEFORE
  the app mounts. Order matters: `setAudioTracks` mutates the
  module-level track list that the store closes over at first read.
- [`src/App.vue`](./src/App.vue) — renders a header strip with a custom
  play / pause button, a track title, a scrub bar bound to
  `store.progress`, and prev / next buttons calling `store.prev / next`.

The store API is described in [`docs/API.md`](../../docs/API.md).
