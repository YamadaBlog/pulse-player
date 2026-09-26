import { engine } from './audio'
import { $, $$, onPage } from './lifecycle'
import { getLenis } from './motion'
import { applyMood, currentMood } from './mood-store'

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
        if (lenis) lenis.scrollTo(el as HTMLElement, { offset: 0, duration: 1.6 })
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

const metrics = loadMetrics()

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

onPage(() => {
  // Which side of the record is under the header?
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting)
          root.dataset.side = (entry.target as HTMLElement).dataset.surface ?? 'a'
      }
    },
    { rootMargin: '0px 0px -96% 0px' },
  )
  $$('[data-surface]').forEach((el) => io.observe(el))

  void metrics.then((m) => {
    for (const el of $$('[data-metric]')) el.textContent = formatMetric(el.dataset.metric!, m)
  })

  for (const el of $$('[data-mood-follow]')) el.setAttribute('variant', currentMood())
  applyMood(currentMood(), { silent: true })

  return () => io.disconnect()
})
