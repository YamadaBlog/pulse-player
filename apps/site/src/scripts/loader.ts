import { $, $$ } from './lifecycle'
import { getLenis, gsap } from './motion'
import { stageLive, stageReady } from './stage/stage'
import { BEAT, EASE, EIGHTH, SIXTEENTH, THIRTY_SECOND } from './tempo'

/**
 * The first load of a visit (Loader.astro). The counter follows what has
 * really loaded — the typefaces, the stage (its shader and labels), then
 * every asset of the page — and never runs faster than a full turn in
 * MIN_RUN, so it reads as a counter, not a flash. At 100 the digits roll
 * away and the sleeve rises; `loaderLift` resolves as it starts rising, so
 * whatever waits for it (the hero's opening) begins behind the curtain.
 */
const MIN_RUN = BEAT * 1.75 // seconds, 0 → 100 at the fastest
const SAFETY = 8000 // ms: never keep the page behind the sleeve longer
const SEEN = 'pulse-loaded'

const html = document.documentElement
let lift: () => void = () => undefined
export const loaderLift: Promise<void> = new Promise((resolve) => (lift = resolve))

if (!html.classList.contains('loading')) lift()
else run()

function run(): void {
  const root = $('[data-loader]')
  const count = $('[data-loader-count]')
  const bar = $('[data-loader-bar]')
  if (!root || !count || !bar) return done()
  getLenis()?.stop()

  // The words appear with their own typefaces (or after 700 ms, whatever).
  const fonts = Promise.all([
    document.fonts.load('800 100px "Archivo Variable"'),
    document.fonts.load('500 12px "Geist Mono"'),
  ])
  void Promise.race([fonts, wait(700)]).then(() => html.classList.add('loader-fonts'))

  // What is loaded, 0..1: a little for being here, then fonts, stage, assets.
  let target = 0.08
  // (Rounded: 0.08 + 0.22 + 0.35 + 0.35 is not exactly 1 in floating point.)
  const add = (w: number) => (): void =>
    void (target = Math.min(1, Math.round((target + w) * 1000) / 1000))
  void fonts.then(add(0.22), add(0.22))
  const stage = new Promise<void>((resolve) => {
    const check = (): void => {
      if (!stageLive()) return resolve()
      void stageReady().then(() => resolve())
    }
    document.addEventListener('astro:page-load', check, { once: true })
  })
  void stage.then(add(0.35))
  const loaded =
    document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise<void>((r) => addEventListener('load', () => r(), { once: true }))
  void loaded.then(add(0.35))
  const safety = window.setTimeout(() => (target = 1), SAFETY)

  // The counter: eases towards the target, capped at a full turn per MIN_RUN.
  const cols = $$('.loader__col', count)
  let shown = 0
  let last = performance.now()
  let raf = 0
  const paint = (v: number): void => {
    // A mechanical counter: the units wheel rests on a digit and turns over
    // at the end of each unit; a wheel turns only while the one to its
    // right goes from 9 to 0 (the extra 0 at the bottom of each wheel).
    const f = v % 1
    const flip = f < 0.6 ? 0 : ((f - 0.6) / 0.4) ** 2 * (3 - (2 * (f - 0.6)) / 0.4)
    const units = (Math.floor(v) % 10) + flip
    const tens = (Math.floor(v / 10) % 10) + Math.max(0, units - 9)
    const hundreds = Math.floor(v / 100) + Math.max(0, tens - 9)
    ;[hundreds, tens, units].forEach((d, i) => {
      if (cols[i]) cols[i].style.transform = `translateY(${(-d * 100) / 11}%)`
    })
    bar.style.transform = `scaleX(${(v / 100).toFixed(4)})`
  }
  const tick = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const goal = target * 100
    const step = Math.min(
      goal - shown,
      (100 / MIN_RUN) * dt,
      Math.max(0.2, (goal - shown) * 6 * dt),
    )
    shown = Math.min(100, shown + Math.max(0, step))
    paint(shown)
    if (shown >= 99.95 && target >= 1) {
      paint(100)
      clearTimeout(safety)
      window.setTimeout(leave, EIGHTH * 1000)
      return
    }
    raf = requestAnimationFrame(tick)
  }
  paint(0)
  raf = requestAnimationFrame(tick)

  function leave(): void {
    cancelAnimationFrame(raf)
    const rolls = $$('.loader__roll', root!)
    // Whole digits leave, not their wheels (which would show other digits).
    const slots = $$('.loader__slot', count!)
    gsap
      .timeline({ onComplete: done })
      // The counter and the words roll away through their windows…
      .to(
        slots,
        {
          yPercent: -112,
          duration: SIXTEENTH * 1.5,
          ease: EASE.in,
          stagger: THIRTY_SECOND / 2,
        },
        0,
      )
      .to(
        rolls,
        { yPercent: -110, duration: SIXTEENTH, ease: EASE.in, stagger: THIRTY_SECOND / 2 },
        0,
      )
      // …and the sleeve rises; the page's opening starts under it.
      .add(() => {
        root!.style.pointerEvents = 'none'
        getLenis()?.start()
        lift()
      }, SIXTEENTH)
      .fromTo(
        root!,
        { clipPath: 'inset(0% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 100% 0%)', duration: BEAT, ease: EASE.inOut },
        SIXTEENTH,
      )
  }
}

function done(): void {
  html.classList.remove('loading', 'loader-fonts')
  getLenis()?.start()
  try {
    sessionStorage.setItem(SEEN, '1')
  } catch {
    /* storage unavailable: the sleeve shows again next time */
  }
  lift()
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
