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
    const target = playing ? Math.min(1, base * bell * 1.3) : 0
    // Frame smoothing — 0.22/frame → ~120 ms decay at 60 fps.
    smoothed[i] += (target - smoothed[i]) * 0.22
  }

  ctx.clearRect(0, 0, w, h)
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  const gap = props.gap * dpr
  const barW = Math.max(1, (w - gap * (N - 1)) / N)
  const baseH = h * 0.08 // resting baseline 8 % of canvas
  const maxH = h * 0.78

  for (let i = 0; i < N; i++) {
    const x = i * (barW + gap)
    const v = smoothed[i]
    const bh = baseH + maxH * v
    const y = h - bh
    // Amber→pink gradient on the active portion; cool grey on the rest.
    const grad = ctx.createLinearGradient(0, y, 0, h)
    grad.addColorStop(0, `rgba(245, 158, 11, ${0.6 + v * 0.35})`)
    grad.addColorStop(0.6, `rgba(236, 72, 153, ${0.35 + v * 0.3})`)
    grad.addColorStop(1, `rgba(139, 92, 246, ${0.18 + v * 0.18})`)
    ctx.fillStyle = grad
    // Rounded top — small radius for the "EQ block" look.
    const r = Math.min(barW / 2, 4 * dpr)
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
    // Single static frame: a baseline line, no animation.
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.45)'
    ctx.fillRect(0, c.height * 0.88, c.width, c.height * 0.06)
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
  margin: clamp(-32px, -4vh, -64px) auto clamp(48px, 8vh, 96px);
  max-width: 1320px;
  padding: 0 clamp(16px, 4vw, 48px);
  pointer-events: none;
}
.bars__canvas {
  display: block;
  width: 100%;
  height: 100%;
  mix-blend-mode: screen;
}
</style>
