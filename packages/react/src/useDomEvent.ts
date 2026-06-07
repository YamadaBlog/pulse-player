import { useEffect, type RefObject } from 'react'

/**
 * `useDomEvent` — attach a typed DOM `CustomEvent` listener to a
 * React `ref` and clean it up on unmount or when the handler changes.
 *
 * Before this hook existed, `<PulsePlayer />` and `<PulseFab />`
 * each carried 4 nearly-identical `useEffect` blocks (one per
 * `onPlay` / `onPause` / `onTrackChange` / `onError` prop). 8 copies
 * total. The pattern is exactly the same — only the event name and
 * the handler differ.
 *
 * Usage:
 *
 * ```tsx
 * const ref = useRef<HTMLElement>(null)
 * useDomEvent(ref, 'pulse-play', onPlay)
 * useDomEvent(ref, 'pulse-pause', onPause)
 * ```
 *
 * Type parameter `T` is the `detail` payload shape — the handler
 * receives `T` directly, not the `CustomEvent` wrapper.
 *
 * If `handler` is `undefined`, no listener is attached (idiomatic
 * for React's optional `on{Event}` props).
 */
export function useDomEvent<T>(
  ref: RefObject<HTMLElement>,
  eventName: string,
  handler: ((detail: T) => void) | undefined,
): void {
  useEffect(() => {
    const el = ref.current
    if (!el || !handler) return
    const listener = (e: Event) => handler((e as CustomEvent<T>).detail)
    el.addEventListener(eventName, listener)
    return () => el.removeEventListener(eventName, listener)
  }, [ref, eventName, handler])
}
