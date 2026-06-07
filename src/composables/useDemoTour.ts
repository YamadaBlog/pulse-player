/**
 * useDemoTour — a self-contained guided product tour controller.
 *
 * Design choice: no external library. driver.js / Shepherd.js / Intro.js
 * are tooltip-based product tours built for SaaS onboarding. This demo
 * is a *scripted timeline* that orchestrates Vue refs, audio state and
 * smooth scroll — a plain async/await loop is the right primitive.
 *
 * Public API:
 *   const tour = useDemoTour()
 *   tour.start(steps, opts)   // run the timeline
 *   tour.stop()               // abort cleanly, fire cleanup
 *   tour.isRunning            // reactive boolean
 *   tour.currentStep          // reactive index (0-based)
 *   tour.totalSteps           // reactive total
 *   tour.title                // reactive title of the current step
 *   tour.message              // reactive caption shown to the user
 *   tour.progress             // 0..1 progress through the whole tour
 *
 * Each step is an async function that receives a context with helpers:
 *   - signal       : AbortSignal — every helper respects it
 *   - delay(ms)    : abortable sleep
 *   - tween(...)   : abortable rAF-driven number tween (any easing)
 *   - scrollTo(el) : abortable smooth scroll to an element or selector
 *   - setMessage   : update the caption shown in the banner
 *
 * Anatomy of a step:
 *   { title: 'Themes',
 *     run: async (ctx) => {
 *       ctx.setMessage('Nine themes, one component.')
 *       await ctx.scrollTo('#themes')
 *       await ctx.tween(v => userScale.value = v, 1, 1.5, 1200)
 *       await ctx.delay(800)
 *     }
 *   }
 *
 * Stop semantics:
 *   `tour.stop()` flips the AbortSignal. Any in-flight delay / tween /
 *   scrollTo throws an `AbortError` immediately. The for-loop in `start`
 *   exits, the finally-block calls every registered cleanup callback
 *   (audio reset, ambient EQ reset, variant reset, etc.) and the user
 *   is left with a clean, exploreable page.
 */
import { ref, computed, type Ref } from 'vue'

export type EasingName = 'inOutCubic' | 'outQuart' | 'outQuint' | 'inOutQuart' | 'outExpo'

export interface ScrollToOptions {
  /** How urgently to move. Most steps should stay on `gentle`.
   *  `fast` is the "boost" used for skipping to the bottom of the page,
   *  `slow` is for a luxurious focus shift between adjacent sections. */
  speed?: 'gentle' | 'fast' | 'slow'
  /** Override the easing (default depends on `speed`). */
  easing?: EasingName
  /** Pixels from the top of the viewport where the target should land. */
  offset?: number
}

export interface DemoStepContext {
  signal: AbortSignal
  delay: (ms: number) => Promise<void>
  tween: (
    setter: (n: number) => void,
    from: number,
    to: number,
    duration: number,
    easing?: EasingName,
  ) => Promise<void>
  scrollTo: (target: string | Element | null, opts?: ScrollToOptions) => Promise<void>
  setMessage: (m: string) => void
}

export interface DemoStep {
  title: string
  run: (ctx: DemoStepContext) => Promise<void>
}

export interface DemoStartOptions {
  /** Registered before the timeline starts so any state mutated by
   *  steps can be restored when the user hits Stop (or after completion). */
  onStop?: () => void
}

