/**
 * useAutoFab — two opt-in FAB visibility modes, built ENTIRELY on the
 * public store API (`useAudioStore` → `open()` + the writable
 * `isVisible` ref). It does NOT touch the byte-identical-locked
 * `src/lib/` components, so it ships without bumping the library.
 *
 * The library's own rule is: the floating FAB (`<MiniPlayer>`) renders
 * while `store.isVisible === true`, which the engine flips on when
 * playback starts or `store.open()` is called — never from scroll
 * position or route changes. These two helpers add exactly those
 * behaviours on top.
 *
 *   1. useAutoFab(playerRef) — scroll mode. When the inline
 *      `<MusicPlayer>` leaves the viewport, surface the FAB; when it
 *      scrolls back into view, hide the FAB *without pausing* (it
 *      writes `isVisible = false` directly — `store.close()` would
 *      stop playback, which is not what you want here).
 *
 *   2. showFabOnRouteChange() — route mode (opt-in). Returns a callback
 *      to wire into your router (`router.afterEach(...)`) so navigating
 *      surfaces the FAB. Opt-in by definition: nothing happens unless
 *      you choose to connect it.
 *
 * Both are demo/app composables — copy them into your own project, or
 * import from here if you vendor the repo.
 */

import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { useAudioStore } from '../lib'

export interface AutoFabOptions {
  /** Observer margin around the root (default `'0px'`). Use e.g.
   *  `'-80px 0px'` to flip a little before the player fully leaves. */
  rootMargin?: string
  /** Intersection ratio at/below which the player counts as "gone"
   *  (default `0` — any sliver visible keeps the FAB hidden). */
  threshold?: number
  /** Only surface the FAB once the user has started playback at least
   *  once (`store.hasBeenOpened`). Default `false` — the FAB appears as
   *  a "jump back to the player" affordance even before first play. */
  requirePlayback?: boolean
}

/**
 * Scroll mode. Observe the inline player element; show the FAB when it
 * is out of view, hide it (keep playing) when it returns.
 * Returns a disposer (also auto-disposed on unmount).
 */
export function useAutoFab(target: Ref<HTMLElement | null>, opts: AutoFabOptions = {}): () => void {
  const store = useAudioStore()
  const threshold = opts.threshold ?? 0
  let io: IntersectionObserver | null = null

  const dispose = () => {
    io?.disconnect()
    io = null
  }

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') return // SSR / unsupported
    const el = target.value
    if (!el) return
    io = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting && entry.intersectionRatio > threshold
        if (inView) {
          // Back in view → hide the FAB but DON'T stop playback.
          store.isVisible = false
        } else if (!opts.requirePlayback || store.hasBeenOpened) {
          // Scrolled away → surface the FAB.
          store.open()
        }
      },
      { rootMargin: opts.rootMargin ?? '0px', threshold },
    )
    io.observe(el)
  })

  onBeforeUnmount(dispose)
  return dispose
}

/**
 * Route mode (opt-in). Returns a callback to drop into your router's
 * post-navigation hook. Example (vue-router):
 *
 *   const onRoute = showFabOnRouteChange()
 *   router.afterEach(() => onRoute())
 *
 * By default it only surfaces the FAB once playback has started, so a
 * fresh session that never touched the player stays clean. Pass
 * `{ always: true }` to surface it on every navigation regardless.
 */
export function showFabOnRouteChange(opts: { always?: boolean } = {}): () => void {
  const store = useAudioStore()
  return () => {
    if (opts.always || store.hasBeenOpened) store.open()
  }
}
