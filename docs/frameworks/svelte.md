# Pulse for Svelte (`@pulse-music/svelte`)

Svelte 5 wrapper. Plain TypeScript hook + native `<pulse-player>` / `<pulse-fab>` usage.

> ✅ **Honest status (v3.0.0-alpha.10):** `usePulseAudio()` is shipped as a plain TypeScript hook (no runes, no Svelte compiler dependency) and **tested via Vitest (8 / 8)**. The Custom Elements (`<pulse-player>`, `<pulse-fab>`) work directly in Svelte templates — no SFC wrapper needed. Chrome parity vs Vue v2.3.4 is **~95 %**. A real Vite + Svelte 5 demo runs at `apps/demo-svelte/` — `npm run dev --workspace=@pulse-music/demo-svelte` → http://localhost:5182.

## Install

```bash
npm install @pulse-music/svelte
# Peer dep: svelte ^5
```

`@pulse-music/svelte` side-effect-imports `@pulse-music/web-component`, which registers `<pulse-player>` and `<pulse-fab>` Custom Elements globally.

## Quick start

```svelte
<script lang="ts">
  import { usePulseAudio } from '@pulse-music/svelte'

  const audio = usePulseAudio()
</script>

<pulse-player
  variant="midnight"
  ambient-eq
  resizable
  github-url="https://github.com/YamadaBlog/pulse-player"
  spotify-url="https://open.spotify.com/"
  onpulse-play={(e) => console.log('▶', e.detail.track.title)}
></pulse-player>

<pulse-fab variant="vinyl" pulso draggable show-menu></pulse-fab>

<button onclick={audio.toggle}>{$audio.isPlaying ? '⏸' : '▶'}</button>
<p>{$audio.track.title} · {audio.fmt($audio.currentTime)}</p>
```

The `$audio` prefix is Svelte's classic-store autosubscribe — it works because `usePulseAudio()` returns an object with a `subscribe(callback)` method. Svelte 4 + 5 both honour the contract.

## Why no `<PulsePlayer />` Svelte component?

Svelte's DOM-first philosophy means Custom Elements work **directly** in any template. A Svelte component wrapping `<pulse-player>` would be a one-line passthrough without DX gain, and would force a Svelte build step in the published `@pulse-music/svelte` tarball.

The plain-TypeScript hook + `<pulse-player>` direct usage is the idiomatic Svelte pattern: write less Svelte-specific code, keep the engine reusable across frameworks.

## `usePulseAudio()` API

```ts
const audio = usePulseAudio()
```

Returns a Svelte classic-store + an action surface:

| Member                                           | Type                        | Meaning                                                                           |
| ------------------------------------------------ | --------------------------- | --------------------------------------------------------------------------------- |
| `subscribe(run)`                                 | `(snapshot) => Unsubscribe` | Svelte contract — fires snapshot synchronously on subscribe, then on every change |
| `engine`                                         | `PulseEngine`               | Escape hatch for advanced consumers                                               |
| `toggle()`, `next()`, `prev()`, `seek(fraction)` | actions                     | Same as the React hook                                                            |
| `setAudioTracks(tracks)`, `setAmbientEq(on)`     | actions                     | Configuration                                                                     |
| `fmt(seconds)`                                   | `(number) => string`        | Format `0:42` style                                                               |

Snapshot shape (what `subscribe` delivers, what `$audio.X` reads):

```ts
{
  // Engine state
  currentTrack, isPlaying, currentTime, duration,
  isVisible, hasBeenOpened, ambientEq,
  playCount, pauseCount, trackChangeCount,
  // Derived
  track,    // current Track (clamped to a valid index)
  progress, // 0..100 percentage
}
```

## Event handling

Svelte 5 supports both the legacy `on:pulse-play` syntax and the new property-style `onpulse-play={…}` form. Use whichever your project standardises on:

```svelte
<!-- Svelte 5 property syntax (preferred) -->
<pulse-player onpulse-play={(e) => …}></pulse-player>

<!-- Legacy directive syntax (still works) -->
<pulse-player on:pulse-play={(e) => …}></pulse-player>
```

The `e.detail` payload mirrors the typed `EventMap` from `@pulse-music/types`:

```ts
import type { EventMap } from '@pulse-music/svelte'
function handlePlay(e: CustomEvent<EventMap['play']>) {
  const { track, time } = e.detail
}
```

## Re-exports

For consumers that want to pull everything from one import:

```ts
import {
  usePulseAudio,
  PulseEngine,
  getSharedEngine,
  setSharedEngine,
  ALL_VARIANTS,
  type Track,
  type PulseVariant,
  type EventMap,
  type PulseState,
} from '@pulse-music/svelte'
```

## Keyboard shortcuts

`<pulse-player>` exposes `Space`/`K` (toggle), `J`/`←` (prev), `L`/`→` (next) when it has focus. The host element is `tabIndex="0"` by default — set `tabindex="-1"` on the tag to skip it in the tab order.

## License

MIT.

## See also

- [`docs/frameworks/web-component.md`](./web-component.md) — Custom Element API + browser support
- [`docs/universal/ARCHITECTURE.md`](../universal/ARCHITECTURE.md) — multi-framework architecture
