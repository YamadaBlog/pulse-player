<script setup lang="ts">
/**
 * CinematicIntro — alpha.31 "Journey into Sound" opener.
 *
 * Sequence (see docs/setup/ALPHA_31_CONCEPT.md storyboard):
 *   t=0.0  black canvas + tiny centred waveform dot, pulses once
 *   t=0.6  dot expands into the Pulse logo at full size
 *   t=1.6  logo fades out, overlay cleared, hero composes
 *
 * Guardrails (frontend-design + taste-skill anti-default):
 *   - skips on prefers-reduced-motion
 *   - skips on touch / narrow viewport (< 720 px) — mobile gets
 *     straight-to-hero
 *   - skips on repeat visit within the session (sessionStorage flag)
 *   - skip button in the corner for keyboard / accessibility
 */
import { onMounted, ref } from 'vue'
import { animate } from 'motion'

const SESSION_KEY = 'pulse-cinematic-intro-seen'
const overlay = ref<HTMLElement | null>(null)
const logo = ref<HTMLElement | null>(null)
const dot = ref<HTMLElement | null>(null)
const visible = ref(true)
const playing = ref(false)

const shouldRun = (): boolean => {
  if (typeof window === 'undefined') return false
  if (window.innerWidth < 720) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (sessionStorage.getItem(SESSION_KEY) === '1') return false
  return true
}

const skip = (): void => {
  visible.value = false
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, '1')
  }
}

onMounted(async () => {
  if (!shouldRun()) {
    visible.value = false
    return
  }
  playing.value = true

  await new Promise((r) => requestAnimationFrame(r))
  const dotEl = dot.value
  const logoEl = logo.value
  const overlayEl = overlay.value
  if (!dotEl || !logoEl || !overlayEl) {
    visible.value = false
    return
  }

  // ── t=0.0 → 0.6  Dot pulses once + grows ────────────────────────
  await animate(
    dotEl,
    { scale: [0.5, 1, 0.5, 1.2], opacity: [0, 1, 0.6, 1] },
    { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  ).finished

  // ── t=0.6 → 1.2  Dot fades; logo cross-fades in + scales ─────────
  await Promise.all([
    animate(dotEl, { opacity: [1, 0] }, { duration: 0.35 }).finished,
    animate(
      logoEl,
      { opacity: [0, 1], scale: [0.2, 1] },
      { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
    ).finished,
  ])

  // ── t=1.2 → 1.7  Hold ────────────────────────────────────────────
  await new Promise((r) => setTimeout(r, 500))

  // ── t=1.7 → 2.1  Logo + overlay fade out, hero composes ─────────
  await Promise.all([
    animate(logoEl, { opacity: [1, 0], scale: [1, 1.08] }, { duration: 0.4, ease: [0.4, 0, 1, 1] })
      .finished,
    animate(overlayEl, { opacity: [1, 0] }, { duration: 0.4 }).finished,
  ])

  sessionStorage.setItem(SESSION_KEY, '1')
  visible.value = false
})
</script>

<template>
  <div v-if="visible" ref="overlay" class="intro" role="presentation" aria-hidden="true">
    <div ref="dot" class="intro__dot"></div>
    <svg ref="logo" class="intro__logo" viewBox="0 0 64 64" width="128" height="128">
      <defs>
        <linearGradient id="intro-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#8B5CF6" />
          <stop offset="50%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#3DBDA7" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="#05050A" />
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#intro-grad)" opacity="0.12" />
      <path
        d="M 10 32 L 18 32 L 22 22 L 28 42 L 32 12 L 36 42 L 42 22 L 46 32 L 54 32"
        stroke="url(#intro-grad)"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        fill="none"
      />
      <circle cx="54" cy="32" r="2.5" fill="url(#intro-grad)" />
    </svg>
    <button class="intro__skip" type="button" @click="skip">Skip intro</button>
  </div>
</template>

<style scoped>
.intro {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(circle at center, #0a0b23 0%, #05050a 60%, #000 100%);
  display: grid;
  place-items: center;
  pointer-events: auto;
}
.intro__dot {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(circle, #f59e0b 0%, rgba(245, 158, 11, 0.6) 40%, transparent 70%);
  opacity: 0;
  filter: blur(2px);
  will-change: transform, opacity;
}
.intro__logo {
  opacity: 0;
  will-change: transform, opacity;
  filter: drop-shadow(0 12px 32px rgba(245, 158, 11, 0.25));
}
.intro__skip {
  position: absolute;
  bottom: 32px;
  right: 32px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  padding: 8px 16px;
  font-family: 'Geist Mono', ui-monospace, 'SF Mono', Consolas, monospace;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    color 200ms ease-out,
    border-color 200ms ease-out;
}
.intro__skip:hover {
  color: rgba(255, 255, 255, 0.9);
  border-color: rgba(255, 255, 255, 0.5);
}
</style>
