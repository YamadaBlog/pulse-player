/**
 * useAdvancedMotion — alpha.29 next-tier composables, born from the
 *                     real IA-tools / skills research:
 *
 *   - Anthropic frontend-design skill anti-slop rules
 *     (https://github.com/anthropics/skills/tree/main/frontend-design)
 *     anti-purple-gradients, asymmetric layouts, bold typography,
 *     intentional animations, no AI-generated symmetric centering.
 *
 *   - Leonxlnx/taste-skill v2 — "stop the AI from generating boring,
 *     generic slop". Adopted: every effect here has a stated purpose
 *     beyond "ooh, motion".
 *
 *   - Codrops 2026-01 dual-wave scroll-driven text pattern
 *     (https://tympanus.net/codrops/2026/01/15/...).
 *     Implemented as `useScrollKineticWave`.
 *
 *   - Apple AirPods Pro scroll-sequence pattern
 *     (https://www.awwwards.com/inspiration/product-scroll-triggered-...).
 *     Implemented as `useScrollProgress` + consumer paints a sequence.
 *     Lighter than the full 60-frame canvas image flip — we keep the
 *     bundle disciplined.
 *
 * Demo-page only. NOT shipped in any `@pulse-music/*` tarball.
 */

import { onBeforeUnmount, onMounted, type Ref } from 'vue'

// ─── 1. useScrollProgress ────────────────────────────────────────────

/**
 * Tracks the target element's scroll progress through the viewport as
 * a number in [0..1]:
 *   - 0 when the element's top hits the bottom of the viewport
 *   - 1 when the element's bottom hits the top of the viewport
 *
 * Sets a CSS custom property `--scroll-progress` on the element so the
 * CSS consumer can drive any compositable property. Zero Vue rerender.
 *
 * This is the foundation block: the same primitive that Apple's
 * scroll-driven product pages use (a single 0..1 scalar that paints
 * everything from sequence frames to text masks to camera positions).
 */
export function useScrollProgress(target: Ref<HTMLElement | null>): void {
  let raf = 0

  const update = () => {
    raf = requestAnimationFrame(update)
    const el = target.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight
    // Progress reaches 0 when the element's top hits the bottom of
    // the viewport, 1 when its bottom hits the top.
    const span = rect.height + vh
    const traversed = vh - rect.top
    const p = Math.max(0, Math.min(1, traversed / span))
    el.style.setProperty('--scroll-progress', p.toFixed(4))
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      target.value?.style.setProperty('--scroll-progress', '0.5')
      return
    }
    raf = requestAnimationFrame(update)
  })

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
  })
}

// ─── 2. useScrollKineticWave ──────────────────────────────────────────

interface KineticWaveOptions {
  /** Amplitude of the vertical wave in pixels (default 24). */
  amplitude?: number
  /** Spatial period — chars per wave cycle (default 6). */
  period?: number
}

/**
 * Codrops Jan 2026 "dual-wave scroll-driven text" pattern, ported to
 * vanilla Vue. The element's text is split into per-char spans on
 * mount; on scroll, each char gets a translateY based on a sine
 * function of (charIndex / period + scrollProgress * TAU).
 *
 * The wave moves DOWN the text as the page scrolls, like reading a
 * stream that ripples. Two phase-offset waves combined for the
 * "dual-wave" interference pattern.
 *
 * Anti-slop note: bias to subtle amplitude (24 px max) and aria-label
 * the parent so screen readers get the clean phrase.
 */
