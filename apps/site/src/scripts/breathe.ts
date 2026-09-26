import { subscribeFrames } from './audio'
import { $$, onPage, reducedMotion, whileVisible } from './lifecycle'

const MIN = 72
const MAX = 125
/** `data-breathe="100"` caps how wide a word may grow (where space is tight). */
const max = (el: HTMLElement): number => Number(el.dataset.breathe) || MAX

/**
 * Typography that listens: `[data-breathe]` words widen with the bass.
 * The box is sized for the widest cut up front (once fonts are in, and
 * again on resize), so the per-frame change never reflows the text around it.
 */
onPage(() => {
  const words = $$('[data-breathe]')
  if (!words.length || reducedMotion()) return

  const reserve = (): void => {
    for (const el of words) {
      const current = el.style.fontVariationSettings
      el.style.width = ''
      el.style.fontVariationSettings = `'wdth' ${max(el)}`
      el.style.width = `${Math.ceil(el.getBoundingClientRect().width)}px`
      el.style.fontVariationSettings = current || `'wdth' ${MIN}`
    }
  }
  void document.fonts?.ready.then(reserve)
  reserve()
  addEventListener('resize', reserve)

  const stops = words.map((el) =>
    whileVisible(el, () => {
      let current = MIN
      const top = max(el)
      return subscribeFrames((f) => {
        const target = MIN + Math.min(1, f.bass * 1.35) * (top - MIN)
        current += (target - current) * 0.35
        el.style.fontVariationSettings = `'wdth' ${current.toFixed(1)}`
      })
    }),
  )
  return () => {
    removeEventListener('resize', reserve)
    stops.forEach((stop) => stop())
  }
})
