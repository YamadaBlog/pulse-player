/**
 * Page lifecycle for Astro's client router: module scripts run once, but
 * pages are swapped in and out. Features register a setup that runs on
 * every page load and returns its own cleanup, run before the next swap.
 */
type Cleanup = () => void

export function onPage(setup: () => Cleanup | void): void {
  let cleanup: Cleanup | void
  document.addEventListener('astro:page-load', () => {
    cleanup = setup()
  })
  document.addEventListener('astro:before-swap', () => {
    cleanup?.()
    cleanup = undefined
  })
}

const reducedQuery =
  typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null

export const reducedMotion = (): boolean => !!reducedQuery?.matches

export function onReducedMotionChange(fn: (reduced: boolean) => void): Cleanup {
  const handler = (e: MediaQueryListEvent): void => fn(e.matches)
  reducedQuery?.addEventListener('change', handler)
  return () => reducedQuery?.removeEventListener('change', handler)
}

/** Run `fn` while `el` is on screen; stop it when it leaves. */
export function whileVisible(el: Element, start: () => Cleanup, margin = '0px'): Cleanup {
  let stop: Cleanup | null = null
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting && !stop) stop = start()
      else if (!entry?.isIntersecting && stop) {
        stop()
        stop = null
      }
    },
    { rootMargin: margin },
  )
  io.observe(el)
  return () => {
    io.disconnect()
    stop?.()
  }
}

/**
 * Set an element's text only if it differs. Writing text — even the same
 * text — invalidates layout; per-frame writers (timecodes, tickers, the
 * cursor tag) would otherwise force a layout on every frame.
 */
export function setText(el: Element | null | undefined, text: string): void {
  if (el && el.textContent !== text) el.textContent = text
}

export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel)
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel))