export function useScrollKineticWave(
  target: Ref<HTMLElement | null>,
  opts: KineticWaveOptions = {},
): void {
  let raf = 0
  let chars: HTMLSpanElement[] = []
  const amplitude = opts.amplitude ?? 24
  const period = opts.period ?? 6

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const el = target.value
    if (!el || !chars.length) return
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight
    const span = rect.height + vh
    const traversed = vh - rect.top
    const p = Math.max(0, Math.min(1, traversed / span))
    const phase = p * Math.PI * 4 // 2 full cycles across the scroll
    for (let i = 0; i < chars.length; i++) {
      const local = (i / period) * Math.PI * 2 + phase
      const wave1 = Math.sin(local)
      const wave2 = Math.cos(local * 0.7 + phase * 0.5) * 0.6
      const y = (wave1 + wave2) * amplitude * 0.5
      chars[i].style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`
    }
  }

  onMounted(() => {
    const el = target.value
    if (!el) return
    const text = el.textContent ?? ''
    // alpha.37 — mobile word-break fix : on ≤ 720 px, skip the wave
    // entirely (no per-char split, no transform loop). The headline
    // then wraps naturally by word — desktop keeps the kinetic wave.
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches) {
      el.setAttribute('aria-label', text)
      return
    }
    const fragment = document.createDocumentFragment()
    chars = []
    for (const ch of text) {
      const s = document.createElement('span')
      s.className = 'wave-char'
      // alpha.32 VISUAL-QA fix — explicit NBSP (U+00A0) for spaces
      // so inline-block spans don't collapse the inter-word gap.
      s.textContent = ch === ' ' ? ' ' : ch
      s.style.display = 'inline-block'
      s.style.willChange = 'transform'
      fragment.appendChild(s)
      chars.push(s)
    }
    el.textContent = ''
    el.appendChild(fragment)
    el.setAttribute('aria-label', text)

    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    raf = requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
  })
}

// ─── 3. useScrollOrbitField ──────────────────────────────────────────

interface OrbitFieldOptions {
  /** Number of orbiting bodies (default 5). */
  count?: number
  /** Maximum orbit radius in vh (default 28). */
  maxRadius?: number
  /** Accent colours — passed as CSS strings. Should NOT default to
   *  generic AI purple. Pulse standard palette below avoids the
   *  pitfall. */
  colours?: string[]
}

/**
 * A small constellation of glowing orbs that orbit a central point,
 * with their radius and speed driven by `--scroll-progress`. Inspired
 * by the Codrops "Solar Storm" audio-reactive pattern but lifted into
 * a scroll-driven decoration so we get the visual without booting an
 * audio engine for every visitor.
 *
 * The orbs are rendered as styled divs inside the target — no Canvas
 * needed because the count is small (default 5). CSS does the heavy
 * lifting via custom properties the composable updates per frame.
 *
 * Anti-slop note: the palette includes a warm tertiary (amber) to
 * break the violet-teal AI-generated default Anthropic's skill flags.
 */
export function useScrollOrbitField(
  target: Ref<HTMLElement | null>,
  opts: OrbitFieldOptions = {},
): void {
  let raf = 0
  let orbs: HTMLDivElement[] = []
  const count = opts.count ?? 5
  const maxRadius = opts.maxRadius ?? 28
  const colours = opts.colours ?? [
    '#8B5CF6', // violet (existing)
    '#3DBDA7', // teal (existing)
    '#F59E0B', // amber — warm tertiary breaking the cool palette
    '#EC4899', // pink for the 4th orb
    '#06B6D4', // cyan for variety
  ]

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const el = target.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight
    const span = rect.height + vh
    const traversed = vh - rect.top
    const p = Math.max(0, Math.min(1, traversed / span))
    // Time t advances at a base rate + boosted by scroll progress.
    const t = performance.now() / 4000 + p * Math.PI
    for (let i = 0; i < orbs.length; i++) {
      const phase = (i / orbs.length) * Math.PI * 2
      const radius = (0.5 + p * 0.5) * maxRadius
      const x = Math.cos(t + phase) * radius
      const y = Math.sin(t * 1.3 + phase) * radius * 0.6
      orbs[i].style.transform = `translate3d(${x.toFixed(2)}vh, ${y.toFixed(2)}vh, 0)`
    }
  }

  onMounted(() => {
    const el = target.value
    if (!el) return

    // Build the orb DOM.
    for (let i = 0; i < count; i++) {
      const orb = document.createElement('div')
      orb.className = 'orbit-orb'
      orb.style.background = `radial-gradient(circle, ${colours[i % colours.length]} 0%, transparent 70%)`
      orb.style.willChange = 'transform'
      el.appendChild(orb)
      orbs.push(orb)
    }

    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Static distribution in reduced-motion mode.
      orbs.forEach((o, i) => {
        const phase = (i / orbs.length) * Math.PI * 2
        const x = Math.cos(phase) * maxRadius * 0.5
        const y = Math.sin(phase) * maxRadius * 0.3
        o.style.transform = `translate3d(${x}vh, ${y}vh, 0)`
      })
      return
    }
    raf = requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
    orbs.forEach((o) => o.remove())
    orbs = []
  })
}

// ─── 4. useMagneticHover ──────────────────────────────────────────────

interface MagneticOptions {
  /** Maximum displacement on hover, in pixels (default 8). */
  strength?: number
  /** Damping factor 0..1 per frame (default 0.18). */
  damping?: number
}

/**
 * Magnetic hover effect — the element subtly leans toward the cursor
 * within a bounded zone. Used on CTAs and chips. Apple's "the
 * interface feels alive" microinteraction, scaled subtle.
 *
 * Anti-slop discipline: max 8 px displacement. Anything bigger reads
 * as toy / Webflow template demo.
 */
export function useMagneticHover(
  target: Ref<HTMLElement | null>,
  opts: MagneticOptions = {},
): void {
  let raf = 0
  let tx = 0
  let ty = 0
  let cx = 0
  let cy = 0
  const strength = opts.strength ?? 8
  const damping = opts.damping ?? 0.18
  let isInside = false

  const onMove = (e: PointerEvent) => {
    const el = target.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    const ratioX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const ratioY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    tx = Math.max(-1, Math.min(1, ratioX)) * strength
    ty = Math.max(-1, Math.min(1, ratioY)) * strength
  }
  const onLeave = () => {
    isInside = false
    tx = 0
    ty = 0
  }
  const onEnter = () => {
    isInside = true
  }

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const el = target.value
    if (!el) return
    cx += (tx - cx) * damping
    cy += (ty - cy) * damping
    el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`
  }

  onMounted(() => {
    const el = target.value
    if (!el) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: fine)').matches) return

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)
    raf = requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => {
    const el = target.value
    if (el) {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
    }
    if (raf) cancelAnimationFrame(raf)
  })

  // Lint silence — isInside tracked for future hook expansion
  void isInside
}
