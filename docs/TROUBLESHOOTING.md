# Troubleshooting

Solutions to the situations integrators run into most often. If your problem isn't here, open an [issue](https://github.com/YamadaBlog/pulse-player/issues/new/choose) — and please paste the relevant browser console output.

## Playback

### `audio.play()` is rejected — the FAB shows "pause" but nothing plays

This is the browser's autoplay policy at work. `audio.play()` rejects when there's no user gesture, or when the gesture was consumed by another element. Since v2.0.0 pulse-player handles this for you:

- `isPlaying` is rolled back to `false`.
- An `'error'` event fires with `reason: 'play-rejected'` and the raw rejection as `detail`.

To diagnose:

```ts
store.subscribe('error', ({ reason, detail }) => {
  if (reason === 'play-rejected') {
    console.warn('Autoplay rejected:', detail)
  }
})
```

Most common causes: trying to start playback on page load (no gesture yet), starting playback from `setTimeout` or `setInterval` (gesture has expired), running inside a cross-origin iframe with `allow="autoplay"` missing.

### Track 404s silently

The `<audio>` element's `error` event is wired to the store's `'error'` event since v2.0.0. Subscribe to it:

```ts
store.subscribe('error', ({ reason, detail }) => {
  if (reason === 'media-error') {
    // detail is a MediaError — code 4 = MEDIA_ERR_SRC_NOT_SUPPORTED
    console.error('Track failed to load:', detail)
  }
})
```

If you're loading tracks from a different origin, ensure CORS is correct on the audio server.

### The EQ bars don't move

Two distinct conditions both produce this symptom:

1. **No `AudioContext`.** Wrapped in `try / catch` — falls back silently. Causes: very old Safari (< 14.1, before `webkitAudioContext` was wired), insecure context (`http://` on non-localhost). The bars stay flat; audio still plays.
2. **Cross-origin audio without CORS.** `MediaElementAudioSourceNode` requires `Access-Control-Allow-Origin`. Either serve the audio with permissive CORS or host it on the same origin.

You can verify which by:

```ts
import { useAudioStore } from 'pulse-player'
const store = useAudioStore()
store.toggle()
console.log('eqBars after play:', store.eqBars.value)
// → all zeros for case (1) or (2); non-zero values mean the analyser is working
```

## Resize

### The inline player flashes wrong dimensions on first paint

If you SSR (Nuxt, Vite SSG, …), the `ResizeObserver` only runs after the client mounts. The default container width is 360 px, so the player renders in the "full" responsive state until the RO fires. If your container is narrower, you'll see a brief layout flash before it switches to narrow / compact / FAB mode.

Workaround: render the player inside a wrapper with an explicit `min-width` matching your real container, or hold the player behind `v-if="mounted"` (`const mounted = ref(false); onMounted(() => (mounted.value = true))`).

### Drag-to-resize doesn't work on touch

Make sure no parent has `touch-action: none` that swallows the pointer events. The component itself sets `touch-action: none` on the FAB and the resize handle — that's enough for the gesture to reach the component.

## Themes

### `accentColor` doesn't change the EQ bars

By design — the EQ bars are locked to Spotify green (`#1DB954`) for brand consistency. `accentColor` controls the progress hover, focus ring, and the FAB ring. If you want a different EQ colour, edit the `--bar-c` HSL sweep in `MusicPlayer.vue` (look for `AMBIENT_BAR_STYLES`).

### `variant="transparent"` shows a dark backdrop

The `transparent` variant ships with a subtle radial gradient + noise overlay so it stays readable on light backgrounds. If you want true transparency, write `:custom-background="transparent"` with `variant="custom"`.

## FAB

### The FAB position doesn't persist across reloads

It does, via `localStorage`. The default key is `pulse-player-fab-pos`. Things that can stop it:

- You're in private browsing — localStorage may quota-out.
- You passed `persist-key=""` (empty string) which deliberately disables persistence.
- The saved position would land off-screen (window shrunk). The FAB snaps back to the bottom-right corner and persists the new `{ 0, 0 }` value.

### The radial menu opens by accident

The long-press threshold is 500 ms with a 10-px movement tolerance. If your users complain, you can fork `MiniPlayer.vue` and tune those two constants — they're not currently exposed as props because changing them changes the feel of the FAB.

## Bundle / build

### `npm install pulse-player` brought in 8 MB of audio

You're on a version older than v2.1.0. Update — v2.1.0 sets `publicDir: false` in lib mode so the demo audio doesn't leak into the published tarball. The current package is **71 kB total**.

### `import { useDemoTour } from 'pulse-player'` no longer works

It was retired from the public API in v2.0.0 (it's a demo-page helper, not a library primitive). If you need it, import directly from the repo's source via your build's path mapping, or copy it into your app.

## SSR

### Hydration mismatch on the FAB

The FAB uses `<Teleport to="body">`, which is client-only by definition. Vue should warn but not crash. If it does crash, wrap `<MiniPlayer />` in `<ClientOnly>` (Nuxt) or guard with `v-if="mounted"`.

## Performance

### Frame drops on a long page with many `<MusicPlayer />` instances

The compositor budget on integrated GPUs caps out around 300 active animations. With 15 inline players each carrying 12 ambient bars (180 animations), you're well under. If you go beyond 25 visible instances with `ambientEq` on, disable it on the instances that don't need to draw attention.

### CPU stays elevated after the user navigates away from playback

Call `store.dispose()` from `onBeforeUnmount` (or your HMR teardown) to close the `AudioContext`, drop every listener, and clear the event-bus map. The next `toggle()` rebuilds the audio graph from scratch.

## Tests

### `vitest` complains about `AudioContext is not defined`

The test environment needs the same stubs `tests/setup.ts` registers. If you're testing your own integration, copy the stubs (or import `pulse-player/tests/setup` if we expose it in a future release).

## Reporting an issue

Before opening an issue, please confirm:

- pulse-player version (`npm ls pulse-player`)
- Vue version and Pinia version
- Browser + OS
- A minimal reproduction (CodeSandbox, StackBlitz, or steps against the bundled demo)

The bug-report template prompts for all of this.
