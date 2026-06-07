# 01 — Vite SPA (minimum drop-in)

The smallest possible integration: one inline `<MusicPlayer />` in the
hero, a persistent `<MiniPlayer />` at the root of the app, and Pinia
plumbing.

## Run

```bash
npm install
npm run dev   # http://localhost:5175
```

## What it shows

- The two components are framework-agnostic in terms of styling — they
  inherit the page's variant via the `variant` prop, no CSS work needed.
- The `<MiniPlayer />` mounts at the root and survives every route
  change (try the demo "Other page" link).
- Pinia is the only setup step beyond the imports.

## Files

```
src/
├── App.vue          # <RouterView /> + <MiniPlayer /> at root
├── main.ts          # createApp + createPinia + register router
├── pages/
│   ├── Home.vue     # <MusicPlayer variant="midnight" />
│   └── Other.vue    # proof FAB persists across routes
└── router.ts
```
