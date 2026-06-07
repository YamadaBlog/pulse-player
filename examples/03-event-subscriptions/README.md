# 03 — Event subscriptions + per-session counters

How to plug your analytics layer into pulse-player without bloating
the library: the store exposes an opt-in event bus and three local
counters, and nothing more.

## Run

```bash
npm install
npm run dev   # http://localhost:5177
```

## Key files

- [`src/App.vue`](./src/App.vue) — registers four typed listeners
  (`'play'`, `'pause'`, `'trackchange'`, `'error'`) and renders the
  three privacy-friendly counters.

## What the event bus is *not*

- **Not enabled by default.** Default behaviour: zero listeners,
  zero side effects, zero network. You opt in by calling
  `store.subscribe(event, callback)`.
- **Not a tracking SDK.** The store never opens a socket, never reads
  identifiers off `navigator`, never adds a query string to any URL.
  The callbacks are yours — pipe them wherever you want.
- **Not a global state store.** It's a typed pub/sub for the four
  audio-life events listed below.

## Payload shapes

```ts
type EventMap = {
  play:        { track: Track; time: number }
  pause:       { track: Track; time: number }
  trackchange: { from: number; to: number; track: Track }
  error:       { track: Track; reason: 'play-rejected' | 'media-error' | 'stalled'; detail?: unknown }
}
```

`store.subscribe<E>(event, cb)` narrows `cb`'s payload to
`EventMap[E]` at the callsite — no `as` casts needed.
