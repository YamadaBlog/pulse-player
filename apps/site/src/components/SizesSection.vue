<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PulsePlayer } from '@pulse-music/vue'
import { vReveal } from '../composables/reveal'
import { look, prefersReducedMotion } from '../lib/site'

const steps = [
  { width: 680, label: 'Full', detail: 'Artwork, equaliser, artist, transport, time and volume.' },
  { width: 420, label: 'Regular', detail: 'Volume folds away; everything else stays.' },
  { width: 300, label: 'Narrow', detail: 'Time and extra actions step aside.' },
  { width: 190, label: 'Compact', detail: 'Artwork, title and one big play button.' },
  { width: 96, label: 'Disc', detail: 'A round mini player with a progress ring.' },
]

// Only the tiers the stage can actually show (small screens drop the widest).
const available = ref(720)
const stageEl = ref<HTMLElement | null>(null)
const visibleSteps = computed(() => {
  const fitting = steps.filter((s) => s.width <= available.value)
  // Always keep the smallest tier, however narrow the stage.
  return fitting.length ? fitting : steps.slice(-1)
})
const index = ref(0)
const playing = ref(true)
const visible = ref(false)
const section = ref<HTMLElement | null>(null)
const current = computed(
  () => visibleSteps.value[Math.min(index.value, visibleSteps.value.length - 1)]!,
)

let timer: ReturnType<typeof setInterval> | undefined
let io: IntersectionObserver | undefined
let ro: ResizeObserver | undefined

function sync(): void {
  clearInterval(timer)
  if (playing.value && visible.value && !prefersReducedMotion()) {
    timer = setInterval(() => (index.value = (index.value + 1) % visibleSteps.value.length), 2600)
  }
}
function jump(i: number): void {
  index.value = i
  playing.value = false
  sync()
}
function toggleCycle(): void {
  playing.value = !playing.value
  sync()
}

onMounted(() => {
  if (prefersReducedMotion()) playing.value = false
  io = new IntersectionObserver(([entry]) => {
    visible.value = !!entry?.isIntersecting
    sync()
  })
  if (section.value) io.observe(section.value)
  ro = new ResizeObserver(([entry]) => {
    available.value = Math.floor(entry?.contentRect.width ?? 720)
    index.value = Math.min(index.value, visibleSteps.value.length - 1)
  })
  if (stageEl.value) ro.observe(stageEl.value)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  io?.disconnect()
  ro?.disconnect()
})
</script>

<template>
  <section id="sizes" ref="section" class="section sizes">
    <div class="page">
      <header v-reveal class="section-head">
        <p class="eyebrow">Container-aware</p>
        <h2 class="title">One element. Every size.</h2>
        <p class="lede">
          No breakpoints and no JavaScript measuring: the player reads its own width with CSS
          container queries, then scales type, artwork and controls continuously — all the way down
          to a disc.
        </p>
      </header>

      <div class="sizes__layout">
        <div ref="stageEl" v-reveal="1" class="sizes__stage card">
          <div class="sizes__ruler" aria-hidden="true">
            <span>{{ current.width }}px</span>
          </div>
          <div class="sizes__frame" :style="{ width: `${current.width}px` }">
            <PulsePlayer :variant="look.variant" :accent-color="look.accent ?? undefined" />
          </div>
        </div>

        <div v-reveal="2" class="sizes__side">
          <ol class="tiers">
            <li v-for="(step, i) in visibleSteps" :key="step.label">
              <button class="tier" type="button" :aria-pressed="i === index" @click="jump(i)">
                <span class="tier__head">
                  <strong>{{ step.label }}</strong>
                  <code>{{ step.label === 'Disc' ? '< 128px' : `${step.width}px` }}</code>
                </span>
                <span class="tier__detail">{{ step.detail }}</span>
              </button>
            </li>
          </ol>
          <button
            class="btn sizes__toggle"
            type="button"
            :aria-pressed="!playing"
            @click="toggleCycle"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path v-if="playing" fill="currentColor" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
              <path v-else fill="currentColor" d="M8 5.5v13l10.5-6.5z" />
            </svg>
            {{ playing ? 'Pause the animation' : 'Resume the animation' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.sizes__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  gap: var(--space-5);
  align-items: stretch;
}
@media (max-width: 960px) {
  .sizes__layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
.sizes__stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  place-items: center;
  min-height: 420px;
  padding: var(--space-7) var(--space-4);
  overflow: hidden;
  background:
    linear-gradient(90deg, rgb(255 255 255 / 0.03) 1px, transparent 1px) 0 0 / 40px 100%,
    linear-gradient(180deg, var(--surface-2), var(--surface));
}
.sizes__ruler {
  position: absolute;
  top: 20px;
  left: 50%;
  translate: -50% 0;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px dashed rgb(255 255 255 / 0.2);
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-2);
}
.sizes__frame {
  max-width: 100%;
  padding: 10px;
  border: 1px dashed rgb(255 255 255 / 0.16);
  border-radius: 34px;
  transition: width 1.1s var(--pulse-ease-gentle);
}
.sizes__side {
  display: grid;
  align-content: start;
  gap: var(--space-4);
}
.tiers {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.tier {
  display: grid;
  gap: 2px;
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-3);
  background: transparent;
  color: var(--text-2);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--pulse-dur-base) var(--pulse-ease-out),
    background-color var(--pulse-dur-base) var(--pulse-ease-out),
    color var(--pulse-dur-base) var(--pulse-ease-out),
    translate var(--pulse-dur-spring) var(--pulse-ease-gentle);
}
.tier:hover {
  color: var(--text);
  border-color: var(--line-strong);
}
.tier[aria-pressed='true'] {
  color: var(--text);
  border-color: color-mix(in oklab, var(--brand) 60%, transparent);
  background: color-mix(in oklab, var(--brand) 8%, transparent);
  translate: 6px 0;
}
.tier__head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}
.tier__head code {
  font-size: 12px;
  color: var(--text-3);
}
.tier__detail {
  font-size: var(--step--1);
}
.sizes__toggle {
  justify-self: start;
}
</style>
