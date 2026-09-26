import type { Directive } from 'vue'

let observer: IntersectionObserver | null = null

function getObserver(): IntersectionObserver {
  return (observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-revealed')
        observer?.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
  ))
}

/**
 * `v-reveal` / `v-reveal="2"` — fades an element in the first time it
 * scrolls into view; the number staggers siblings. One observer serves
 * the whole page, and reduced motion is handled in CSS.
 */
export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, { value }) {
    el.dataset.reveal = ''
    if (value) el.style.setProperty('--i', String(value))
    if (typeof IntersectionObserver === 'undefined') el.classList.add('is-revealed')
    else getObserver().observe(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
}
