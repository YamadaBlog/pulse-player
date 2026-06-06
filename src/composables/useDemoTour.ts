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

export type EasingName =
  | 'inOutCubic'
  | 'outQuart'
  | 'outQuint'
  | 'inOutQuart'
  | 'outExpo'

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
  const currentStep: Ref<number> = ref(0)
  const totalSteps: Ref<number> = ref(0)
  const title: Ref<string> = ref('')
  const message: Ref<string> = ref('')
  const progress: Ref<number> = ref(0)

  let controller: AbortController | null = null
  let pendingCleanup: (() => void) | null = null

  async function start(steps: DemoStep[], opts: DemoStartOptions = {}) {
    if (isRunning.value) return
    controller = new AbortController()
    const signal = controller.signal

    pendingCleanup = opts.onStop ?? null
    isRunning.value = true
    totalSteps.value = steps.length
    currentStep.value = 0
    progress.value = 0
    title.value = ''
    message.value = ''

    const ctx: DemoStepContext = {
      signal,
      delay: (ms) => abortableDelay(ms, signal),
      tween: (setter, from, to, ms, easing = 'outQuart') =>
        abortableTween(setter, from, to, ms, EASINGS[easing], signal),
      scrollTo: (target, opts) => abortableScrollTo(target, signal, opts),
      setMessage: (m) => { message.value = m },
    }

    try {
      for (let i = 0; i < steps.length; i++) {
        if (signal.aborted) return
        currentStep.value = i
        title.value = steps[i].title
        progress.value = i / steps.length
        await steps[i].run(ctx)
      }
      progress.value = 1
    } catch (err: unknown) {
      // Swallow abort errors (user clicked Stop). Anything else is logged.
      const e = err as { name?: string }
      if (e?.name !== 'AbortError' && !signal.aborted) {
        // eslint-disable-next-line no-console
        console.error('[useDemoTour] step failed:', err)
      }
    } finally {
      const cleanup = pendingCleanup
      pendingCleanup = null
      controller = null
      isRunning.value = false
      currentStep.value = 0
      title.value = ''
      message.value = ''
      progress.value = 0
      try { cleanup?.() } catch { /* ignore cleanup errors */ }
    }
  }

  function stop() {
    if (controller) controller.abort()
  }

  return {
    start,
    stop,
    isRunning: computed(() => isRunning.value),
    currentStep: computed(() => currentStep.value),
    totalSteps: computed(() => totalSteps.value),
    title: computed(() => title.value),
    message: computed(() => message.value),
    progress: computed(() => progress.value),
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function abortError(): Error {
  const e = new Error('Demo aborted')
  e.name = 'AbortError'
  return e
}

function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(abortError()); return }
    const timer = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(abortError())
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function abortableTween(
  setter: (n: number) => void,
  from: number,
  to: number,
  duration: number,
  easing: (t: number) => number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(abortError()); return }
    const startTime = performance.now()
    let raf = 0
    const onAbort = () => {
      cancelAnimationFrame(raf)
      reject(abortError())
    }
    signal.addEventListener('abort', onAbort, { once: true })
    function tick(now: number) {
      const t = Math.min(1, (now - startTime) / duration)
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
  opts: ScrollToOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(abortError()); return }
    const el =
      typeof target === 'string' ? document.querySelector(target) : target
    if (!el) { resolve(); return }
    const offsetTop = opts.offset ?? window.innerHeight * 0.18
    const rect = (el as Element).getBoundingClientRect()
    const targetY = Math.max(0, rect.top + window.scrollY - offsetTop)
    const startY = window.scrollY
    const distance = targetY - startY
    if (Math.abs(distance) < 4) { resolve(); return }
    // Premium scroll feel: longer baselines, deceleration easings.
    const speed = opts.speed ?? 'gentle'
    const speedProfile = SCROLL_SPEED[speed]
    const duration = Math.max(
      speedProfile.min,
      Math.min(speedProfile.max, speedProfile.base + Math.abs(distance) * speedProfile.perPx),
    )
    const easing = EASINGS[opts.easing ?? speedProfile.easing]
    const startTime = performance.now()
    let raf = 0
    const onAbort = () => {
      cancelAnimationFrame(raf)
      reject(abortError())
    }
    signal.addEventListener('abort', onAbort, { once: true })
    function tick(now: number) {
      const t = Math.min(1, (now - startTime) / duration)
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
  outQuart:   (t) => 1 - Math.pow(1 - t, 4),
  outQuint:   (t) => 1 - Math.pow(1 - t, 5),
  inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
  outExpo:    (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
}

const SCROLL_SPEED: Record<'gentle' | 'fast' | 'slow', {
  min: number
  max: number
  base: number
  perPx: number
  easing: EasingName
}> = {
  // Default — luxurious decelerate over an honest distance.
  gentle: { min: 900, max: 2200, base: 600, perPx: 0.85, easing: 'outQuart' },
  // Used for the "boost" scroll to the bottom of the page.
  fast:   { min: 700, max: 1400, base: 350, perPx: 0.40, easing: 'outQuint' },
  // For very tiny focus shifts between adjacent sections.
  slow:   { min: 1400, max: 2800, base: 900, perPx: 1.20, easing: 'inOutQuart' },
}
