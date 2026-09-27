import { engine } from './audio'
import { $, $$, onPage, reducedMotion } from './lifecycle'
import { getLenis, gsap } from './motion'
import { applyMood, currentMood } from './mood-store'
import { createRoll } from './roll'
import { BEAT, EASE } from './tempo'

const root = document.documentElement

// ─── Now playing (header ticker + html[data-playing]) ────────────
engine.onStateChange((s) => {
  root.toggleAttribute('data-playing', s.isPlaying)
  const now = $('[data-now]')
  const t = engine.track
  if (!now || !t) return
  now.textContent = s.isPlaying
    ? `Now playing — ${t.title} · ${t.artist ?? ''}`
    : s.hasBeenOpened
      ? `Paused — ${t.title}`
      : 'Side A · ready'
})

// ─── Tracklist dialog ─────────────────────────────────────────────
function closeTracklist(dialog: HTMLDialogElement, then?: () => void): void {
  if (!dialog.open) return then?.()
  dialog.classList.add('is-closing')
  const done = (): void => {
    dialog.classList.remove('is-closing')
    dialog.close()
    then?.()
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) done()
  else dialog.addEventListener('animationend', done, { once: true })
}

document.addEventListener('click', (e) => {
  const target = e.target as Element
  const dialog = $<HTMLDialogElement>('[data-tracklist]')
  if (!dialog) return
  if (target.closest('[data-tracklist-open]')) {
    dialog.showModal()
    return
  }
  if (target.closest('[data-tracklist-close]')) {
    closeTracklist(dialog)
    return
  }
  const link = target.closest<HTMLAnchorElement>('[data-tracklist-link]')
  if (link) {
    const url = new URL(link.href)
    if (url.pathname === location.pathname && url.hash) {
      e.preventDefault()
      closeTracklist(dialog, () => {
        const el = document.querySelector(url.hash)
        if (!el) return
        const lenis = getLenis()
        if (lenis)
          lenis.scrollTo(el as HTMLElement, {
            offset: 0,
            duration: BEAT * 2,
            easing: gsap.parseEase(EASE.inOut),
          })
        else el.scrollIntoView()
        ;(el as HTMLElement).focus?.({ preventScroll: true })
      })
    } else {
      closeTracklist(dialog)
    }
  }
})
document.addEventListener(
  'cancel',
  (e) => {
    const dialog = e.target as HTMLDialogElement
    if (dialog.matches?.('[data-tracklist]')) {
      e.preventDefault()
      closeTracklist(dialog)
    }
  },
  true,
)

// ─── Contextual cursor tag (fine pointers only) ───────────────────
if (matchMedia('(pointer: fine)').matches) {
  let x = 0
  let y = 0
  let cx = 0
  let cy = 0
  let raf = 0
  const move = (): void => {
    cx += (x - cx) * 0.22
    cy += (y - cy) * 0.22
    const tag = $('.cursor-tag')
    if (tag) tag.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.3 ? requestAnimationFrame(move) : 0
  }
  document.addEventListener('pointermove', (e) => {
    x = e.clientX
    y = e.clientY
    const tag = $('.cursor-tag')
    const host = (e.target as Element).closest?.<HTMLElement>('[data-cursor]')
    if (tag) {
      tag.toggleAttribute('data-on', !!host)
      if (host) tag.firstElementChild!.textContent = host.dataset.cursor ?? ''
    }
    if (!raf) raf = requestAnimationFrame(move)
  })
}

// ─── Live repository metrics (GitHub + npm), cached for 30 min ────
interface Metrics {
  stars: number | null
  forks: number | null
  issues: number | null
  pushed: string | null
  downloads: number | null
  version: string | null
}
const CACHE = 'pulse-site-metrics'

async function loadMetrics(): Promise<Metrics> {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE) ?? 'null') as {
      at: number
      m: Metrics
    } | null
    if (cached && Date.now() - cached.at < 30 * 60 * 1000) return cached.m
  } catch {
    /* storage unavailable */
  }
  const get = async <T>(url: string): Promise<T | null> => {
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      return res.ok ? ((await res.json()) as T) : null
    } catch {
      return null
    }
  }
  const [repo, npm, pkg] = await Promise.all([
    get<{
      stargazers_count: number
      forks_count: number
      open_issues_count: number
      pushed_at: string
    }>('https://api.github.com/repos/YamadaBlog/pulse-player'),
    get<{ downloads: number }>(
      'https://api.npmjs.org/downloads/point/last-month/@pulse-music/web-component',
    ),
    get<{ version: string }>('https://registry.npmjs.org/@pulse-music/web-component/latest'),
  ])
  const m: Metrics = {
    stars: repo?.stargazers_count ?? null,
    forks: repo?.forks_count ?? null,
    issues: repo?.open_issues_count ?? null,
    pushed: repo?.pushed_at ?? null,
    downloads: npm?.downloads ?? null,
    version: pkg?.version ?? null,
  }
  try {
    sessionStorage.setItem(CACHE, JSON.stringify({ at: Date.now(), m }))
  } catch {
    /* storage unavailable */
  }
  return m
}

