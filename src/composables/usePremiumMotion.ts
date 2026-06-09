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

// ─── 4. Kinetic typography — split title into chars ──────────────────

/**
 * Splits the element's text into `<span class="char">` per character
 * (whitespace preserved as a non-breaking space), then plays a staged
 * reveal per char. Apple's "Hello." style entrance — each glyph
 * cascades in at ~25 ms intervals.
 *
 * Idempotent: runs once on mount. Re-rendering the element re-runs
 * the split.
 *
 * `prefers-reduced-motion` skips the animation but still splits — the
 * span wrapping is harmless for accessibility (screen readers read
 * the original text via the parent).
 */
export function useKineticType(target: Ref<HTMLElement | null>): void {
  onMounted(() => {
    const el = target.value
    if (!el) return

    const text = el.textContent ?? ''
    const fragment = document.createDocumentFragment()
    const chars: HTMLSpanElement[] = []

    for (const ch of text) {
      const span = document.createElement('span')
      span.className = 'kinetic-char'
      span.textContent = ch === ' ' ? ' ' : ch
      span.style.display = 'inline-block'
      // Preserve word-wrap by leaving the parent's white-space alone.
      fragment.appendChild(span)
      chars.push(span)
    }

    el.textContent = ''
    el.appendChild(fragment)
    // Mark the parent so a screen reader still reads the whole title
    // as one phrase rather than the per-char structure.
    el.setAttribute('aria-label', text)

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    for (const c of chars) {
      c.style.opacity = '0'
      c.style.transform = 'translate3d(0, 28px, 0) rotate(2deg)'
      c.style.willChange = 'opacity, transform'
    }

    animate(
      chars,
      {
        opacity: [0, 1],
        y: [28, 0],
        rotate: [2, 0],
      },
      {
        duration: 0.55,
        delay: stagger(0.025, { startDelay: 0.18 }),
        ease: [0.22, 1, 0.36, 1],
      },
    ).then(() => {
      for (const c of chars) c.style.willChange = ''
    })
  })
}

// ─── 5. Cursor-tracking glow (Apple interactive light) ───────────────

interface CursorGlowOptions {
  /** Glow radius in pixels (default 360). */
  radius?: number
  /** Maximum opacity 0..1 (default 0.35). */
  intensity?: number
}

/**
 * Tracks the pointer position relative to the target and updates two
 * CSS custom properties on it:
 *   --cursor-x: <0..100>%
 *   --cursor-y: <0..100>%
 *   --cursor-inside: <0|1>
 *
 * The CSS consumer paints a radial-gradient glow at (var(--cursor-x),
 * var(--cursor-y)) — see App.vue style block. Decays back to centre
 * on mouseleave with a small momentum so the glow doesn't snap away.
 *
 * Mobile / no-pointer / reduced-motion: stays disabled.
 */
export function useCursorGlow(target: Ref<HTMLElement | null>, opts: CursorGlowOptions = {}): void {
  let raf = 0
  let mouseX = 0.5
  let mouseY = 0.5
  let renderedX = 0.5
  let renderedY = 0.5
  let inside = 0

  const onMove = (e: PointerEvent) => {
    const el = target.value
    if (!el) return
    const rect = el.getBoundingClientRect()
    mouseX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    mouseY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    inside = 1
  }
  const onEnter = () => {
    inside = 1
  }
  const onLeave = () => {
    inside = 0
  }

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const el = target.value
    if (!el) return
    // Smooth toward mouse — 0.15/frame factor.
    renderedX += (mouseX - renderedX) * 0.15
    renderedY += (mouseY - renderedY) * 0.15
    el.style.setProperty('--cursor-x', `${(renderedX * 100).toFixed(1)}%`)
    el.style.setProperty('--cursor-y', `${(renderedY * 100).toFixed(1)}%`)
    el.style.setProperty('--cursor-inside', String(inside))
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // No-pointer devices (phones / TVs) don't get the effect.
    if (!window.matchMedia('(pointer: fine)').matches) return

    const el = target.value
    if (!el) return
    el.style.setProperty('--cursor-radius', `${opts.radius ?? 360}px`)
    el.style.setProperty('--cursor-intensity', String(opts.intensity ?? 0.35))

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
}

// ─── 6. Scroll parallax (uses Lenis if available) ────────────────────

interface ParallaxOptions {
  /** Parallax depth in pixels. Positive = slower than scroll. */
  depth?: number
}

/**
 * Attaches a transform: translate3d(0, calc(scrollY * factor), 0) to
 * the target element. Driven by Lenis if booted, otherwise by the
 * native scroll listener with passive: true.
 *
 * The depth is small by default (60 px max) — premium parallax is
 * subtle. Apple's product pages parallax their hero backdrops at
 * ~10-20% of scroll velocity.
 */
