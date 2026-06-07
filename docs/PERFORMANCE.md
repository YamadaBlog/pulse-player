# Performance

A walk through where pulse-player spends compute and how to keep it cheap when integrating. Everything here is measured against real builds, not theory.

## Bundle size

| Build               | Files                                                                                              | Total gzip |
| ------------------- | -------------------------------------------------------------------------------------------------- | ---------- |
| Library (published) | `pulse-player.es.js` (8.8 kB) + `pulse-player.css` (4.8 kB)                                        | **~14 kB** |
| Library + CJS       | + `pulse-player.cjs.js` (7.4 kB)                                                                   | ~21 kB     |
| Demo (`dist/`)      | App + components + demo tour + tests harness CSS — bundled for the live preview, not for consumers | ~47 kB     |
| npm tarball         | source + built lib + docs                                                                          | **71 kB**  |

Vue, Pinia and `lucide-vue-next` are **peer dependencies** — they're not in the gzip totals above. Consumers ship their own copies.

## Runtime cost map

| Hot path                                           | What it costs per frame                                                                                                                                                                                                                                                            |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audio FFT loop (when playing)                      | One `AnalyserNode.getByteFrequencyData` call, four index reads into a `Uint8Array`, one `triggerRef(eqBars)`. Vue rebroadcasts to every `<MusicPlayer />` and the `<MiniPlayer />` — four `--bar-y` style writes per subscriber. 60 fps. **0 allocations.**                        |
| Ambient EQ (when `store.ambientEq=true` + playing) | Zero JS per frame since v1.0.2 — the bars cycle on a shared CSS `@keyframes` animation that's composited on the GPU. 12 bars per instance, 2.6 s cycle, one `transform: translateZ(0)` per `.mp__ambient` container groups everything into a single compositor layer per instance. |
| Pulso heartbeat (when `pulso=true` + playing)      | Two CSS `@keyframes` (the button scale and the two `::before / ::after` waves). Pure compositor work. **0 JS per frame.**                                                                                                                                                          |
| Drag (FAB or resize handle)                        | One Vue ref write per `pointermove` (~60 fps). The actual position update is a single `transform: translate(...)` — composited.                                                                                                                                                    |
| `ResizeObserver` callback                          | One `--pulse-scale` style write per RO entry. The browser throttles RO firings, so this is usually <60/sec.                                                                                                                                                                        |

## Where the heaviest CSS lives

| Property                  | Where                                                                | When it costs                                                          |
| ------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `filter: blur(40px)`      | `.mp__bg` (auto variant cover backdrop)                              | Continuous repaint while the cover image is rendered                   |
| `filter: blur(22px)`      | `.mp__fab-bg` (FAB-mode backdrop)                                    | Only while the inline player is in FAB mode                            |
| `backdrop-filter: blur()` | `.fab__btn` (14 px on transparent variant), `.fab__menu-btn` (16 px) | Continuous while the FAB is visible (low-tier mobile feels this)       |
| Multi-layer `box-shadow`  | `.fab__btn` + per-variant glow shadows                               | Repaint on hover / variant change — heaviest single CSS hit on the FAB |

If you target very low-tier devices and the FAB feels heavy: replace `variant="transparent"` with `variant="solid"` (drops the `backdrop-filter` 14 px) and skip `pulso=true`.

## Integration guidelines

### One instance is genuinely free

Everything above is measured assuming **one** inline player and **one** FAB. That's the typical integration. On a normal app you don't think about pulse-player's perf.

### Many instances on the same page

The demo page on this repo mounts 15 `<MusicPlayer />` instances side-by-side to stress-test the responsive system. We measure the resulting compositor load and tune the ambient EQ + thresholds to stay under ~300 active CSS animations on integrated GPUs. The demo is the worst case; production is two orders of magnitude lighter.

If you're considering more than 25 visible instances at once: disable `ambientEq` on the ones that aren't the primary focus.

### Memory

Pulse keeps three references alive forever in the default config: the `<audio>` element, the `AudioContext`, the `AnalyserNode`. That's a few hundred bytes plus whatever the browser's audio subsystem holds (it doesn't show up in Vue's heap snapshot).

If you destroy and recreate the Vue app (browser extension popup, HMR, embedded micro-frontend), call `store.dispose()` from your teardown hook so those references are released cleanly:

```ts
import { onBeforeUnmount } from 'vue'
const store = useAudioStore()
onBeforeUnmount(() => store.dispose())
```

### `prefers-reduced-motion`

When the user's OS reports `prefers-reduced-motion: reduce`:

- The ambient EQ is hidden entirely (`display: none`).
- The pulso heartbeat and waves freeze at scale 1.
- Every transition on the player wrapper is disabled.
- The demo tour snaps every tween to its end value (no scroll-by animation).

This is honoured at the CSS layer (no JS branch), so the user pays the cost of one `prefers-reduced-motion` media query and nothing else.

## Benchmark recipes

### Measure your own integration

```ts
const FRAMES = 120
const start = performance.now()
let i = 0
function tick() {
  i++
  if (i < FRAMES) requestAnimationFrame(tick)
  else console.log('avg frame:', (performance.now() - start) / FRAMES, 'ms')
}
requestAnimationFrame(tick)
```

Run with audio playing and the ambient EQ on. If the average frame is > 17 ms, something on your page (not pulse-player) is contending with the main thread.

### See the compositor layers

In Chrome DevTools: `Cmd+Shift+P` → "Show layers" → toggle on. The ambient EQ should show one layer per `.mp__ambient` container, not one per bar.

## Known limits

- The `filter: blur(40px)` on the `auto` cover backdrop is the single most expensive declaration in the library. If you target Android entry-level devices and ship the auto variant in production, consider switching to `variant="solid"` or `variant="dark"`.
- The FAB radial menu's `backdrop-filter: blur(16px)` adds a noticeable repaint when the menu opens on integrated GPUs. The menu is transient (300 ms), so it's usually unproblematic.
- The 4-bar focal FFT loop runs at 60 fps. We have not added a 30 fps mode because the four `--bar-y` writes are too cheap to be worth the API surface, but if you're profiling and see them as a hot spot, raise an issue.

## What's not measured here

- **Network.** The library makes zero network calls in the default code path. The demo audio under `public/audio/` is fetched by the `<audio>` element; that's whatever your hosting decides.
- **Memory growth over hours.** The shallowRef + triggerRef pattern is zero-alloc; the rAF chain is cancellable; listeners on the `<audio>` element are bounded. We have not run a 24-hour leak test in CI — if you do and find a leak, open an issue with the snapshot.
