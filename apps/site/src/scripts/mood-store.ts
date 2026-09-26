import { VARIANTS, type NamedVariant } from '@pulse-music/tokens'

const KEY = 'pulse-site-mood'
const HEARD = 'pulse-site-moods-heard'

export const MOODS = Object.keys(VARIANTS) as NamedVariant[]

export function currentMood(): NamedVariant {
  try {
    const saved = localStorage.getItem(KEY) as NamedVariant | null
    if (saved && saved in VARIANTS) return saved
  } catch {
    /* storage unavailable */
  }
  return 'auto'
}

export function moodsHeard(): Set<NamedVariant> {
  try {
    return new Set(JSON.parse(localStorage.getItem(HEARD) ?? '[]') as NamedVariant[])
  } catch {
    return new Set()
  }
}

/**
 * Apply a mood to every player that follows the page mood, and expose its
 * tokens as CSS variables so the page itself can be retinted.
 */
export function applyMood(name: NamedVariant, { silent = false } = {}): Set<NamedVariant> {
  const tokens = VARIANTS[name]
  const style = document.documentElement.style
  style.setProperty('--mood-bg', tokens.background)
  style.setProperty('--mood-surface', tokens.surface)
  style.setProperty('--mood-fg', tokens.foreground)
  style.setProperty('--mood-accent', tokens.accent)
  document.documentElement.dataset.mood = name
  for (const el of document.querySelectorAll('[data-mood-follow]')) el.setAttribute('variant', name)
  const heard = moodsHeard()
  if (!silent) {
    heard.add(name)
    try {
      localStorage.setItem(KEY, name)
      localStorage.setItem(HEARD, JSON.stringify([...heard]))
    } catch {
      /* storage unavailable */
    }
  }
  return heard
}
