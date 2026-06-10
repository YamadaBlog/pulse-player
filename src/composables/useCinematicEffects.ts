/**
 * useCinematicEffects — alpha.31 finishing touches.
 *
 * Pulled out of the per-section ad-hoc code into reusable hooks:
 *
 *   - useFloatingBob(target)         — 12 s loop Y translate -6 → 0 → -6
 *                                      on the hero player so it feels
 *                                      like a hardware object levitating
 *   - useTypeOnReveal(target)        — character-by-character type-in
 *                                      animation on intersect
 *   - useFirstPlayFlare(engine)      — one-shot full-page light flare
 *                                      the first time the user presses
 *                                      Play. Apple "screen lights up" cue.
 *
 * Demo-page only. NOT shipped in any `@pulse-music/*` tarball.
 */

import { onBeforeUnmount, onMounted, type Ref } from 'vue'

// ─── 1. useFloatingBob ──────────────────────────────────────────────

/**
 * Subtle vertical bob — the target translates between -6 px and 0 px
 * over a 12 s sine cycle. Pure CSS via custom property + GPU compositor.
 * The 6 px amplitude is tight on purpose: any larger reads as toy.
 */
export function useFloatingBob(
  target: Ref<HTMLElement | null>,
  opts: { amplitude?: number; period?: number } = {},
): void {
  let raf = 0
  const start = performance.now()
  const amplitude = opts.amplitude ?? 6
  const period = opts.period ?? 12_000

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const el = target.value
    if (!el) return
    const t = (performance.now() - start) / period
    const y = -Math.abs(Math.sin(t * Math.PI * 2)) * amplitude
    el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    raf = requestAnimationFrame(tick)
  })
  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
  })
}

// ─── 2. useTypeOnReveal ─────────────────────────────────────────────

/**
 * Type-on animation triggered when the target enters the viewport.
 * Reveals one char every ~70 ms (~14 chars/s). Idempotent — runs once
 * per element. The composable captures the textContent on mount and
 * blanks the element until intersect, then types it back in.
 *
 * Reduced-motion / no IntersectionObserver: shows the full text
 * immediately.
 */
export function useTypeOnReveal(
  target: Ref<HTMLElement | null>,
  opts: { msPerChar?: number; threshold?: number } = {},
): void {
  let observer: IntersectionObserver | null = null
  let interval: ReturnType<typeof setInterval> | null = null
  const msPerChar = opts.msPerChar ?? 70
  const threshold = opts.threshold ?? 0.4

  onMounted(() => {
    const el = target.value
    if (!el) return
    const text = el.textContent ?? ''

    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!('IntersectionObserver' in window)) return

    el.textContent = ''
    // Reserve the layout space so it doesn't jump.
    el.style.minHeight = `${el.getBoundingClientRect().height}px`

    let typed = false
    observer = new IntersectionObserver(
      (entries) => {
        if (typed) return
        for (const entry of entries) {
          if (entry.isIntersecting) {
            typed = true
            let i = 0
            interval = setInterval(() => {
              el.textContent = text.slice(0, ++i)
              if (i >= text.length && interval) {
                clearInterval(interval)
                interval = null
              }
            }, msPerChar)
            observer?.disconnect()
            return
          }
        }
      },
      { threshold },
    )
    observer.observe(el)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    if (interval) clearInterval(interval)
  })
}

// ─── 3. useFirstPlayFlare ──────────────────────────────────────────

interface PlayableEngine {
  isPlaying: boolean
}

/**
 * Paints a one-shot full-viewport light flare the FIRST time the user
 * triggers playback. Apple "screen lights up" cue. After it fires once,
 * a sessionStorage flag prevents repeats so the experience stays
 * deliberate.
 *
 * Implementation: a fixed-position div is appended to <body>, animated
 * opacity 0 → 0.3 → 0 over 600 ms, then removed. Pointer-events: none
 * so it never blocks input.
 */
export function useFirstPlayFlare(engine: Ref<PlayableEngine>): void {
  const FLARE_KEY = 'pulse-first-play-flare-seen'
  let fired = false
  let raf = 0

  const watchTick = () => {
    raf = requestAnimationFrame(watchTick)
    if (fired) return
    if (!engine.value.isPlaying) return
    fired = true
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(FLARE_KEY) === '1') return
    sessionStorage.setItem(FLARE_KEY, '1')

    const flare = document.createElement('div')
    flare.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9998;
      background: radial-gradient(
        circle at center,
        rgba(245, 158, 11, 0.32) 0%,
        rgba(139, 92, 246, 0.16) 30%,
        transparent 60%
      );
      mix-blend-mode: screen;
      opacity: 0;
      transition: opacity 200ms ease-out;
    `
    document.body.appendChild(flare)
    requestAnimationFrame(() => {
      flare.style.opacity = '1'
      setTimeout(() => {
        flare.style.transition = 'opacity 400ms ease-out'
        flare.style.opacity = '0'
        setTimeout(() => flare.remove(), 450)
      }, 250)
    })
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    raf = requestAnimationFrame(watchTick)
  })
  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
  })
}