export function useScrollParallax(
  target: Ref<HTMLElement | null>,
  opts: ParallaxOptions = {},
): void {
  let raf = 0
  let lastY = 0
  const depth = opts.depth ?? 60

  const onScroll = () => {
    lastY = window.scrollY
  }
  const tick = () => {
    raf = requestAnimationFrame(tick)
    const el = target.value
    if (!el) return
    const factor = -(lastY / Math.max(1, window.innerHeight)) * depth
    el.style.transform = `translate3d(0, ${factor.toFixed(2)}px, 0)`
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    window.addEventListener('scroll', onScroll, { passive: true })
    raf = requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', onScroll)
    }
    if (raf) cancelAnimationFrame(raf)
  })
}

// ─── 7. View Transitions wrapper ─────────────────────────────────────

interface ViewTransitionApiDocument {
  startViewTransition?: (cb: () => void | Promise<void>) => {
    finished: Promise<void>
    ready: Promise<void>
    updateCallbackDone: Promise<void>
  }
}

/**
 * Wraps a state update in `document.startViewTransition` when
 * supported (Chromium 111+). Falls back to plain invocation in
 * Safari < 18 + Firefox until VT API ships GA. Use for variant
 * swaps, theme toggles, route-like UI changes where a cross-fade
 * polish is worth it.
 *
 * Example:
 *   onClick: () => withViewTransition(() => (variant.value = 'vinyl'))
 */
export function withViewTransition(update: () => void): void {
  const doc = document as Document & ViewTransitionApiDocument
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(update)
  } else {
    update()
  }
}

// ─── 8. Canvas2D audio particle field ────────────────────────────────

interface AudioParticleOptions {
  /** Particle count (default 60). */
  count?: number
  /** Base colour (rgba string). */
  colour?: string
}

/**
 * Renders a subtle particle field on a canvas, modulated by the
 * engine's eqBars amplitude. Each particle drifts slowly upward;
 * the FFT mean increases speed + opacity briefly. Pure Canvas 2D —
 * no WebGL, no Three.js — to keep the bundle cost negligible (the
 * canvas API is built into every browser).
 *
 * Mounted on a `<canvas>` element ref. Resizes to match its parent
 * via ResizeObserver. Cleans up RAF + listeners on unmount.
 *
 * Reduced-motion: doesn't initialise.
 */
export function useAudioParticles(
  canvas: Ref<HTMLCanvasElement | null>,
  engine: Ref<AudioReactiveEngine>,
  opts: AudioParticleOptions = {},
): void {
  let raf = 0
  let ro: ResizeObserver | null = null
  type P = { x: number; y: number; vy: number; r: number; phase: number }
  const particles: P[] = []
  const count = opts.count ?? 60
  const baseColour = opts.colour ?? 'rgba(139, 92, 246, 0.55)'

  const seed = (w: number, h: number) => {
    particles.length = 0
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: 0.15 + Math.random() * 0.25,
        r: 0.6 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
      })
    }
  }

  const tick = () => {
    raf = requestAnimationFrame(tick)
    const c = canvas.value
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const w = c.width
    const h = c.height

    // Audio amplitude — same source as the ambient backdrop.
    const e = engine.value
    let amp = 0
    if (e.isPlaying) {
      const bars = e.eqBars
      let sum = 0
      for (let i = 0; i < bars.length; i++) sum += bars[i] || 0
      amp = bars.length ? sum / bars.length : 0
    }
    const boost = 1 + amp * 2

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = baseColour
    for (const p of particles) {
      p.y -= p.vy * boost
      p.phase += 0.02
      const wobble = Math.sin(p.phase) * 0.6
      if (p.y < -10) {
        p.y = h + 10
        p.x = Math.random() * w
      }
      const opacity = 0.25 + amp * 0.5
      ctx.globalAlpha = opacity
      ctx.beginPath()
      ctx.arc(p.x + wobble, p.y, p.r * boost, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const c = canvas.value
    if (!c) return

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const sync = () => {
      const parent = c.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      c.width = Math.max(1, Math.floor(rect.width * dpr))
      c.height = Math.max(1, Math.floor(rect.height * dpr))
      c.style.width = `${rect.width}px`
      c.style.height = `${rect.height}px`
      const ctx = c.getContext('2d')
      ctx?.scale(dpr, dpr)
      seed(rect.width, rect.height)
    }
    sync()
    ro = new ResizeObserver(sync)
    if (c.parentElement) ro.observe(c.parentElement)
    raf = requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
    ro?.disconnect()
  })
}
