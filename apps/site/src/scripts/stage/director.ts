import { $, $$, onPage, reducedMotion } from '../lifecycle'
import { gsap, type ScrollTrigger } from '../motion'
import type { Shot, Vec3 } from './camera'
import { mountStage, onStageFrame, stage, start, stop, unmountStage } from './stage'

/**
 * The director decides where the camera is, as a pure function of the
 * scroll position — every frame of every scroll position is defined.
 *
 *   hero    the record lies where the layout puts `[data-record]`: the
 *           camera straight above, the page as the table (a docked shot);
 *   detach  as the hero scrolls away, the record glides to its first mark;
 *   tour    while the tour is pinned, its keys (Tour.astro) move the camera
 *           around the record and re-light the room;
 *   dock    at the end the camera lies flat again over `[data-stage-dock]`,
 *           and the record leaves with the page.
 *
 * Framing is in CSS px, written as functions of the viewport so every
 * screen gets the same shot.
 */
export interface Room {
  floor: Vec3
  fog: Vec3
  light: Vec3
  glow: number
}
export interface Key {
  at: number // tour progress, 0..1
  shot: (vw: number, vh: number) => Shot
  depth: number
  ease?: (t: number) => number
}
export interface RoomKey {
  at: number
  room: Room
}
export interface Tour {
  trigger: ScrollTrigger
  keys: Key[]
  rooms: RoomKey[]
  dock: HTMLElement
  section: HTMLElement
  drift: number
}

const PAPER: Vec3 = [236 / 255, 231 / 255, 220 / 255]
export const PAPER_ROOM: Room = { floor: PAPER, fog: PAPER, light: [1, 1, 1], glow: 0 }
const FLAT = { az: 0, el: Math.PI / 2, dist: 8 }

/**
 * The opening (Hero.astro): a shot the camera starts from and cranes out of.
 * k = 1 is the opening's shot, 0 the director's own; drift spins the record.
 */
export const intro: { k: number; drift: number; shot: ((vw: number, vh: number) => Shot) | null } =
  {
    k: 0,
    drift: 0,
    shot: null,
  }

let tour: Tour | null = null
/** The tour hands its choreography to the director. */
export function setTour(t: Tour | null): void {
  tour = t
}

/**
 * The interlude (Flip.astro): past the tour, when its box comes near, the
 * record lies in it — the same record, filling the box. Its timeline tilts
 * the camera (el) and deepens the room while the record turns over.
 */
export const flip: { dock: HTMLElement | null; el: number; depth: number } = {
  dock: null,
  el: Math.PI / 2,
  depth: 0,
}

onPage(() => {
  const canvas = $<HTMLCanvasElement>('[data-stage] canvas')
  const anchor = $('[data-record]')
  const html = document.documentElement
  if (!canvas || !anchor) return
  const live = mountStage(canvas)
  html.classList.toggle('staged', live)
  if (!live) {
    anchor.classList.add('is-fallback')
    return
  }

  const frame = (): void => {
    if ((window as unknown as { __stageHold?: boolean }).__stageHold) return
    stage.roll = (-Number(gsap.getProperty(anchor, 'rotation')) * Math.PI) / 180
    const t = tour
    const vw = innerWidth
    const vh = innerHeight
    // The interlude, once its box is near (the stage is hidden in between:
    // no window shows it, so the change of place is never seen).
    const f = flip.dock
    if (
      f &&
      (!t || t.trigger.scroll() > t.trigger.end) &&
      f.getBoundingClientRect().top < vh * 1.4
    ) {
      Object.assign(stage.shot, { ...docked(f, 0.5), el: flip.el })
      stage.depth = flip.depth
      stage.drift = 0
      Object.assign(stage.room, PAPER_ROOM)
      return
    }
    if (!t || reducedMotion()) {
      let shot = docked(anchor)
      if (intro.k > 0 && intro.shot) shot = mixShot(shot, intro.shot(vw, vh), intro.k)
      Object.assign(stage.shot, shot)
      stage.depth = intro.k
      stage.drift = intro.drift
      Object.assign(stage.room, PAPER_ROOM)
      return
    }
    const y = t.trigger.scroll()
    const { start: pinStart, end: pinEnd } = t.trigger
    const first = t.keys[0]!
    let shot: Shot
    let depth = 0
    if (y <= pinStart) {
      // Detach: from the hero's box to the first mark, flat all the way.
      const k = EASE_IN_OUT(clamp(y / Math.max(1, pinStart), 0, 1))
      shot = mixShot(docked(anchor), first.shot(vw, vh), k)
      depth = first.depth * k
    } else if (y >= pinEnd) {
      shot = docked(t.dock)
    } else {
      ;({ shot, depth } = sample(t.keys, (y - pinStart) / (pinEnd - pinStart), vw, vh, t.dock))
    }
    if (intro.k > 0 && intro.shot) {
      shot = mixShot(shot, intro.shot(vw, vh), intro.k)
      depth = mix(depth, 1, intro.k)
    }
    Object.assign(stage.shot, shot)
    stage.depth = depth
    stage.drift = Math.max(intro.drift, y > 0 && y < pinEnd ? t.drift : 0)
    const p = clamp((y - pinStart) / Math.max(1, pinEnd - pinStart), 0, 1)
    Object.assign(stage.room, sampleRoom(t.rooms, p))
    // The header reads the room: dark rooms are side B.
    const dark = luminance(stage.room.floor) < 0.3 && y > pinStart && y < pinEnd
    const side = dark ? 'b' : 'a'
    if (t.section.dataset.surface !== side) {
      t.section.dataset.surface = side
      t.section.dispatchEvent(new CustomEvent('surface:change', { bubbles: true }))
    }
  }
  const offFrame = onStageFrame(frame)

  // Run only while a window onto the stage is visible.
  const visible = new Set<Element>()
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) visible.add(e.target)
      else visible.delete(e.target)
    }
    if (visible.size) start()
    else stop()
  })
  $$('[data-stage-window]').forEach((el) => io.observe(el))

  return () => {
    io.disconnect()
    offFrame()
    unmountStage()
    html.classList.remove('staged')
  }
})