export const metrics = loadMetrics()

function formatMetric(key: string, m: Metrics): string {
  switch (key) {
    case 'stars':
      return m.stars === null ? '—' : String(m.stars)
    case 'stars-badge':
      return m.stars ? `★ ${m.stars}` : ''
    case 'pushed':
      return m.pushed
        ? new Date(m.pushed).toLocaleDateString('en', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '—'
    default: {
      const v = m[key as keyof Metrics]
      return v === null || v === undefined ? '—' : String(v)
    }
  }
}

// ─── Page transitions: the new page spreads from where you acted ──
// Same grammar as the mood wipes. The origin is the pointer, or the link
// itself when navigating from the keyboard; it is re-applied after the swap
// (the new document's <html> replaces the old one's attributes).
let vtOrigin: { x: number; y: number } | null = null
document.addEventListener(
  'click',
  (e) => {
    const a = (e.target as Element).closest?.('a[href]')
    if (!a) return
    if (e.detail === 0 || (e.clientX === 0 && e.clientY === 0)) {
      const r = a.getBoundingClientRect()
      vtOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    } else vtOrigin = { x: e.clientX, y: e.clientY }
  },
  true,
)
function applyVtOrigin(): void {
  const { x, y } = vtOrigin ?? { x: innerWidth / 2, y: innerHeight / 2 }
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const st = document.documentElement.style
  st.setProperty('--vt-x', `${x}px`)
  st.setProperty('--vt-y', `${y}px`)
  st.setProperty('--vt-r', `${Math.ceil(r)}px`)
}
document.addEventListener('astro:before-preparation', applyVtOrigin)
// The swap replaces <html>'s attributes with the new document's (the head
// script doesn't run again): put back what this visit has established before
// the new page's first frame — the reveal is already running over it.
document.addEventListener('astro:after-swap', () => {
  cut() // the new page brings its own side: no fade under the reveal
  root.classList.add('js')
  root.classList.toggle('reduced', reducedMotion())
  root.toggleAttribute('data-playing', engine.state.isPlaying)
  applyMood(currentMood(), { silent: true })
  applyVtOrigin()
  vtOrigin = null
})

// ─── The header's side: a cut, not a fade ─────────────────────────
let uncut = 0
function cut(): void {
  cancelAnimationFrame(uncut)
  root.classList.add('side-cut')
  // Transitions come back once the new side has been painted.
  uncut = requestAnimationFrame(() => {
    uncut = requestAnimationFrame(() => root.classList.remove('side-cut'))
  })
}
function setSide(side: string): void {
  if (root.dataset.side === side) return
  cut()
  root.dataset.side = side
}

// ─── Where the needle is: current track + playhead ────────────────
const playheadFallback = !CSS.supports?.('animation-timeline: scroll()')
function syncPlayhead(): void {
  const bar = $('[data-playhead]')
  if (!bar || !playheadFallback) return
  const max = document.documentElement.scrollHeight - innerHeight
  bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`
}
if (playheadFallback) addEventListener('scroll', syncPlayhead, { passive: true })

// The header's track code rolls like the counter on a tape deck. (The
// header persists across pages, so one roll serves the whole visit.)
let rollTrack: ReturnType<typeof createRoll> | null = null
let knownTrack = false
function showTrack(code: string): void {
  const slot = $('[data-now-track]')
  if (!slot || !code) return
  rollTrack ??= createRoll(slot)
  rollTrack(code, !knownTrack)
  knownTrack = true
}

onPage(() => {
  syncPlayhead()
  // The chapter crossing the middle of the screen is the current track.
  const tracks = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) showTrack((e.target as HTMLElement).dataset.track ?? '')
    },
    { rootMargin: '-50% 0px -49% 0px' },
  )
  $$('[data-track]').forEach((el) => tracks.observe(el))
  const first = $('[data-track]')
  if (first && scrollY < 10) showTrack(first.dataset.track ?? '')

  // Which side of the record is under the header? A section can also change
  // side while it sits there (the interlude's flip): it says so.
  let under: HTMLElement | null = null
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        under = entry.target as HTMLElement
        setSide(under.dataset.surface ?? 'a')
      }
    },
    { rootMargin: '0px 0px -96% 0px' },
  )
  $$('[data-surface]').forEach((el) => io.observe(el))
  const onSurface = (e: Event): void => {
    if (under && e.target === under) setSide(under.dataset.surface ?? 'a')
  }
  document.addEventListener('surface:change', onSurface)

  void metrics.then((m) => {
    // Counted cells (the matrix) count up in their own chapter.
    for (const el of $$('[data-metric]:not([data-count])'))
      el.textContent = formatMetric(el.dataset.metric!, m)
  })

  for (const el of $$('[data-mood-follow]')) el.setAttribute('variant', currentMood())
  applyMood(currentMood(), { silent: true })

  return () => {
    io.disconnect()
    tracks.disconnect()
    document.removeEventListener('surface:change', onSurface)
  }
})
