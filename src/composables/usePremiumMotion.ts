/**
 * usePremiumMotion — orchestrated entrance + audio-reactive ambient
 *                     + smooth scroll for the Vue 3 marketing demo page.
 *
 * Scope: **the demo page (`src/App.vue`) only**. Does NOT touch
 * `src/lib/` (Vue v2.3.4 byte-identical promise) and does NOT ship in
 * any `@pulse-music/*` published package. It's `src/` consumer-side.
 *
 * Three concerns, three exports:
 *
 *   1. `useStagedReveal()` — Motion One staged entrance. Plays once,
 *      respects `prefers-reduced-motion`, 200-500 ms per element per
 *      the [2026 micro-interaction guidance]. Selector-based so the
 *      consumer doesn't have to template-ref every element.
 *
 *   2. `useAudioReactiveBackdrop(engine, root)` — subscribes to
 *      `PulseEngine.eqBars` (already exposed by `useAudioStore`),
 *      modulates a CSS custom property `--pulse-ambient` on the root
 *      so a backdrop layer can react to FFT without re-rendering.
 *      Zero allocations per frame — same RAF cadence as the engine.
 *
 *   3. `useSmoothScroll()` — boots Lenis once. The library is opt-in
 *      and reduced-motion aware. Returns the lenis instance for any
 *      caller that wants to drive scroll-to via `lenis.scrollTo(target)`.
 *
 * References:
 *   - Motion One (motion.dev) — 8 kB core, 2.5× faster than GSAP on
 *     unknown-value DOM animations.
 *   - Lenis (darkroomengineering) — smooth scroll that respects
 *     `position: sticky` and Intersection Observer.
 *   - Codrops 3D Audio Visualiser pattern — combining FFT loop with
 *     CSS variable channel for Web-Animations-friendly amplification.
 */

import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { animate, stagger } from 'motion'
import Lenis from 'lenis'

// ─── 1. Staged entrance ──────────────────────────────────────────────

interface StagedRevealOptions {
  /** CSS selectors to reveal in order. Each gets a 60 ms stagger. */
  selectors: string[]
  /** Per-element duration in seconds (default 0.45 = 450 ms). */
  duration?: number
  /** Initial Y offset in pixels (default 18). */
  yFrom?: number
  /** Stagger between elements in seconds (default 0.06 = 60 ms). */
  stagger?: number
  /** Delay before the cascade begins, in seconds (default 0.1). */
  startDelay?: number
}

/**
 * Plays a single Apple-style staged entrance on the named elements.
 * Respects `prefers-reduced-motion` (returns without animating).
 *
 * Call from the consumer component inside `onMounted`. The selectors
 * are queried at call time, so they must be in the DOM already.
 */
export function useStagedReveal(opts: StagedRevealOptions): void {
  onMounted(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const duration = opts.duration ?? 0.45
    const yFrom = opts.yFrom ?? 18
    const staggerDelay = opts.stagger ?? 0.06
    const startDelay = opts.startDelay ?? 0.1

    const elements: HTMLElement[] = []
    for (const sel of opts.selectors) {
      const el = document.querySelector<HTMLElement>(sel)
      if (el) elements.push(el)
    }
    if (!elements.length) return

    // Set the initial state immediately so the user never sees a flash
    // of un-styled content. The animate() below will then transition in.
    for (const el of elements) {
      el.style.opacity = '0'
      el.style.transform = `translate3d(0, ${yFrom}px, 0)`
      el.style.willChange = 'opacity, transform'
    }

    animate(
      elements,
      { opacity: [0, 1], y: [yFrom, 0] },
      {
        duration,
        delay: stagger(staggerDelay, { startDelay }),
        ease: [0.22, 1, 0.36, 1], // Apple-style "easeOutQuint"
      },
    ).then(() => {
      // Clear will-change once the cascade settles so the compositor
      // can reclaim the layers.
      for (const el of elements) {
        el.style.willChange = ''
      }
    })
  })
}

// ─── 2. Audio-reactive backdrop ──────────────────────────────────────

interface AudioReactiveEngine {
  /** Current FFT amplitudes (matches `PulseEngine.eqBars`). */
  eqBars: readonly number[]
  /** Whether playback is active. */
  isPlaying: boolean
}

/**
 * Subscribes to the engine's eqBars and updates a CSS custom property
 * `--pulse-ambient` (range 0..1) on the given root. Consumers wire it
 * to any compositable property — `opacity`, `filter: brightness()`,
 * `transform: scale()` — in their own CSS.
 *
 * Idle state when paused or reduced-motion: returns to 0 with a
 * smooth 200 ms decay so the chrome stays calm.
 */
export function useAudioReactiveBackdrop(
  engine: Ref<AudioReactiveEngine>,
  root: Ref<HTMLElement | null>,
): void {
  let raf = 0
  let smoothed = 0

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const el = root.value
    if (!el) return
    const e = engine.value
    let target = 0
    if (e.isPlaying) {
      // Mean of the 4 FFT focal bars, clamped to [0, 1].
      const bars = e.eqBars
      if (bars.length) {
        let sum = 0
        for (let i = 0; i < bars.length; i++) sum += bars[i] || 0
        target = Math.max(0, Math.min(1, sum / bars.length))
      }
    }
    // Smooth toward target — 0.18 factor = ~150 ms decay at 60 fps.
    smoothed += (target - smoothed) * 0.18
    el.style.setProperty('--pulse-ambient', smoothed.toFixed(3))
  }

  onMounted(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      // Reduced-motion: skip the RAF loop entirely.
      const el = root.value
      if (el) el.style.setProperty('--pulse-ambient', '0')
      return
    }
    raf = requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
  })
}

// ─── 3. Smooth scroll boot (Lenis) ───────────────────────────────────

/**
 * Boots Lenis once for the page. Reduced-motion users get the native
 * scroll behaviour; everyone else gets buttery momentum scrolling that
 * doesn't break `position: sticky` or Intersection Observer.
 *
 * Returns the Lenis instance so callers can drive `.scrollTo()`.
 * Disposes on unmount — singleton per component lifecycle.
 */
export function useSmoothScroll(): Ref<Lenis | null> {
  const instance = { value: null as Lenis | null } as Ref<Lenis | null>
  let rafId = 0

  onMounted(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
      smoothWheel: true,
      touchMultiplier: 1.5,
    })

    const tick = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    instance.value = lenis
  })

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    instance.value?.destroy()
    instance.value = null
  })

  return instance
}
