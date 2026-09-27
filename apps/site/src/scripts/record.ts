import { engine, subscribeFrames } from './audio'
import { deck } from './deck'
import { $, onPage, reducedMotion, whileVisible } from './lifecycle'
import { onStageFrame, recordAt, recordCentre, stage, stageLive, toScreen } from './stage/stage'

const RPM = 33.333
const PLAY_SPEED = -(RPM / 60) * Math.PI * 2 // clockwise, rad/s
const SECONDS_PER_TURN = 1.8 // how much music one full hand-turn scrubs

/**
 * The record's physics and the hand on it. The picture is the stage's
 * (stage/stage.ts); this is the platter: inertia, the deck's spin-up and
 * run-down, the tilt and the light that follow the pointer, scratching.
 * `[data-record]` is the record's place in the hero — where the stage puts
 * the disc at rest, and where the hand can catch it.
 */
onPage(() => {
  const hit = $('[data-record]')
  if (!hit || !stageLive()) return

  // Physical state.
  let vel = 0
  let tiltTarget = { x: 0, y: 0 }
  let lightTarget = 2.2
  let last = performance.now()
  let playing = engine.state.isPlaying
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

  const wrap = (a: number): number =>
    ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI
  const centre = (): { x: number; y: number; r: number } => {
    const c = toScreen(recordCentre())
    return { x: c.x, y: c.y, r: stage.shot.r }
  }
  const angleAt = (e: PointerEvent): number => {
    const c = centre()
    return Math.atan2(-(e.clientY - c.y), e.clientX - c.x)
  }

  const step = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    if (reducedMotion()) return
    if (!drag) {
      // The platter follows the turntable: while the deck ramps (spin-up,
      // run-down) picture and pitch move together; otherwise it has inertia.
      const target = playing ? PLAY_SPEED * deck.speed : -stage.drift
      const ramping = playing && deck.speed < 0.999
      vel += (target - vel) * (1 - Math.exp(-dt * (ramping ? 40 : playing ? 1.6 : 2.4)))
      // Settle for real: an exponential approach never arrives, and the
      // stage redraws for any change — so land once it can't be seen.
      if (Math.abs(target - vel) < 2e-4) vel = target
    }
    stage.rot += vel * dt
    const k = 1 - Math.exp(-dt * 5)
    const ease = (from: number, to: number): number =>
      Math.abs(to - from) < 1e-4 ? to : from + (to - from) * k
    stage.tilt.x = ease(stage.tilt.x, tiltTarget.x)
    stage.tilt.y = ease(stage.tilt.y, tiltTarget.y)
    const dl = wrap(lightTarget - stage.sheen)
    stage.sheen = Math.abs(dl) < 1e-4 ? stage.sheen + dl : stage.sheen + dl * k
  }
  const offFrame = onStageFrame(step)
  // The analyser runs while the record is on screen (the grooves listen).
  const stopListening = whileVisible(hit, () => subscribeFrames(() => undefined))

  const offState = engine.onStateChange((st) => {
    playing = st.isPlaying
    hit.toggleAttribute('data-playing', playing)
  })
  hit.toggleAttribute('data-playing', playing)

  // ─── Pointer: tilt + light follow the hand, drag scratches ───────
  const hero = hit.closest('section') ?? hit
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
    stage.rot += dA
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
  }
  const onLeave = (): void => {
    tiltTarget = { x: 0, y: 0 }
  }
  const onDown = (e: PointerEvent): void => {
    // Only the disc itself can be caught, wherever the camera shows it.
    if (!recordAt(e.clientX, e.clientY)) return
    hit.setPointerCapture(e.pointerId)
    drag = {
      id: e.pointerId,
      angle: angleAt(e),
      time: performance.now(),
      moved: 0,
      startX: e.clientX,
      startY: e.clientY,
    }
    engine.prepare()
    hit.classList.add('is-scratching')
  }
  const onUp = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.id) return
    const tap =
      drag.moved < 0.05 && Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) < 6
    drag = null
    hit.classList.remove('is-scratching')
    if (hit.hasPointerCapture(e.pointerId)) hit.releasePointerCapture(e.pointerId)
    if (tap && e.type === 'pointerup') hero.dispatchEvent(new CustomEvent('needle:toggle'))
  }
  hero.addEventListener('pointermove', onMove)
  hero.addEventListener('pointerleave', onLeave)
  hit.addEventListener('pointerdown', onDown)
  hit.addEventListener('pointerup', onUp)
  hit.addEventListener('pointercancel', onUp)

  return () => {
    offFrame()
    stopListening()
    offState()
    clearTimeout(seekTimer)
    hero.removeEventListener('pointermove', onMove)
    hero.removeEventListener('pointerleave', onLeave)
  }
})
