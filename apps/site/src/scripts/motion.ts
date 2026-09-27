import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import { $$, onPage, reducedMotion } from './lifecycle'
import { BEAT, EASE, THIRTY_SECOND } from './tempo'

gsap.registerPlugin(ScrollTrigger, SplitText)

export { gsap, ScrollTrigger, SplitText }

/**
 * One Lenis instance for the whole visit (it survives page swaps), driven
 * by GSAP's ticker so scroll and scroll-linked animation share a frame.
 * Reduced motion: no smooth scroll at all — native scrolling.
 */
let lenis: Lenis | null = null

export function getLenis(): Lenis | null {
  return lenis
}

gsap.ticker.add((t) => lenis?.raf(t * 1000))
gsap.ticker.lagSmoothing(0)

/** Pages marked `data-still` (the specs) are for reading: native scrolling there. */
function syncLenis(): void {
  const wanted = !reducedMotion() && !document.querySelector('[data-still]')
  if (wanted && !lenis) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1, anchors: true })
    lenis.on('scroll', ScrollTrigger.update)
  } else if (!wanted && lenis) {
    lenis.destroy()
    lenis = null
  }
}

onPage(() => {
  const html = document.documentElement
  html.classList.toggle('reduced', reducedMotion())
  // Entrances are armed from here on. If the scripts arrived so late that
  // the page was already shown statically (Base.astro), leave it that way.
  html.classList.add('booted')
  const still = html.classList.contains('static')
  syncLenis()
  // A fresh page starts at the top — or at the section its URL points to.
  const target = location.hash
    ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
    : null
  if (target) requestAnimationFrame(() => target.scrollIntoView())
  else lenis?.scrollTo(0, { immediate: true, force: true })

  if (still || reducedMotion() || document.querySelector('[data-still]')) {
    for (const el of $$('[data-split]')) el.classList.add('is-split')
    return
  }

  let alive = true
  const ctx = gsap.context(() => {
    // Chapter openings: the needle line draws, the labels land (CSS does the
    // moving; this only says when).
    for (const el of $$('.track-head')) {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: () => el.classList.add('is-cued'),
      })
    }
    // Generic reveals: a beat long, a thirty-second apart.
    for (const el of $$('[data-reveal]')) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: BEAT,
        ease: EASE.out,
        delay: Number(el.dataset.reveal || 0) * THIRTY_SECOND,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      })
    }
  })
  // Headlines: lines rise out of their masks, once — a beat, a thirty-second
  // apart. Split only with the real fonts in, so the lines are the real ones;
  // until then the headline is held invisible (global.css), never shown and
  // then taken away.
  void document.fonts.ready.then(() => {
    if (!alive) return
    ctx.add(() => {
      for (const el of $$('[data-split]')) {
        const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' })
        gsap.set(split.lines, { yPercent: 120 })
        el.classList.add('is-split')
        gsap.to(split.lines, {
          yPercent: 0,
          duration: BEAT,
          ease: EASE.out,
          stagger: THIRTY_SECOND,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      }
    })
    ScrollTrigger.refresh()
  })
  requestAnimationFrame(() => ScrollTrigger.refresh())
  return () => {
    alive = false
    // The page is being swapped out: stop the tweens and triggers, but don't
    // spend the transition restoring (un-splitting) a DOM that is going away.
    ctx.kill()
  }
})
