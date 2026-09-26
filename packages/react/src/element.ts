import { useEffect, useLayoutEffect, useRef } from 'react'

// `useLayoutEffect` warns during SSR; properties only matter in the browser.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type Element = (HTMLElement & Record<string, unknown>) | null

/**
 * Assign values as DOM *properties* (not attributes) so objects, arrays
 * and booleans reach the custom element intact — on React 18 and 19.
 */
export function useElementProperties(
  el: HTMLElement | null,
  properties: Record<string, unknown>,
): void {
  useIsomorphicLayoutEffect(() => {
    const target = el as Element
    if (!target) return
    for (const [key, value] of Object.entries(properties)) {
      // Writing DOM properties on the element is this effect's whole purpose.
      // eslint-disable-next-line react-hooks/immutability
      if (value !== undefined && target[key] !== value) target[key] = value
    }
  })
}

type Handlers = Record<string, ((detail: never) => void) | undefined>

/**
 * Forward `pulse-*` DOM events to callback props. Listeners are attached
 * once per element; the latest callbacks are read through a ref, so
 * inline arrow functions never cause re-subscriptions.
 */
export function useElementEvents(el: HTMLElement | null, handlers: Handlers): void {
  const latest = useRef(handlers)
  useIsomorphicLayoutEffect(() => {
    latest.current = handlers
  })
  useEffect(() => {
    if (!el) return
    const offs = Object.keys(latest.current).map((name) => {
      const listener = (e: Event): void =>
        latest.current[name]?.((e as CustomEvent).detail as never)
      el.addEventListener(name, listener)
      return () => el.removeEventListener(name, listener)
    })
    return () => offs.forEach((off) => off())
  }, [el])
}
