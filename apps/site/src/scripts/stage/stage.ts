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
const listeners = new Set<(now: number) => void>()

/** Mount the stage on a canvas. Returns false when WebGL2 is not there. */
export function mountStage(el: HTMLCanvasElement): boolean {
  if (surface && canvas === el) return true
  unmountStage()
  try {
    surface = createSurface(el, STAGE_FRAG, 2, true)
  } catch (error) {
    console.warn('[pulse-site] stage disabled:', error)
    surface = null
  }
  if (!surface) return false
  canvas = el
  const { gl } = surface
  const s = surface
  gl.uniform3fv(s.u('uInk'), NIGHT)
  gl.uniform3fv(s.u('uAccent'), SIGNAL)
  gl.uniform3fv(s.u('uLight'), KEY)
  gl.uniform1i(s.u('uLabel'), 0)
  gl.uniform1i(s.u('uLabelB'), 1)
  labelsReady = Promise.all([drawLabel(), drawLabelB()]).then(([a, b]) => {
    if (surface !== s) return
    uploadTexture(gl, a, 0)
    uploadTexture(gl, b, 1)
  })
  // ?stage-debug: the state on window, to frame shots from the console.
  if (location.search.includes('stage-debug'))
    (window as unknown as { __stage: StageState }).__stage = stage
  return true
}

export function unmountStage(): void {
  stop()
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

// ─── Adaptive resolution: a frame over budget steps the density down ──
let budget = { frames: 0, slow: 0 }
let scale = 1

function tick(): void {
  if (!surface || !canvas) return
  const now = performance.now()
  for (const fn of listeners) fn(now)
  const t0 = performance.now()
  render(now)
  const cost = performance.now() - t0
  budget.frames++
  if (cost > 12) budget.slow++
  if (budget.frames >= 60) {
    if (budget.slow > 20 && scale > 0.6) scale -= 0.15
    budget = { frames: 0, slow: 0 }
  }
}

export function start(): void {
  if (running || !surface) return
  running = true
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
  if (!surface) return
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
  const k = W / Math.max(1, el.clientWidth)
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

// Density: the screen's, capped (1.75 with a mouse, 1.25 on touch screens),
// times the adaptive scale.
const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
function fit(s: Surface, el: HTMLCanvasElement): void {
  const d = Math.min(devicePixelRatio || 1, coarse ? 1.25 : 1.75) * scale
  const w = Math.max(1, Math.round(el.clientWidth * d))
  const h = Math.max(1, Math.round(el.clientHeight * d))
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
