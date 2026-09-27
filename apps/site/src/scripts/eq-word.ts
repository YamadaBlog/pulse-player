import { gsap } from 'gsap'
import { engine, subscribeFrames } from './audio'
import { $$, onPage, reducedMotion, whileVisible } from './lifecycle'
import { EASE, EIGHTH, THIRTY_SECOND } from './tempo'

/**
 * `[data-eq]` words are equalisers: each letter is a band group. While the
 * music plays, a letter's height follows its bands and its orange fill
 * rises and falls like a meter. At rest every letter is full height and
 * fully orange — the static design — so no frame differs from it by accident.
 * Only transforms and paint change: the line never reflows.
 */
const GROUPS: Array<[number, number]> = [
  [0, 3],
  [4, 8],
  [9, 13],
  [14, 18],
  [19, 23],
]

interface Letter {
  el: HTMLElement
  level: number // 0..1, drives height and fill
}

function paint(l: Letter): void {
  const v = Math.min(1, Math.max(0, l.level))
  // Height moves a little (the letters stay capitals); the fill carries the meter.
  l.el.style.transform = `scaleY(${(0.8 + 0.2 * v).toFixed(4)})`
  l.el.style.setProperty('--fill', `${(28 + 72 * v).toFixed(2)}%`)
}

export function eqSelfTest(root: ParentNode = document): void {
  // Power-on: the meter sweeps once, like a VU needle when the amp wakes.
  for (const word of $$('[data-eq]', root)) {
    const letters = (word as HTMLElement & { __eq?: Letter[] }).__eq
    if (!letters) continue
    letters.forEach((l, i) => {
      gsap.fromTo(
        l,
        { level: 1 },
        {
          keyframes: [
            { level: 0.35, duration: THIRTY_SECOND * 1.5, ease: EASE.out },
            { level: 1, duration: EIGHTH, ease: EASE.gentle },
          ],
          delay: i * THIRTY_SECOND * 0.6,
          onUpdate: () => paint(l),
        },
      )
    })
  }
}

onPage(() => {
  const words = $$('[data-eq]')
  if (!words.length) return
  const stops: Array<() => void> = []
  for (const word of words) {
    const text = word.textContent?.trim() ?? ''
    word.textContent = ''
    const letters: Letter[] = [...text].map((ch) => {
      const el = document.createElement('span')
      el.className = 'eq__l'
      el.textContent = ch
      word.append(el)
      return { el, level: 1 }
    })
    ;(word as HTMLElement & { __eq?: Letter[] }).__eq = letters
    letters.forEach(paint)
    if (reducedMotion()) continue

    let settling: gsap.core.Tween[] = []
    const settle = (): void => {
      settling.forEach((t) => t.kill())
      settling = letters.map((l) =>
        gsap.to(l, { level: 1, duration: EIGHTH, ease: EASE.gentle, onUpdate: () => paint(l) }),
      )
    }
    stops.push(
      whileVisible(word, () => {
        const off = subscribeFrames((f) => {
          if (!engine.state.isPlaying) return
          settling.forEach((t) => t.kill())
          settling = []
          letters.forEach((l, i) => {
            const [a, b] = GROUPS[i % GROUPS.length]!
            let sum = 0
            for (let k = a; k <= b; k++) sum += f.bands[k] ?? 0
            const target = Math.min(1, (sum / (b - a + 1)) * 1.35)
            l.level += (target - l.level) * 0.45
            paint(l)
          })
        })
        const offState = engine.onStateChange((s) => {
          if (!s.isPlaying) settle()
        })
        return () => {
          off()
          offState()
          settle()
        }
      }),
    )
  }
  return () => stops.forEach((s) => s())
})
