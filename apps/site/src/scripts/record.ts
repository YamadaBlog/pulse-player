import { engine, subscribeFrames, frame } from './audio'
import { createSurface, hexToRgb, uploadTexture } from './gl'
import { $, onPage, reducedMotion, whileVisible } from './lifecycle'
import { RECORD_FRAG } from './record-shader'

const RPM = 33.333
const PLAY_SPEED = -(RPM / 60) * Math.PI * 2 // clockwise, rad/s
const SECONDS_PER_TURN = 1.8 // how much music one full hand-turn scrubs
const SIGNAL = '#ff4f1a'

/** Paint the paper label with the site's real fonts. */
async function drawLabel(): Promise<HTMLCanvasElement> {
  await Promise.allSettled([
    document.fonts.load('800 120px "Archivo Variable"'),
    document.fonts.load('500 20px "Geist Mono"'),
  ])
  const size = 1024
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')!
  const mid = size / 2
  const grad = ctx.createRadialGradient(mid * 0.8, mid * 0.7, 40, mid, mid, mid)
  grad.addColorStop(0, '#ff6a3d')
  grad.addColorStop(1, '#e8410f')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(mid, mid, mid, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#131210'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ;(ctx as CanvasRenderingContext2D & { fontStretch?: string }).fontStretch = 'condensed'
  ctx.font = '800 188px "Archivo Variable", "Archivo", sans-serif'
  ctx.fillText('PULSE', mid, mid - 60)

  ctx.font = '500 30px "Geist Mono", monospace'
  ctx.fillText('SIDE A  ·  33⅓ RPM', mid, mid - 250)
  ctx.font = '500 25px "Geist Mono", monospace'
  const lines = ['A1  PROJECTOR SCREEN', 'A2  WARM FUZZ', 'A3  SUMMER BREAK']
  lines.forEach((line, i) => ctx.fillText(line, mid, mid + 150 + i * 38))
  ctx.font = '500 20px "Geist Mono", monospace'
  ctx.fillText('HOLIZNACC0 · PUBLIC DOMAIN', mid, mid + 300)
  ctx.fillText('℗ 2026 YAMADABLOG · MIT', mid, mid + 332)
  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgb(19 18 16 / 0.35)'
  ctx.beginPath()
  ctx.arc(mid, mid, mid - 26, 0, Math.PI * 2)
  ctx.stroke()
  return c
}

onPage(() => {
  const stage = $('[data-record]')
  const canvas = stage?.querySelector('canvas')
  if (!stage || !canvas) return

  let surface: ReturnType<typeof createSurface> = null
  try {
    surface = createSurface(canvas, RECORD_FRAG)
  } catch (error) {
    console.warn('[pulse-site] record disabled:', error)
  }
  if (!surface) {
    stage.classList.add('is-fallback')
    return
  }
  const s = surface
  const { gl } = s
  stage.classList.add('is-live')

  let label: WebGLTexture | null = null
  void drawLabel().then((c) => {
    label = uploadTexture(gl, c, 0, label)
    gl.uniform1i(s.u('uLabel'), 0)
    render(performance.now())
  })
  gl.uniform3fv(s.u('uAccent'), hexToRgb(SIGNAL))

  // Physical state.
  let rot = 0
  let vel = 0
  let tilt = { x: 0, y: 0 }
  let tiltTarget = { x: 0, y: 0 }
  let light = 2.2
  let lightTarget = 2.2
  let last = performance.now()
  let playing = engine.state.isPlaying

  // Scratching.
  let drag: {
    id: number
    angle: number
    time: number
    moved: number
    startX: number
    startY: number
  } | null = null
  let seekDebt = 0
  let seekTimer = 0

  const centre = (): { x: number; y: number; r: number } => {
    const rect = canvas.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      r: Math.min(rect.width, rect.height) * 0.45,
    }
  }
  const angleAt = (e: PointerEvent): number => {
    const c = centre()
    return Math.atan2(-(e.clientY - c.y), e.clientX - c.x)
  }
  const wrap = (a: number): number =>
    ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI

  function render(now: number): void {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (!drag) {
      const target = playing ? PLAY_SPEED : 0
      vel += (target - vel) * (1 - Math.exp(-dt * (playing ? 1.6 : 2.4)))
    }
    rot += vel * dt
    const k = 1 - Math.exp(-dt * 5)
    tilt = { x: tilt.x + (tiltTarget.x - tilt.x) * k, y: tilt.y + (tiltTarget.y - tilt.y) * k }
    light += wrap(lightTarget - light) * k

    s.resize()
    gl.uniform2f(s.u('uRes'), s.canvas.width, s.canvas.height)
    gl.uniform1f(s.u('uRot'), rot)
    gl.uniform2f(s.u('uTilt'), tilt.x, tilt.y)
    gl.uniform1f(s.u('uLight'), light)
    gl.uniform1f(s.u('uTime'), now / 1000)
    gl.uniform1fv(s.u('uBands'), frame.bands)
    gl.uniform1f(s.u('uEnergy'), frame.energy)
    gl.uniform1f(s.u('uProgress'), engine.progress / 100)
    gl.uniform1f(s.u('uPlaying'), playing ? 1 : 0.35)
    s.draw()
  }

  // ─── Loop, only while on screen and allowed to move ──────────────
  let raf = 0
  const loop = (now: number): void => {
    render(now)
    raf = requestAnimationFrame(loop)
  }
  const stopVisible = whileVisible(stage, () => {
    if (reducedMotion()) {
      render(performance.now())
      return () => undefined
    }
    const offFrames = subscribeFrames(() => undefined)
    last = performance.now()
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      offFrames()
    }
  })

  const offState = engine.onStateChange((st) => {
    playing = st.isPlaying
    stage.toggleAttribute('data-playing', playing)
    stage.style.setProperty('--progress', String(engine.progress / 100))
    if (reducedMotion()) render(performance.now())
  })
  stage.toggleAttribute('data-playing', playing)

  // ─── Pointer: tilt + light follow the hand, drag scratches ───────
  const hero = stage.closest('section') ?? stage
  const onMove = (e: PointerEvent): void => {
    const c = centre()
    const nx = (e.clientX - c.x) / (c.r * 3)
    const ny = (e.clientY - c.y) / (c.r * 3)
    tiltTarget = { x: Math.max(-1, Math.min(1, nx)) * 0.2, y: Math.max(-1, Math.min(1, ny)) * 0.2 }
    lightTarget = Math.atan2(-(e.clientY - c.y), e.clientX - c.x) + Math.PI / 2
    if (!drag || e.pointerId !== drag.id) return
    const a = angleAt(e)
    const dA = wrap(a - drag.angle)
    const now = performance.now()
    const dt = Math.max(1, now - drag.time) / 1000
    rot += dA
    vel = vel * 0.6 + (dA / dt) * 0.4
    drag.moved += Math.abs(dA)
    drag.angle = a
    drag.time = now
    seekDebt += (-dA / (Math.PI * 2)) * SECONDS_PER_TURN
    if (!seekTimer) {
      seekTimer = window.setTimeout(() => {
        seekTimer = 0
        if (Math.abs(seekDebt) > 0.02) engine.seekBy(seekDebt)
        seekDebt = 0
      }, 70)
    }
    if (reducedMotion()) render(now)
  }
  const onLeave = (): void => {
    tiltTarget = { x: 0, y: 0 }
  }
  const onDown = (e: PointerEvent): void => {
    const c = centre()
    if (Math.hypot(e.clientX - c.x, e.clientY - c.y) > c.r) return
    canvas.setPointerCapture(e.pointerId)
    drag = {
      id: e.pointerId,
      angle: angleAt(e),
      time: performance.now(),
      moved: 0,
      startX: e.clientX,
      startY: e.clientY,
    }
    engine.prepare()
    stage.classList.add('is-scratching')
  }
  const onUp = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.id) return
    const tap =
      drag.moved < 0.05 && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 6
    drag = null
    stage.classList.remove('is-scratching')
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    if (tap && e.type === 'pointerup') engine.toggle()
  }
  hero.addEventListener('pointermove', onMove)
  hero.addEventListener('pointerleave', onLeave)
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)

  return () => {
    stopVisible()
    offState()
    clearTimeout(seekTimer)
    hero.removeEventListener('pointermove', onMove)
    hero.removeEventListener('pointerleave', onLeave)
    s.dispose()
  }
})