export function useDemoTour() {
  const isRunning: Ref<boolean> = ref(false)
  const isPaused: Ref<boolean> = ref(false)
  const currentStep: Ref<number> = ref(0)
  const totalSteps: Ref<number> = ref(0)
  const title: Ref<string> = ref('')
  const message: Ref<string> = ref('')
  const progress: Ref<number> = ref(0)

  // Pause gate — read by every rAF-driven helper. While `isPaused` is
  // true, helpers stop advancing their internal time accumulators, so
  // the entire timeline freezes in place. Resume just flips the flag.
  const checkPaused = () => isPaused.value

  // Two-tier abort scheme:
  //  - `tourController` is the master abort. When it fires, the whole
  //    tour exits and the onStop cleanup runs.
  //  - `stepController` aborts JUST the current step, used by next() /
  //    prev() / goToStep(). The loop catches the AbortError and jumps
  //    to `pendingJump` instead of unwinding.
  let tourController: AbortController | null = null
  let stepController: AbortController | null = null
  let pendingJump: number | null = null
  let pendingCleanup: (() => void) | null = null

  async function start(steps: DemoStep[], opts: DemoStartOptions = {}) {
    if (isRunning.value) return
    tourController = new AbortController()
    const tourSignal = tourController.signal

    pendingCleanup = opts.onStop ?? null
    isRunning.value = true
    totalSteps.value = steps.length
    currentStep.value = 0
    progress.value = 0
    title.value = ''
    message.value = ''

    try {
      let i = 0
      while (i < steps.length) {
        if (tourSignal.aborted) break
        stepController = new AbortController()
        const stepSignal = combinedAbort(tourSignal, stepController.signal)

        currentStep.value = i
        title.value = steps[i].title
        progress.value = i / steps.length

        const ctx: DemoStepContext = {
          signal: stepSignal,
          delay: (ms) => abortableDelay(ms, stepSignal, checkPaused),
          tween: (setter, from, to, ms, easing = 'outQuart') =>
            abortableTween(setter, from, to, ms, EASINGS[easing], stepSignal, checkPaused),
          scrollTo: (target, opts) => abortableScrollTo(target, stepSignal, checkPaused, opts),
          setMessage: (m) => {
            message.value = m
          },
        }

        try {
          await steps[i].run(ctx)
          i++
        } catch (err: unknown) {
          const e = err as { name?: string }
          if (e?.name !== 'AbortError') throw err
          // Decide what the abort meant: tour-wide stop, or step-level jump.
          if (tourSignal.aborted) break
          if (pendingJump !== null) {
            i = pendingJump
            pendingJump = null
            continue
          }
          // Step aborted without a jump request — treat as stop.
          break
        }
      }
      progress.value = 1
    } catch (err: unknown) {
      const e = err as { name?: string }
      if (e?.name !== 'AbortError' && !tourSignal.aborted) {
        // eslint-disable-next-line no-console
        console.error('[useDemoTour] step failed:', err)
      }
    } finally {
      const cleanup = pendingCleanup
      pendingCleanup = null
      tourController = null
      stepController = null
      pendingJump = null
      isRunning.value = false
      isPaused.value = false
      currentStep.value = 0
      title.value = ''
      message.value = ''
      progress.value = 0
      try {
        cleanup?.()
      } catch {
        /* ignore cleanup errors */
      }
    }
  }

  function stop() {
    if (tourController) tourController.abort()
    isPaused.value = false
  }

  /** Pause the tour in place. Every in-flight delay / tween / scroll
   *  stops consuming time. Resume picks up exactly where the user left it. */
  function pause() {
    if (!isRunning.value) return
    isPaused.value = true
  }

  /** Resume after a pause. No-op if not paused. */
  function resume() {
    if (!isRunning.value) return
    isPaused.value = false
  }

  /** Convenience toggle for the demo pill's play / pause button. */
  function togglePause() {
    if (!isRunning.value) return
    isPaused.value = !isPaused.value
  }

  /** Jump to a specific step index (0-based). Aborts the current step's
   *  in-flight animations cleanly and runs the new step from the top. */
  function goToStep(index: number) {
    if (!isRunning.value) return
    if (index < 0 || index >= totalSteps.value) return
    if (index === currentStep.value) return
    pendingJump = index
    stepController?.abort()
  }

  /** Skip to the next step. At the last step this ends the tour. */
  function next() {
    if (!isRunning.value) return
    const target = currentStep.value + 1
    if (target >= totalSteps.value) {
      tourController?.abort()
    } else {
      goToStep(target)
    }
  }

  /** Go back one step. No-op at the first step. */
  function prev() {
    if (!isRunning.value) return
    goToStep(Math.max(0, currentStep.value - 1))
  }

  return {
    start,
    stop,
    pause,
    resume,
    togglePause,
    goToStep,
    next,
    prev,
    isRunning: computed(() => isRunning.value),
    isPaused: computed(() => isPaused.value),
    currentStep: computed(() => currentStep.value),
    totalSteps: computed(() => totalSteps.value),
    title: computed(() => title.value),
    message: computed(() => message.value),
    progress: computed(() => progress.value),
  }
}

/** Returns a signal that aborts when *any* of the inputs aborts.
 *  Prefers the native `AbortSignal.any` when available. */
function combinedAbort(...signals: AbortSignal[]): AbortSignal {
  const SAny = (
    AbortSignal as unknown as {
      any?: (s: AbortSignal[]) => AbortSignal
    }
  ).any
  if (typeof SAny === 'function') return SAny(signals)
  const c = new AbortController()
  if (signals.some((s) => s.aborted)) {
    c.abort()
  } else {
    const onAbort = () => c.abort()
    signals.forEach((s) => s.addEventListener('abort', onAbort, { once: true }))
  }
  return c.signal
}

// ─── Helpers ────────────────────────────────────────────────────────

function abortError(): Error {
  const e = new Error('Demo aborted')
  e.name = 'AbortError'
  return e
}

