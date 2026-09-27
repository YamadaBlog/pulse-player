import { engine, frame } from '../audio'
import { createSurface, hexToRgb, uploadTexture, type Surface } from '../gl'
import { drawLabel, drawLabelB } from '../record-label'
import { gsap } from '../motion'
import {
  cameraFor,
  mul3,
  rayAt,
  project,
  rotation,
  type Camera,
  type Shot,
  type Vec3,
} from './camera'
import { STAGE_FRAG } from './shader'

/**
 * One scene behind the page: the record, its tonearm, the paper they lie on.
 * A fixed canvas under the content (z-index -1): sections with a background
 * cover it, the transparent ones (the hero, the tour, the interlude) are
 * windows onto it. It renders on GSAP's ticker — the same frame as Lenis
 * and ScrollTrigger — so the record never lags a frame behind the page.
 *
 * Everyone who moves something writes to `stage` (the director frames the
 * camera, the needle swings the arm, the record's physics spin it); the
 * stage only reads the state and draws.
 */
export interface StageState {
  shot: Shot
  rot: number // spin, rad
  roll: number // an extra turn of the picture (the record rolling out of its sleeve)
  tilt: { x: number; y: number } // the hand's tilt, rad
  flip: number // turn about the screen's vertical axis (π: side B up)
  lift: number // the record's height above the page, in radii
  arm: { swing: number; lift: number; on: number } // swing in degrees
  ring: { x: number; z: number; r: number; a: number }
  sheen: number // where the grooves catch the light, rad (screen angle)
  depth: number // 0: the flat page .. 1: a room
  flood: number // the night on the floor, radius; < 0: none
  night: number // 0 .. 1: the far wall's colour follows
  room: { floor: Vec3; fog: Vec3; light: Vec3; glow: number } // the room's colours
  drift: number // a slow turn when no music plays (rad/s), set by the director
  demo: number // 0..1: the grooves shimmer as if music played (the tour's last shot)
}

export const stage: StageState = {
  shot: { x: 0, y: 0, r: 100, az: 0, el: Math.PI / 2, dist: 8 },
  rot: 0,
  roll: 0,
  tilt: { x: 0, y: 0 },
  flip: 0,
  lift: 0.1,
  arm: { swing: -24, lift: 1, on: 1 },
  ring: { x: 0, z: 0, r: 0, a: 0 },
  sheen: 2.2,
  depth: 0,
  flood: -1,
  night: 0,
  room: { floor: hexToRgb('#ece7dc'), fog: hexToRgb('#ece7dc'), light: [1, 1, 1], glow: 0 },
  drift: 0,
  demo: 0,
}

// The key light (shading and shadows) comes from the upper left of the page.
const KEY: Vec3 = normalize([-0.333, 1, -0.556])
// The tonearm's base, relative to the record's centre (from the flat arm).
export const PIVOT: [number, number] = [1.104, -1.016]
const NIGHT = hexToRgb('#0c0b0a')
const SIGNAL = hexToRgb('#ff4f1a')

let surface: Surface | null = null
let canvas: HTMLCanvasElement | null = null
let running = false
let cam: Camera | null = null
let labelsReady: Promise<void> | null = null
let sizeObserver: ResizeObserver | null = null
let cssSize: [number, number] = [1, 1]
let dirty = true
const listeners = new Set<(now: number) => void>()

/** Mount the stage on a canvas. Returns false when WebGL2 is not there. */
export function mountStage(el: HTMLCanvasElement): boolean {
  if (surface && canvas === el) return true
  unmountStage()
  try {
    surface = createSurface(el, STAGE_FRAG, 1.5, true)
  } catch (error) {
    console.warn('[pulse-site] stage disabled:', error)
    surface = null
  }
  if (!surface) return false
  canvas = el
  const { gl } = surface
  const s = surface
  // The program compiles in parallel (gl.ts): the constants and the labels
  // go in once it is linked. Until then nothing is drawn — and the loading
  // sleeve counts the wait instead of the page freezing.
  labelsReady = Promise.all([s.ready, drawLabel(), drawLabelB()])
    .then(([, a, b]) => {
      if (surface !== s) return
      gl.uniform3fv(s.u('uInk'), NIGHT)
      gl.uniform3fv(s.u('uAccent'), SIGNAL)
      gl.uniform3fv(s.u('uLight'), KEY)
      gl.uniform1i(s.u('uLabel'), 0)
      gl.uniform1i(s.u('uLabelB'), 1)
      gl.uniform1i(s.u('uSamples'), 4)
      uploadTexture(gl, a, 0)
      uploadTexture(gl, b, 1)
      dirty = true
    })
    .catch((error: unknown) => {
      console.warn('[pulse-site] stage disabled:', error)
      el.style.visibility = 'hidden'
    })
  // The canvas's size in CSS px, observed rather than read every frame.
  sizeObserver = new ResizeObserver(([entry]) => {
    if (!entry) return
    cssSize = [entry.contentRect.width, entry.contentRect.height]
    dirty = true
  })
  sizeObserver.observe(el)
  cssSize = [el.clientWidth, el.clientHeight]
  // ?stage-debug: the state on window, to frame shots from the console.
  if (location.search.includes('stage-debug'))
    (window as unknown as { __stage: StageState }).__stage = stage
  return true
}

