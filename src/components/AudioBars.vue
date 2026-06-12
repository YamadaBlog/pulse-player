<script setup lang="ts">
/**
 * AudioBars — alpha.32 full-width FFT visualiser bars.
 *
 * A 64-bar real-time visualiser bound to PulseEngine.eqBars (4 focal
 * bars upscaled into 64 perceptual bands via sine interpolation +
 * neighbour smoothing). Sits below the hero like a hardware EQ display.
 *
 * Reads the engine state via the useAudioStore wired in the parent.
 * Pure Canvas 2D — no WebGL — keeps the bundle cost minimal. Resizes
 * to its container's width, DPR-aware.
 *
 * Reduced-motion: renders a static centered baseline (no movement).
 * Paused: bars decay to a soft idle line, no flicker.
 */

import { onBeforeUnmount, onMounted, ref } from 'vue'
import { isScrollingFast } from '../composables/useScrollActivity'

interface Engine {
  eqBars: readonly number[]
  isPlaying: boolean
}
interface Props {
  /** Reactive engine snapshot (eqBars + isPlaying). */
  engine: Engine
  /** Number of bars (default 64). */
  bars?: number
  /** Bar gap in CSS px (default 2). */
  gap?: number
}

const props = withDefaults(defineProps<Props>(), {
  bars: 64,
  gap: 2,
})

const canvas = ref<HTMLCanvasElement | null>(null)

let raf = 0
let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null
let visible = true
let paintToggle = false
const smoothed: number[] = []
// Frame-cached canvas-space gradient (audit №5 P2) — see render().
const gradCache: { h: number; grad: CanvasGradient | null } = { h: 0, grad: null }

