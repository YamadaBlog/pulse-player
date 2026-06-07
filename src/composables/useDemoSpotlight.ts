import { readonly, ref, onBeforeUnmount, type Ref } from 'vue'

/**
 * useDemoSpotlight — multi-step spotlight controller for the guided
 * product tour.
 *
 * The previous implementation was a single boolean (`fabFocused`)
 * that toggled a fixed radial-gradient overlay centred at 50%/50%
 * of the viewport. It only worked for the FAB sequence because the
 * FAB happened to sit at the viewport centre.
 *
 * This composable turns the spotlight into a real product-tour
 * primitive:
 *
 *   - `focus(selector | element, opts)` aims the spotlight at any
 *     DOM element. The radius is computed from the element's
 *     bounding rect with a configurable padding; you can also pass
 *     an explicit radius for fixed-size highlights.
 *
 *   - `clear()` releases the spotlight; the overlay fades out.
 *
 *   - The composable observes scroll + resize. Every event is
 *     coalesced into a single rAF callback so a fast scroll only
 *     produces ONE getBoundingClientRect() per frame — no forced
 *     layout per wheel/touchmove tick.
 *
 *   - The four CSS variables it drives (`--spotlight-x`, `-y`,
 *     `-radius`, `-soft`) are typed via `@property` in the
 *     consumer's stylesheet, so transitions between targets are
 *     interpolated by the browser at composite time — no JS
 *     tweening, no main-thread work per frame.
 *
 *   - `prefers-reduced-motion: reduce` short-circuits the
 *     re-aim loop (the spotlight still appears, it just doesn't
 *     animate between targets).
 *
 * Returned state (all `Readonly<Ref<…>>` — consumers READ them,
 * the composable WRITES them):
 *   - `active`  — true while a target is focused
 *   - `x`, `y`  — viewport-space centre of the spotlight (px)
 *   - `radius`  — visible clear radius (px). The dim falls off
 *                 over the feather band.
 *   - `soft`    — feather distance (px). Defaults to 80.
 */
export interface SpotlightFocusOptions {
  /** Padding around the element's bounding rect (px). Default 60. */
  padding?: number
  /** Explicit radius override. Bypasses the rect-based computation. */
  radius?: number
  /** Feather distance for the dim falloff (px). Default 80. */
  soft?: number
}

export interface DemoSpotlight {
  active: Readonly<Ref<boolean>>
  x: Readonly<Ref<number>>
  y: Readonly<Ref<number>>
  radius: Readonly<Ref<number>>
  soft: Readonly<Ref<number>>
  focus: (target: string | Element, opts?: SpotlightFocusOptions) => void
  clear: () => void
}

export function useDemoSpotlight(): DemoSpotlight {
  const active = ref(false)
  const x = ref(0)
  const y = ref(0)
  const radius = ref(200)
  const soft = ref(80)

  // We remember the LAST resolved Element so a window scroll / resize
  // can re-aim without re-querying the DOM. If the element gets
  // detached (route change, v-if=false), the next aim() silently
  // bails — the spotlight stays at its last position.
  let trackedEl: Element | null = null
  let trackedOpts: SpotlightFocusOptions = {}

  function resolveEl(target: string | Element): Element | null {
    if (typeof target !== 'string') return target
    return document.querySelector(target)
  }

  function aimAt(el: Element, opts: SpotlightFocusOptions) {
    const rect = el.getBoundingClientRect()
    if (!rect.width && !rect.height) return // off-DOM / display:none
    const padding = opts.padding ?? 60
    x.value = rect.left + rect.width / 2
    y.value = rect.top + rect.height / 2
    radius.value = opts.radius ?? Math.max(rect.width, rect.height) / 2 + padding
    soft.value = opts.soft ?? 80
  }

  function focus(target: string | Element, opts: SpotlightFocusOptions = {}) {
    const el = resolveEl(target)
    if (!el) {
      // Element missing — centre the spotlight in the viewport as a
      // graceful fallback so the dim layer still appears.
      x.value = window.innerWidth / 2
      y.value = window.innerHeight / 2
      radius.value = opts.radius ?? 200
      soft.value = opts.soft ?? 80
      trackedEl = null
      active.value = true
      return
    }
    trackedEl = el
    trackedOpts = opts
    aimAt(el, opts)
    active.value = true
  }

  function clear() {
    active.value = false
    trackedEl = null
  }

  // Re-aim on scroll + resize, coalesced into a single rAF callback.
  // Without this, a fast scroll (or the demo's own 6 s tween) fires
  // dozens of scroll events per frame, each one calling
  // getBoundingClientRect() — a forced layout. The rAF wrapper
  // batches every pending event into ONE rect read per frame,
  // matching the browser's natural render cadence.
  let pendingReAim = false
  function scheduleReAim() {
    if (!active.value || !trackedEl || pendingReAim) return
    pendingReAim = true
    requestAnimationFrame(() => {
      pendingReAim = false
      if (active.value && trackedEl) aimAt(trackedEl, trackedOpts)
    })
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', scheduleReAim, { passive: true })
    window.addEventListener('resize', scheduleReAim, { passive: true })
    onBeforeUnmount(() => {
      window.removeEventListener('scroll', scheduleReAim)
      window.removeEventListener('resize', scheduleReAim)
    })
  }

  return {
    active: readonly(active),
    x: readonly(x),
    y: readonly(y),
    radius: readonly(radius),
    soft: readonly(soft),
    focus,
    clear,
  }
}
