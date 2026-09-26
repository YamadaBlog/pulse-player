import { useEffect, useLayoutEffect, useRef } from 'react'

// `useLayoutEffect` warns during SSR; properties only matter in the browser.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type Target = HTMLElement & Record<string, unknown>

/**
 * Assign values as DOM *properties* (not attributes) so objects, arrays
 * and booleans reach the custom element intact — on React 18 and 19.
 *
 * When a prop goes back to `undefined`, the element's own default (read
 * before we first wrote the property) is restored instead of keeping the
 * last value.
 */
/* eslint-disable react-hooks/immutability -- writing DOM properties on the element is this hook's whole purpose */
export function useElementProperties(
  el: HTMLElement | null,
  properties: Record<string, unknown>,
): void {
  const defaults = useRef(new Map<string, unknown>())
  useIsomorphicLayoutEffect(() => {
    const target = el as Target | null
    if (!target) return
    for (const [key, value] of Object.entries(properties)) {
      const known = defaults.current.has(key)
      if (value === undefined) {
        if (known) target[key] = defaults.current.get(key)
        continue
      }
      if (!known) defaults.current.set(key, target[key])
      if (target[key] !== value) target[key] = value
    }
  })
}
/* eslint-enable react-hooks/immutability */

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
