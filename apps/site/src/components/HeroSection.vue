<script setup lang="ts">
import { ref } from 'vue'
import { PulsePlayer, usePulseAudio } from '@pulse-music/vue'
import { useAudioEnergy } from '../composables/useAudioEnergy'
import { look } from '../lib/site'
import CopyButton from './CopyButton.vue'

const { isPlaying, toggle } = usePulseAudio()
const fx = ref<HTMLElement | null>(null)
useAudioEnergy(fx)

const headline = ['The', 'music', 'player', 'that', 'grows', 'with', 'your', 'page.']
const install = 'npm i @pulse-music/web-component'
</script>

<template>
  <section id="top" class="hero">
    <div ref="fx" class="hero__fx" aria-hidden="true">
      <div class="hero__sky">
        <span class="blob blob--a" />
        <span class="blob blob--b" />
        <span class="blob blob--c" />
      </div>
      <div class="hero__grid" />
    </div>

    <div class="hero__inner page">
      <p class="hero__badge">
        <span class="hero__dot" :data-live="isPlaying || undefined" />
        Web Component · Vue · React · Svelte · Angular
      </p>

      <h1 class="hero__title">
        <span
          v-for="(word, i) in headline"
          :key="i"
          class="word"
          :class="{ 'word--accent': word === 'grows' }"
          :style="{ '--w': i }"
          >{{ word }}{{ ' ' }}</span
        >
      </h1>

      <p class="hero__lede">
        One Custom Element, every framework. Drop it in a sidebar, a hero or a corner of the screen
        — it resizes itself, re-themes itself and keeps the music going.
      </p>

      <div class="hero__stage">
        <div class="hero__halo" aria-hidden="true" />
        <PulsePlayer
          class="hero__player"
          :variant="look.variant"
          :accent-color="look.accent ?? undefined"
          ambient-eq
        />
      </div>

      <div class="hero__actions">
        <button class="btn btn--primary" type="button" @click="toggle">
          <svg v-if="isPlaying" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
            <rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8.2 4.6c-.8-.5-1.7.1-1.7 1v12.8c0 .9 1 1.5 1.7 1l10.1-6.4a1.2 1.2 0 0 0 0-2L8.2 4.6Z"
            />
          </svg>
          {{ isPlaying ? 'Pause the music' : 'Play a track' }}
        </button>
        <a class="btn" href="#playground">Open the playground</a>
      </div>

      <div class="hero__install">
        <code><span aria-hidden="true">$</span> {{ install }}</code>
        <CopyButton :text="install" label="Copy install command" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  --energy: 0;
  --bass: 0;
  position: relative;
  isolation: isolate;
  min-height: min(100svh, 1000px);
  padding-top: calc(var(--nav-h) + clamp(2rem, 6vh, 5rem));
  padding-bottom: var(--space-8);
  overflow: hidden;
}

/* ─── Background ─────────────────────────────────────────────────── */
.hero__fx {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}
.hero__sky {
  position: absolute;
  inset: -10% -10% 0;
  mask-image: linear-gradient(to bottom, #000 55%, transparent);
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  opacity: calc(0.42 + var(--energy) * 0.35);
  scale: calc(1 + var(--bass) * 0.22);
  will-change: transform;
  transition:
    opacity 300ms linear,
    scale 220ms linear;
}
.blob--a {
  top: 4%;
  left: 12%;
  width: 46vw;
  height: 46vw;
  background: radial-gradient(circle, #8b5cf6, transparent 65%);
  animation: drift-a 26s var(--pulse-ease-in-out) infinite alternate;
}
.blob--b {
  top: 18%;
  right: 6%;
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, #3dbda7, transparent 65%);
  animation: drift-b 32s var(--pulse-ease-in-out) infinite alternate;
}
.blob--c {
  top: 44%;
  left: 36%;
  width: 34vw;
  height: 34vw;
  background: radial-gradient(circle, #ff8a4c, transparent 65%);
  opacity: calc(0.22 + var(--energy) * 0.4);
  animation: drift-c 22s var(--pulse-ease-in-out) infinite alternate;
}
.hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 70% 55% at 50% 38%, #000, transparent);
}

/* ─── Content ────────────────────────────────────────────────────── */
.hero__inner {
  display: grid;
  justify-items: center;
  text-align: center;
  gap: var(--space-5);
}
.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.04);
  backdrop-filter: blur(12px);
  font-size: var(--step--1);
  color: var(--text-2);
  animation: rise 900ms var(--pulse-ease-gentle) both;
}
.hero__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand);
  box-shadow: 0 0 0 0 var(--glow);
}
.hero__dot[data-live] {
  animation: ping 1.6s var(--pulse-ease-out) infinite;
}
.hero__title {
  max-width: 14ch;
  font-size: var(--step-4);
  font-weight: 750;
  letter-spacing: -0.045em;
  line-height: 0.98;
}
.word {
  display: inline-block;
  white-space: pre;
  animation: word-in 1s var(--pulse-ease-gentle) both;
  animation-delay: calc(120ms + var(--w) * 70ms);
}
.word--accent {
  background: linear-gradient(100deg, #c4b5fd, #5eead4 60%, #fdba74);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
@media (forced-colors: active) {
  .word--accent {
    color: CanvasText;
    background: none;
  }
}
.hero__lede {
  max-width: 58ch;
  font-size: var(--step-1);
  color: var(--text-2);
  animation: rise 900ms var(--pulse-ease-gentle) 650ms both;
}

.hero__stage {
  position: relative;
  width: min(640px, 100%);
  margin-top: var(--space-4);
  animation: stage-in 1.2s var(--pulse-ease-gentle) 800ms both;
}
.hero__halo {
  position: absolute;
  inset: 8% 4% -6%;
  border-radius: 40px;
  background:
    radial-gradient(
      ellipse at 30% 50%,
      color-mix(in oklab, #8b5cf6 55%, transparent),
      transparent 70%
    ),
    radial-gradient(
      ellipse at 80% 60%,
      color-mix(in oklab, #3dbda7 45%, transparent),
      transparent 70%
    );
  filter: blur(40px);
  opacity: calc(0.35 + var(--energy) * 0.6);
  transition: opacity 240ms linear;
}
.hero__player {
  position: relative;
  text-align: left;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-3);
  animation: rise 900ms var(--pulse-ease-gentle) 1000ms both;
}
.hero__install {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 6px 6px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgb(0 0 0 / 0.3);
  font-size: 13px;
  animation: rise 900ms var(--pulse-ease-gentle) 1100ms both;
}
.hero__install code {
  color: var(--text-2);
}
.hero__install code span {
  color: var(--brand);
  margin-right: 4px;
}

@keyframes word-in {
  from {
    opacity: 0;
    translate: 0 0.35em;
    filter: blur(10px);
  }
}
@keyframes rise {
  from {
    opacity: 0;
    translate: 0 16px;
  }
}
@keyframes stage-in {
  from {
    opacity: 0;
    translate: 0 40px;
    scale: 0.94;
  }
}
@keyframes ping {
  0% {
    box-shadow: 0 0 0 0 var(--glow);
  }
  100% {
    box-shadow: 0 0 0 10px transparent;
  }
}
@keyframes drift-a {
  to {
    translate: 8vw 6vh;
  }
}
@keyframes drift-b {
  to {
    translate: -10vw 8vh;
  }
}
@keyframes drift-c {
  to {
    translate: 6vw -8vh;
  }
}
</style>