/** Detect the OS-level reduced-motion preference. The entire demo
 *  collapses to instant state changes when this is true — no smooth
 *  scrolls, no tweens, no slow caption fades. We still walk through
 *  every step but each one snaps into its final state. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function abortableDelay(ms: number, signal: AbortSignal, isPaused: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }
    let remaining = ms
    let lastNow = performance.now()
    let raf = 0
    const onAbort = () => {
      cancelAnimationFrame(raf)
      reject(abortError())
    }
    signal.addEventListener('abort', onAbort, { once: true })
    function tick(now: number) {
      const dt = now - lastNow
      lastNow = now
      // Only burn down the remaining time when not paused — that way Pause
      // freezes the delay in place and Resume picks up where it stopped.
      if (!isPaused()) remaining -= dt
      if (remaining <= 0) {
        signal.removeEventListener('abort', onAbort)
        resolve()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  })
}

function abortableTween(
  setter: (n: number) => void,
  from: number,
  to: number,
  duration: number,
  easing: (t: number) => number,
  signal: AbortSignal,
  isPaused: () => boolean,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }
    // Reduced motion → snap straight to the end value, skip the rAF loop.
    if (prefersReducedMotion()) {
      setter(to)
      resolve()
      return
    }
    let elapsed = 0
    let lastNow = performance.now()
    let raf = 0
    const onAbort = () => {
      cancelAnimationFrame(raf)
      reject(abortError())
    }
    signal.addEventListener('abort', onAbort, { once: true })
    function tick(now: number) {
      const dt = now - lastNow
      lastNow = now
      if (!isPaused()) elapsed += dt
      const t = Math.min(1, elapsed / duration)
      setter(from + (to - from) * easing(t))
      if (t < 1 && !signal.aborted) {
        raf = requestAnimationFrame(tick)
      } else if (!signal.aborted) {
        signal.removeEventListener('abort', onAbort)
        resolve()
      }
    }
    raf = requestAnimationFrame(tick)
  })
}

function abortableScrollTo(
  target: string | Element | null,
  signal: AbortSignal,
  isPaused: () => boolean,
  opts: ScrollToOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }
    const el = typeof target === 'string' ? document.querySelector(target) : target
    if (!el) {
      resolve()
      return
    }
    const offsetTop = opts.offset ?? window.innerHeight * 0.18
    const rect = (el as Element).getBoundingClientRect()
    const targetY = Math.max(0, rect.top + window.scrollY - offsetTop)
    const startY = window.scrollY
    const distance = targetY - startY
    if (Math.abs(distance) < 4) {
      resolve()
      return
    }
    // Reduced motion → jump directly to the target Y, no smooth scroll.
    if (prefersReducedMotion()) {
      window.scrollTo(0, targetY)
      resolve()
      return
    }
    const speed = opts.speed ?? 'gentle'
    const speedProfile = SCROLL_SPEED[speed]
    const duration = Math.max(
      speedProfile.min,
      Math.min(speedProfile.max, speedProfile.base + Math.abs(distance) * speedProfile.perPx),
    )
    const easing = EASINGS[opts.easing ?? speedProfile.easing]
    let elapsed = 0
    let lastNow = performance.now()
    let raf = 0
    const onAbort = () => {
      cancelAnimationFrame(raf)
      reject(abortError())
    }
    signal.addEventListener('abort', onAbort, { once: true })
    function tick(now: number) {
      const dt = now - lastNow
      lastNow = now
      if (!isPaused()) elapsed += dt
      const t = Math.min(1, elapsed / duration)
      const eased = easing(t)
      window.scrollTo(0, startY + distance * eased)
      if (t < 1 && !signal.aborted) {
        raf = requestAnimationFrame(tick)
      } else if (!signal.aborted) {
        signal.removeEventListener('abort', onAbort)
        resolve()
      }
    }
    raf = requestAnimationFrame(tick)
  })
}

// ─── Easings ────────────────────────────────────────────────────
const EASINGS: Record<EasingName, (t: number) => number> = {
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outQuart: (t) => 1 - Math.pow(1 - t, 4),
  outQuint: (t) => 1 - Math.pow(1 - t, 5),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
}

const SCROLL_SPEED: Record<
  'gentle' | 'fast' | 'slow',
  {
    min: number
    max: number
    base: number
    perPx: number
    easing: EasingName
  }
> = {
  // Default — luxurious decelerate over an honest distance.
  gentle: { min: 900, max: 2200, base: 600, perPx: 0.85, easing: 'outQuart' },
  // Used for the "boost" scroll to the bottom of the page.
  fast: { min: 700, max: 1400, base: 350, perPx: 0.4, easing: 'outQuint' },
  // For very tiny focus shifts between adjacent sections.
  slow: { min: 1400, max: 2800, base: 900, perPx: 1.2, easing: 'inOutQuart' },
}
