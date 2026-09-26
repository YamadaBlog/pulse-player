const QUERY = '(prefers-reduced-motion: reduce)'

/** Whether the user asked the OS for reduced motion (read live, never cached). */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia(QUERY).matches
}

/** Call `listener` whenever the reduced-motion preference changes. */
export function onReducedMotionChange(listener: (reduced: boolean) => void): () => void {
  if (typeof matchMedia !== 'function') return () => undefined
  const mql = matchMedia(QUERY)
  const handler = (e: MediaQueryListEvent): void => listener(e.matches)
  mql.addEventListener?.('change', handler)
  return () => mql.removeEventListener?.('change', handler)
}

let registered = false

/**
 * Register the animatable colour property used for smooth accent
 * transitions. `@property` rules are ignored inside shadow roots, so
 * this has to go through the JS API, once per document.
 */
export function registerAnimatableAccent(): void {
  if (registered || typeof CSS === 'undefined' || !('registerProperty' in CSS)) return
  registered = true
  try {
    CSS.registerProperty({
      name: '--pulse-live-accent',
      syntax: '<color>',
      inherits: true,
      initialValue: '#3dbda7',
    })
  } catch {
    /* already registered by another copy of the package */
  }
}
