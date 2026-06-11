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
const smoothed: number[] = []
// Frame-cached canvas-space gradient (audit №5 P2) — see render().
const gradCache: { h: number; grad: CanvasGradient | null } = { h: 0, grad: null }

const render = () => {
  raf = requestAnimationFrame(render)
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

  // Upsample the 4 focal bars into N bands via cosine interpolation,
  // plus a small symmetry curve so the visualiser feels balanced.
  const fft = engine?.eqBars ?? [0, 0, 0, 0]
  // Round-7 (user feedback : "au repos elles sont très bien" mais en
  // lecture "ça ne donne pas l'effet attendu") — the active branch used
  // to REPLACE the idle silhouette with `base × bell`, which collapsed
  // 64 bars onto 4 interpolated FFT values : everything rose and fell
  // together, mushy and uniform. New model : the bars DANCE AROUND the
  // resting silhouette instead of discarding it —
  //   target = idle-anchor + audio energy × bell × per-bar character
  // with per-bar character = a stable pseudo-random gain (breaks the
  // 4-band uniformity : neighbours respond differently to the same
  // energy) + a travelling phase so peaks ripple across the row.
  // Asymmetric smoothing (fast attack / slow release) makes kicks SNAP
  // and decay like a real analyser instead of the old single-constant
  // mush.
  const tNow = performance.now() / 1000
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    // Bell curve around centre — louder at the middle bands, quieter
    // at edges. Matches the perceptual "spectrum" feel.
    const bell = Math.sin(t * Math.PI) ** 1.6
    // Sample 2 fft channels and blend.
    const f0 = fft[Math.floor(t * (fft.length - 1))] ?? 0
    const f1 = fft[Math.min(fft.length - 1, Math.floor(t * (fft.length - 1)) + 1)] ?? 0
    const blend = (Math.floor(t * (fft.length - 1)) + t) % 1
    const base = f0 * (1 - blend) + f1 * blend
    // IDLE silhouette : static "spectrum at rest" (unchanged — the
    // user signed off on this shape).
    const idle = bell * 0.46 + Math.sin(i * 0.55) * 0.07 + Math.cos(i * 0.31) * 0.05
    let target
    if (playing) {
      // Stable per-bar gain (deterministic from the index) so adjacent
      // bars have personality ; travelling phase so energy ripples.
      const character = 0.65 + 0.7 * Math.abs((Math.sin(i * 12.9898) * 43758.5453) % 1)
      const ripple = 0.85 + 0.3 * Math.sin(i * 0.45 - tNow * 7)
      const anchor = Math.max(0.14, idle * 0.55)
      target = Math.min(1, anchor + base * bell * 1.5 * character * ripple)
    } else {
      target = Math.max(0.18, idle)
    }
    // Asymmetric smoothing : ~35 ms attack, ~260 ms release at 60 fps.
    const k = target > smoothed[i] ? 0.45 : 0.1
    smoothed[i] += (target - smoothed[i]) * k
  }

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
  if (raf) cancelAnimationFrame(raf)
  ro?.disconnect()
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
  filter: blur(40px);
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
