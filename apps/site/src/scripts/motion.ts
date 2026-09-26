import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'
import { $$, onPage, reducedMotion } from './lifecycle'

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
  document.documentElement.classList.toggle('reduced', reducedMotion())
  syncLenis()
  // A fresh page starts at the top — or at the section its URL points to.
  const target = location.hash
    ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
    : null
  if (target) requestAnimationFrame(() => target.scrollIntoView())
  else lenis?.scrollTo(0, { immediate: true, force: true })

  if (reducedMotion() || document.querySelector('[data-still]')) return

  const ctx = gsap.context(() => {
    // Headlines: lines rise out of a mask, once.
    for (const el of $$('[data-split]')) {
      const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'line' })
      gsap.from(split.lines, {
        yPercent: 120,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.08,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      })
    }
    // Generic reveals.
    for (const el of $$('[data-reveal]')) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'expo.out',
        delay: Number(el.dataset.reveal || 0) * 0.08,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      })
    }
  })
  requestAnimationFrame(() => ScrollTrigger.refresh())
  return () => ctx.revert()
})
