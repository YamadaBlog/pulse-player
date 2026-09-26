# Troubleshooting

### Nothing plays and I get `pulse-error` with `play-rejected`

The browser's autoplay policy refused `play()` because it wasn't triggered by a user gesture. Start playback from a click or key press (the built-in buttons do). The player rolls back to paused on its own.

### `media-error` / the track never loads

The source failed to load or decode: check the URL (and the base path of your deployment), the server's `Content-Type`, and that the format is supported by the browser. MP3 and AAC are universally supported; WebM/Opus is not supported by every Safari version.

### The visualiser moves but doesn't follow the music

The source is cross-origin and wasn't declared CORS-enabled, so the engine plays it without routing it through Web Audio (otherwise it would be silent) and synthesises the motion. If your audio host sends `Access-Control-Allow-Origin`, create the engine with `crossOrigin: 'anonymous'`:

```js
setSharedEngine(new PulseEngine({ tracks, crossOrigin: 'anonymous' }))
```

### The cover's accent colour isn't sampled on `variant="auto"`

Same cause: a cross-origin cover without CORS can't be read by a canvas. Serve covers with CORS, host them on your origin, or set `accent-color`.

### The player collapses to nothing in a flex or grid layout

`<pulse-player>` is a size container and doesn't size itself from its content. Give it a width (`width: 100%`, `flex: 1`, a grid track…).

### Several players play different things

They are probably bound to different sessions or engines. Players with the same `session` (default `'default'`) share one audio element.

### `customElements.define` errors about `pulse-player`

Another library registered the same tag. Pulse itself never throws on double registration.

### Hydration warnings in SSR frameworks

The elements render their shadow DOM on the client. Keep them out of server-only components (`'use client'` in Next.js, `<ClientOnly>` is not required in Nuxt but avoids a flash). See the [integration guides](./integrations/README.md).
