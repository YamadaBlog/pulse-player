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

// ─── 0. Shared visibility gate (round-12 fluidity fix) ──────────────
//
// Every per-frame loop in this file used to run UNCONDITIONALLY from
// mount to unmount — getBoundingClientRect() reads + style writes at
// 60 Hz for sections that were nowhere near the viewport. Measured at
// 2560×1440 (prod build, paused, resting at the hero): p50 frame time
// 100 ms — 10 fps at IDLE — dominated by raster work from offscreen
// blurred/blended layers being animated (5 orbit orbs at blur(60px)
// + mix-blend screen, time-stepped every frame).
//
// `runWhileVisible` wraps a rAF loop in an IntersectionObserver: the
// loop runs ONLY while the target intersects the viewport (plus a
// small margin so animations are already moving when they enter).
// Returns a disposer.
function runWhileVisible(el: HTMLElement, tick: FrameRequestCallback): () => void {
  let raf = 0
  let running = false
  const loop: FrameRequestCallback = (t) => {
    if (!running) return
    tick(t)
    raf = requestAnimationFrame(loop)
  }
  const io = new IntersectionObserver(
    ([entry]) => {
      const shouldRun = entry.isIntersecting
      if (shouldRun && !running) {
        running = true
        raf = requestAnimationFrame(loop)
      } else if (!shouldRun && running) {
        running = false
        cancelAnimationFrame(raf)
      }
    },
    { rootMargin: '120px' },
  )
  io.observe(el)
  return () => {
    running = false
    cancelAnimationFrame(raf)
    io.disconnect()
  }
}

// ─── 1. useScrollProgress — REMOVED round-16 ────────────────────────
// Its only consumer (the hero font-variation wght axis) was deleted in
// round-12 for fluidity ; the hook then burned a rect read + style
// write per scrolled frame for nothing. Re-add from git history if a
// CSS consumer ever returns.

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
  let dispose: (() => void) | null = null
  let chars: HTMLSpanElement[] = []
  const amplitude = opts.amplitude ?? 24
  const period = opts.period ?? 6

  // Round-12 fluidity : the wave phase depends ONLY on scroll position,
  // so static frames skip the rect read + N char-transform writes
  // (this used to be a forced layout + ~30 style writes per frame, for
  // the whole page lifetime, even with the headline offscreen).
  let lastScrollY = -1
  const tick = (el: HTMLElement) => {
    if (!chars.length) return
    if (window.scrollY === lastScrollY) return
    lastScrollY = window.scrollY
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
    dispose = runWhileVisible(el, () => tick(el))
  })

  onBeforeUnmount(() => {
    dispose?.()
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
  let dispose: (() => void) | null = null
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

  // Round-12 fluidity — this loop was the single worst idle cost on
  // the page : 5 orbs of ~380×380 px, each blur(60px) + mix-blend
  // screen, re-transformed EVERY frame from mount to unmount (time-
  // based, so never at rest), even with the section far offscreen.
  // Moving blended+blurred layers forces large re-composites per
  // frame ; the idle-cost bisection measured the page resting at the
  // hero at p50 = 100 ms/frame, and hiding decorations like these
  // recovered most of it. Fixes :
  //   1. visibility-gated (runWhileVisible) — zero cost offscreen ;
  //   2. orbit stepped at 30 Hz instead of 60 — the 4 s-period drift
  //      is imperceptible at half rate, halves the composite load ;
  //   3. rect read only when scroll moved (radius/speed input).
  let lastScrollY = -1
  let p = 0
  let frameToggle = false
  const tick = (el: HTMLElement) => {
    frameToggle = !frameToggle
    if (frameToggle) return // 30 Hz
    if (window.scrollY !== lastScrollY) {
      lastScrollY = window.scrollY
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const span = rect.height + vh
      const traversed = vh - rect.top
      p = Math.max(0, Math.min(1, traversed / span))
    }
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
    dispose = runWhileVisible(el, () => tick(el))
  })

  onBeforeUnmount(() => {
    dispose?.()
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