export function unmountStage(): void {
  stop()
  sizeObserver?.disconnect()
  sizeObserver = null
  surface?.dispose()
  surface = null
  canvas = null
}

export const stageReady = (): Promise<void> => labelsReady ?? Promise.resolve()
export const stageLive = (): boolean => !!surface

/** Called every frame before drawing (physics, the director's framing…). */
export function onStageFrame(fn: (now: number) => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// ─── Render on demand ─────────────────────────────────────────────
// Every frame the physics and the director update `stage`; the picture is
// drawn only if something it shows has changed (or the music moves it).
// At rest the page costs nothing on the GPU.
const last = new Float64Array(40)
const next = new Float64Array(40)
function changed(): boolean {
  const { shot, arm, ring, room, tilt } = stage
  const v = [
    shot.x,
    shot.y,
    shot.r,
    shot.az,
    shot.el,
    shot.dist,
    stage.rot + stage.roll,
    tilt.x,
    tilt.y,
    stage.flip,
    stage.lift,
    arm.swing,
    arm.lift,
    arm.on,
    ring.x,
    ring.z,
    ring.r,
    ring.a,
    stage.sheen,
    stage.depth,
    stage.flood,
    stage.night,
    ...room.floor,
    ...room.fog,
    ...room.light,
    room.glow,
    cssSize[0],
    cssSize[1],
    scale,
  ]
  let diff = false
  for (let i = 0; i < v.length; i++) {
    next[i] = v[i]!
    if (Math.abs(next[i]! - last[i]!) > 1e-6) diff = true
  }
  if (diff) last.set(next)
  return diff
}

// ─── Adaptive density: the frame rate, not a guess ────────────────
// GPU time can't be read from JavaScript, so the interval between frames
// that drew is the signal: sustained drops step the density down (never
// below 60 %), a long clean run steps it back up.
const STEPS = [1, 0.85, 0.72, 0.6]
let step = 0
let scale = 1
let lastFrame = 0
const intervals: number[] = []
function adapt(now: number): void {
  const dt = now - lastFrame
  lastFrame = now
  if (dt <= 0 || dt > 250) return // a pause, not a slow frame
  intervals.push(dt)
  if (intervals.length < 45) return
  const sorted = [...intervals].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]!
  intervals.length = 0
  if (median > 21 && step < STEPS.length - 1) step++
  else if (median < 15 && step > 0 && ++calm > 6) {
    step--
    calm = 0
  }
  scale = STEPS[step]!
}
let calm = 0

function tick(): void {
  if (!surface || !canvas || !surface.isReady()) return
  const now = performance.now()
  for (const fn of listeners) fn(now)
  const animated = engine.state.isPlaying || stage.demo > 0
  if (!changed() && !animated && !dirty) {
    lastFrame = 0
    return
  }
  dirty = false
  adapt(now)
  render(now)
}

export function start(): void {
  if (running || !surface) return
  running = true
  dirty = true // the canvas was hidden: draw the current state first
  gsap.ticker.add(tick)
  // Never a frame with a blank label: the canvas shows once they are in,
  // and the first time it lights up (a sixteenth), like a lamp.
  const el = canvas
  void stageReady().then(() => {
    if (!running || canvas !== el || !el) return
    el.style.visibility = 'visible'
    el.classList.add('is-on')
  })
}