/**
 * A docked shot: flat, the disc's radius 45 % of the box (the flat
 * record's proportions). The box may be moved (and turned) by the
 * opening: its centre follows the transform, its size is the layout's.
 */
function docked(el: HTMLElement, fill = 0.45): Shot {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: el.offsetWidth * fill, ...FLAT }
}

// ─── Interpolation ─────────────────────────────────────────────────
const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v))
const EASE_IN_OUT = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const mix = (a: number, b: number, t: number): number => a + (b - a) * t
const mixV = (a: Vec3, b: Vec3, t: number): Vec3 => [
  mix(a[0], b[0], t),
  mix(a[1], b[1], t),
  mix(a[2], b[2], t),
]
function mixShot(a: Shot, b: Shot, t: number): Shot {
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    // Size in log space too: a zoom is perceived geometrically, and a
    // record growing linearly would sweep through the words beside it.
    r: Math.exp(mix(Math.log(Math.max(a.r, 1e-3)), Math.log(Math.max(b.r, 1e-3)), t)),
    az: mix(a.az, b.az, t),
    el: mix(a.el, b.el, t),
    // Distance in log space: a dolly feels even at every range.
    dist: Math.exp(mix(Math.log(a.dist), Math.log(b.dist), t)),
  }
}

/** The shot at tour progress p; the last key lands on the dock. */
function sample(
  keys: Key[],
  p: number,
  vw: number,
  vh: number,
  dock: HTMLElement,
): { shot: Shot; depth: number } {
  const last = keys.length - 1
  const at = (i: number): Shot => (i === last ? docked(dock) : keys[i]!.shot(vw, vh))
  let i = 0
  while (i < last - 1 && p > keys[i + 1]!.at) i++
  const a = keys[i]!
  const b = keys[i + 1]!
  const t = clamp((p - a.at) / Math.max(1e-6, b.at - a.at), 0, 1)
  const e = (b.ease ?? EASE_IN_OUT)(t)
  return { shot: mixShot(at(i), at(i + 1), e), depth: mix(a.depth, b.depth, e) }
}

function sampleRoom(rooms: RoomKey[], p: number): Room {
  if (!rooms.length) return PAPER_ROOM
  let i = 0
  while (i < rooms.length - 2 && p > rooms[i + 1]!.at) i++
  const a = rooms[i]!
  const b = rooms[i + 1] ?? a
  const t = EASE_IN_OUT(clamp((p - a.at) / Math.max(1e-6, b.at - a.at), 0, 1))
  return {
    floor: mixV(a.room.floor, b.room.floor, t),
    fog: mixV(a.room.fog, b.room.fog, t),
    light: mixV(a.room.light, b.room.light, t),
    glow: mix(a.room.glow, b.room.glow, t),
  }
}

const luminance = (c: Vec3): number => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
