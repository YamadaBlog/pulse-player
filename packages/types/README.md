# @pulse-music/types

Shared TypeScript types for every pulse-player framework wrapper.

## What's in here

- `Track` — the playlist entry shape
- `PulseVariant` + `ALL_VARIANTS` — the canonical theme union
- `EventMap` — discriminated union for the event bus
- `AudioEvent`, `EventListener<E>`, `Unsubscribe` — pub/sub helpers
- `PulseState` — the projection every wrapper turns into framework primitives (Vue refs, React state, RN reanimated values, …)

## Install

This package is a workspace dependency. Inside this monorepo:

```bash
# Already linked via pnpm/npm workspaces. No install step needed.
```

Once published to npm:

```bash
npm install @pulse-music/types
# or
pnpm add @pulse-music/types
```

## Why

The audio engine, the renderers and the framework wrappers all need to talk about the same shapes. Putting the types in one zero-runtime package makes drift impossible — touch a field here and TypeScript fails everywhere it's used.

## Status

✅ **Published shape** — these types are the stable contract that every other `@pulse-music/*` package depends on. Breaking changes here will bump the monorepo major.

## License

MIT. See [LICENSE](../../LICENSE) at the repo root.