export function stop(): void {
  if (!running) return
  running = false
  gsap.ticker.remove(tick)
  if (canvas) canvas.style.visibility = 'hidden'
}

/** Draw one frame now (reduced motion, or a still). */
export function renderOnce(): void {
  if (!surface?.isReady()) return
  for (const fn of listeners) fn(performance.now())
  render(performance.now())
}

export function currentCamera(): Camera {
  return cam ?? cameraFor(stage.shot, recordCentre())
}

export const recordCentre = (): Vec3 => [0, stage.lift, 0]

// The tonearm's shape — the same numbers as buildArm() in the shader.
const THICK = 0.02
const HEAD_HALF_H = 0.016
const HEAD: [number, number] = [-0.285, 0.602]

/** Where the stylus is (under the headshell's centre), in the world. */
export function stylus(): Vec3 {
  const a = (stage.arm.swing * Math.PI) / 180
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [
    PIVOT[0] + c * HEAD[0] - s * HEAD[1],
    stage.lift + THICK * 0.5 + HEAD_HALF_H + 0.004 + stage.arm.lift * 0.06,
    PIVOT[1] + s * HEAD[0] + c * HEAD[1],
  ]
}

/** Where a point of the scene is on screen (CSS px). */
export function toScreen(p: Vec3): { x: number; y: number; depth: number } {
  return project(currentCamera(), p)
}

/** Record-local (x, z) under a screen point, or null if the ray misses the disc. */
export function recordAt(x: number, y: number): [number, number] | null {
  const { o, d } = rayAt(currentCamera(), x, y)
  const R = recordMatrix()
  const n: Vec3 = [R[3]!, R[4]!, R[5]!]
  const c = recordCentre()
  const dn = d[0] * n[0] + d[1] * n[1] + d[2] * n[2]
  if (Math.abs(dn) < 1e-5) return null
  const t = ((c[0] - o[0]) * n[0] + (c[1] - o[1]) * n[1] + (c[2] - o[2]) * n[2]) / dn
  if (t <= 0) return null
  const w: Vec3 = [o[0] + d[0] * t - c[0], o[1] + d[1] * t - c[1], o[2] + d[2] * t - c[2]]
  // Into the record's frame (its columns are its axes).
  const lx = w[0] * R[0]! + w[1] * R[1]! + w[2] * R[2]!
  const lz = w[0] * R[6]! + w[1] * R[7]! + w[2] * R[8]!
  return Math.hypot(lx, lz) <= 1 ? [lx, lz] : null
}

function recordMatrix(): number[] {
  // Tilts and the flip turn about the screen's axes as seen from above:
  // screen-vertical is the world's -z, screen-horizontal the world's x.
  const turn = rotation([0, 0, -1], stage.tilt.x + stage.flip)
  const nod = rotation([1, 0, 0], stage.tilt.y)
  return mul3(turn, nod)
}