const render = () => {
  // Round-12 fluidity — visibility gate : stop redrawing 64 bars per
  // frame once the visualiser is scrolled out of view (the loop used
  // to run for the page's whole lifetime). The IO callback restarts it.
  if (!visible) {
    raf = 0
    return
  }
  raf = requestAnimationFrame(render)
  // Round-23 ("la page tremble") — the round-18 freeze was BINARY :
  // any scroll event froze the bars, then they snapped back through
  // the attack smoothing 160 ms later. A slow wheel scroll therefore
  // alternated freeze -> catch-up -> freeze : the user-reported
  // tremor. The freeze now only engages during FAST scrolling
  // (> 1500 px/s), where the eye cannot track the bars anyway.
  if (isScrollingFast()) return
  const c = canvas.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const w = c.width
  const h = c.height
  const N = props.bars
  if (smoothed.length !== N) {
    smoothed.length = 0
    for (let i = 0; i < N; i++) smoothed.push(0)
  }

  const engine = props.engine
  const playing = engine?.isPlaying ?? false

  // Round-23 ("des vagues stables et calculées, ce sera plus joli") —
  // the per-bar pseudo-random character (hash sin(i*12.9898)*43758…)
  // made neighbours jitter independently : energetic, but noisy, and
  // it burned a hash + ripple per bar per frame. New model : THREE
  // superposed deterministic travelling sine waves (slow phase
  // velocities, irrational-ish frequency ratios so the pattern never
  // visibly repeats), modulated by the audio energy when playing.
  // Calm, continuous, ocean-like — and cheaper : 3 sin() per bar.
  //
  //   idle    : signed-off silhouette + a barely-there breathing wave
  //   playing : silhouette anchor + energy envelope × wave field
  const fft = engine?.eqBars ?? [0, 0, 0, 0]
  const tNow = performance.now() / 1000
  // Global audio energy (mean of the 4 focal bands) — ONE smooth
  // scalar instead of 64 independent reactions.
  let energy = 0
  if (playing) {
    let sum = 0
    for (let i = 0; i < fft.length; i++) sum += fft[i] || 0
    energy = fft.length ? sum / fft.length : 0
  }
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    // Bell curve around centre — louder at the middle bands, quieter
    // at edges. Matches the perceptual "spectrum" feel.
    const bell = Math.sin(t * Math.PI) ** 1.6
    // IDLE silhouette : static "spectrum at rest" (unchanged — the
    // user signed off on this shape).
    const idle = bell * 0.46 + Math.sin(i * 0.55) * 0.07 + Math.cos(i * 0.31) * 0.05
    // Deterministic wave field, normalised to [0..1] : two travelling
    // waves moving against each other + one long swell.
    const x = t * Math.PI * 2
    const wave =
      0.5 +
      0.27 * Math.sin(x * 3.0 - tNow * 1.35) +
      0.16 * Math.sin(x * 5.2 + tNow * 0.9) +
      0.07 * Math.sin(x * 1.3 - tNow * 0.4)
    let target
    if (playing) {
      const anchor = Math.max(0.14, idle * 0.55)
      target = Math.min(1, anchor + energy * bell * (0.55 + 0.85 * wave))
    } else {
      // Resting silhouette with a breathing micro-swell (±0.03) so the
      // strip feels alive without ever reading as motion.
      target = Math.max(0.18, idle + (wave - 0.5) * 0.06)
    }
    // Asymmetric smoothing — slightly softer attack than before
    // (0.45 -> 0.3) : the wave model wants continuity, not snap.
    const k = target > smoothed[i] ? 0.3 : 0.12
    smoothed[i] += (target - smoothed[i]) * k
  }

  // Round-12 fluidity — PAINT at 30 Hz (smoothing math stays at 60).
  // Every canvas damage forces a re-composite of the full-width
  // blended strip (mix-blend screen over the hero backdrop) plus its
  // blurred wash : skipping every second paint halves that composite
  // load, and a 64-bar meter at 30 fps is visually indistinguishable.
  paintToggle = !paintToggle
  if (paintToggle) return

  ctx.clearRect(0, 0, w, h)
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const gap = props.gap * dpr
  const barW = Math.max(1, (w - gap * (N - 1)) / N)
  const baseH = h * 0.08 // resting baseline 8 % of canvas
  const maxH = h * 0.78

  // Audit №5 P2 — ONE canvas-space gradient per frame instead of 64
  // per-bar gradients. The gradient spans the full drawable height in
  // canvas coordinates : a tall bar reveals more of the amber top, a
  // short bar shows mostly the violet base — visually equivalent to
  // (arguably nicer than) the old per-bar variant, and it removes 64
  // createLinearGradient allocations + colour-string formats per frame.
  // Cached across frames, rebuilt only when the canvas height changes
  // (resize), keyed by `h`.
  if (gradCache.h !== h || !gradCache.grad) {
    const g = ctx.createLinearGradient(0, h - (baseH + maxH), 0, h)
    g.addColorStop(0, 'rgba(245, 158, 11, 0.95)')
    g.addColorStop(0.45, 'rgba(236, 72, 153, 0.6)')
    g.addColorStop(1, 'rgba(139, 92, 246, 0.3)')
    gradCache.h = h
    gradCache.grad = g
  }
  ctx.fillStyle = gradCache.grad

  ctx.beginPath()
  for (let i = 0; i < N; i++) {
    const x = i * (barW + gap)
    const v = smoothed[i]
    const bh = baseH + maxH * v
    const y = h - bh
    // Rounded top — small radius for the "EQ block" look.
    const r = Math.min(barW / 2, 4 * dpr)
    ctx.moveTo(x, h)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.lineTo(x + barW - r, y)
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r)
    ctx.lineTo(x + barW, h)
    ctx.closePath()
  }
  // Single fill for all 64 bars — one paint op instead of 64.
  ctx.fill()
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const c = canvas.value
  if (!c) return
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const sync = () => {
    const parent = c.parentElement
    if (!parent) return
    const r = parent.getBoundingClientRect()
    c.width = Math.max(1, Math.floor(r.width * dpr))
    c.height = Math.max(1, Math.floor(r.height * dpr))
    c.style.width = `${r.width}px`
    c.style.height = `${r.height}px`
  }
  sync()
  ro = new ResizeObserver(sync)
  if (c.parentElement) ro.observe(c.parentElement)

  io = new IntersectionObserver(
    ([entry]) => {
      const was = visible
      visible = entry.isIntersecting
      if (visible && !was && raf === 0) raf = requestAnimationFrame(render)
    },
    { rootMargin: '60px' },
  )
  io.observe(c)

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // alpha.37 — paint a STATIC spectrum silhouette (same formula as
    // the idle branch of render()) so reduced-motion users still see
    // the visualiser concept clearly instead of a baseline bar. No
    // animation : single frame, then exit.
    const ctx = c.getContext('2d')
    if (!ctx) return
    const w = c.width
    const h = c.height
    const N = props.bars
    ctx.clearRect(0, 0, w, h)
    const localDpr = Math.min(2, window.devicePixelRatio || 1)
    const gap = props.gap * localDpr
    const barW = Math.max(1, (w - gap * (N - 1)) / N)
    const baseH = h * 0.08
    const maxH = h * 0.78
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1)
      const bell = Math.sin(t * Math.PI) ** 1.6
      const idle = bell * 0.46 + Math.sin(i * 0.55) * 0.07 + Math.cos(i * 0.31) * 0.05
      const v = Math.max(0.18, idle)
      const x = i * (barW + gap)
      const bh = baseH + maxH * v
      const y = h - bh
      const grad = ctx.createLinearGradient(0, y, 0, h)
      grad.addColorStop(0, `rgba(245, 158, 11, ${0.5 + v * 0.25})`)
      grad.addColorStop(0.6, `rgba(236, 72, 153, ${0.32 + v * 0.18})`)
      grad.addColorStop(1, `rgba(139, 92, 246, ${0.18 + v * 0.12})`)
      ctx.fillStyle = grad
      const r = Math.min(barW / 2, 4 * localDpr)
      ctx.beginPath()
      ctx.moveTo(x, h)
      ctx.lineTo(x, y + r)
      ctx.quadraticCurveTo(x, y, x + r, y)
      ctx.lineTo(x + barW - r, y)
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r)
      ctx.lineTo(x + barW, h)
      ctx.closePath()
      ctx.fill()
    }
    return
  }
  raf = requestAnimationFrame(render)
})
onBeforeUnmount(() => {
  visible = false
  if (raf) cancelAnimationFrame(raf)
  ro?.disconnect()
  io?.disconnect()
})
</script>