function render(now: number): void {
  const s = surface!
  const { gl } = s
  const el = canvas!
  fit(s, el)
  const W = el.width
  const H = el.height
  const k = W / Math.max(1, cssSize[0])
  const c = recordCentre()
  cam = cameraFor(stage.shot, c)
  gl.uniform2f(s.u('uRes'), W, H)
  gl.uniform2f(s.u('uPP'), cam.pp[0] * k, cam.pp[1] * k)
  gl.uniform1f(s.u('uFocal'), cam.focal * k)
  gl.uniform3fv(s.u('uEye'), cam.eye)
  gl.uniformMatrix3fv(s.u('uCam'), false, [...cam.right, ...cam.up, ...cam.forward])
  gl.uniformMatrix3fv(s.u('uRec'), false, recordMatrix())
  gl.uniform3fv(s.u('uRecPos'), c)
  gl.uniform1f(s.u('uRot'), stage.rot + stage.roll)
  gl.uniform2f(s.u('uArm'), (stage.arm.swing * Math.PI) / 180, stage.arm.lift)
  gl.uniform3f(s.u('uPivot'), PIVOT[0], 0, PIVOT[1])
  gl.uniform1f(s.u('uArmOn'), stage.arm.on)
  const box = armBox(cam)
  gl.uniform3f(s.u('uArmBox'), box.x * k, box.y * k, box.r * k)
  // The light the grooves catch turns with the hand; it leans 40° off the
  // vertical so the bow-tie keeps the flat record's width.
  const e = 0.7
  gl.uniform3fv(
    s.u('uSheenL'),
    normalize([
      Math.cos(stage.sheen) * Math.sin(e),
      Math.cos(e),
      -Math.sin(stage.sheen) * Math.sin(e),
    ]),
  )
  gl.uniform1f(s.u('uFlood'), stage.flood)
  gl.uniform1f(s.u('uDepth'), stage.depth)
  const fog = stage.room.fog.map((v, i) => v + (NIGHT[i]! - v) * stage.night) as Vec3
  gl.uniform3fv(s.u('uFog'), fog)
  gl.uniform3fv(s.u('uPaper'), stage.room.floor)
  gl.uniform3fv(s.u('uLightCol'), stage.room.light)
  gl.uniform1f(s.u('uGlow'), stage.room.glow)
  gl.uniform1f(s.u('uTime'), now / 1000)
  const playing = engine.state.isPlaying
  gl.uniform1fv(s.u('uBands'), playing || stage.demo <= 0 ? frame.bands : demoBands(now))
  gl.uniform1f(s.u('uEnergy'), frame.energy)
  gl.uniform1f(s.u('uProgress'), engine.progress / 100)
  gl.uniform1f(s.u('uPlaying'), playing ? 1 : Math.max(0.35, stage.demo * 0.85))
  gl.uniform3f(s.u('uRing'), stage.ring.x, stage.ring.z, stage.ring.r)
  gl.uniform1f(s.u('uRingA'), stage.ring.a)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

// Where the tonearm can be on screen (CSS px): a circle around its joints,
// padded for its thickness — the shader skips the arm everywhere else.
// Same geometry as buildArm() in the shader.
function armBox(c: Camera): { x: number; y: number; r: number } {
  const a = (stage.arm.swing * Math.PI) / 180
  const cs = Math.cos(a)
  const sn = Math.sin(a)
  const rot = (x: number, z: number): [number, number] => [cs * x - sn * z, sn * x + cs * z]
  const top = stage.lift + 0.05
  const head = stage.lift + THICK * 0.5 + HEAD_HALF_H + 0.004 + stage.arm.lift * 0.06
  const e = rot(-0.093, 0.457)
  const h = rot(-0.285, 0.602)
  const pts: Vec3[] = [
    [PIVOT[0], 0, PIVOT[1]],
    [PIVOT[0], top, PIVOT[1]],
    [PIVOT[0] + e[0], (top + head) / 2, PIVOT[1] + e[1]],
    [PIVOT[0] + h[0], head, PIVOT[1] + h[1]],
  ]
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  let pad = 0
  for (const p of pts) {
    const q = project(c, p)
    if (q.depth <= 0.05) return { x: 0, y: 0, r: 1e6 } // behind or at the lens: no bound
    x0 = Math.min(x0, q.x)
    y0 = Math.min(y0, q.y)
    x1 = Math.max(x1, q.x)
    y1 = Math.max(y1, q.y)
    pad = Math.max(pad, (c.focal * 0.14) / q.depth)
  }
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, r: Math.hypot(x1 - x0, y1 - y0) / 2 + pad + 2 }
}

// Density: the screen's, capped (1.5 with a mouse, 1.25 on touch screens —
// the scene is soft light and paper; beyond that the pixels cost more than
// they show), times the adaptive scale.
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
function fit(s: Surface, el: HTMLCanvasElement): void {
  const d = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.5) * scale
  const w = Math.max(1, Math.round(cssSize[0] * d))
  const h = Math.max(1, Math.round(cssSize[1] * d))
  if (el.width === w && el.height === h) return
  el.width = w
  el.height = h
  s.gl.viewport(0, 0, w, h)
}

// A made-up spectrum for the grooves when no music plays: slow waves, more
// in the bass (the outer grooves), so the effect can be seen before it is heard.
const demo = new Float32Array(24)
function demoBands(now: number): Float32Array {
  const t = now / 1000
  for (let i = 0; i < 24; i++) {
    const w = 0.5 + 0.5 * Math.sin(t * 2.3 + i * 0.55) * Math.sin(t * 0.9 + i * 0.21)
    demo[i] = stage.demo * (0.45 + 0.55 * w) * (1 - i * 0.018)
  }
  return demo
}

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2])
  return [v[0] / l, v[1] / l, v[2] / l]
}