<template>
  <div class="bars" aria-hidden="true">
    <canvas ref="canvas" class="bars__canvas"></canvas>
  </div>
</template>

<style scoped>
.bars {
  width: 100%;
  height: clamp(80px, 14vh, 160px);
  position: relative;
  /* alpha.37 FULL-BLEED fix — was `max-width: 1320px; margin: ... auto`
     which capped the EQ visualiser at 1320 px so on a 2K (2560) viewport
     ~600 px of empty page was visible left + right of the canvas. The
     bar block is a hardware-EQ style visual signal — it should span the
     whole stage like an Apple Music now-playing strip. Removing the
     cap + zeroing horizontal padding makes it span 100 vw. The atmospheric
     wash glow follows. */
  margin-block: clamp(-32px, -4vh, -64px) clamp(48px, 8vh, 96px);
  margin-inline: 0;
  padding: 0;
  pointer-events: none;
  /* alpha.37 — explicit horizontal centring + small atmospheric wash
     underneath so the EQ block reads as "lit" / energised even when
     the audio is paused (idle silhouette above does the rest). */
  display: flex;
  justify-content: center;
  isolation: isolate;
}
.bars::before {
  content: '';
  position: absolute;
  inset: -10% 6% 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(
    ellipse 70% 100% at 50% 100%,
    rgba(245, 158, 11, 0.18) 0%,
    rgba(236, 72, 153, 0.1) 40%,
    transparent 100%
  );
  /* Round-21 - blur removed : gradient-only decorative layer ; the
     radial fade is already soft and the filter forced a costly raster
     burst when the layer (re)entered the viewport (user-reported
     hitches at pin release + page ascent). */
  mix-blend-mode: screen;
}
.bars__canvas {
  display: block;
  width: 100%;
  height: 100%;
  mix-blend-mode: screen;
  /* Centre the canvas within its padded host so it doesn't drift on
     wide viewports where the parent .bars caps at 1320 px. */
  margin: 0 auto;
}

/* Mobile : tighten margin so the EQ block sits flush below the hero
   CTAs without a black gap, and slightly reduce horizontal padding so
   the bars stretch full-bleed. The wash glow remains. */
@media (max-width: 720px) {
  .bars {
    height: clamp(72px, 12vh, 110px);
    margin-top: clamp(-16px, -2vh, -32px);
    margin-bottom: clamp(28px, 5vh, 48px);
    padding: 0;
  }
}
</style>
