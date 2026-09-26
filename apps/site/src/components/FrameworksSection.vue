<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { formatTime, usePulseAudio } from '@pulse-music/vue'
import { vReveal } from '../composables/reveal'
import { engine } from '../lib/site'
import CodeBlock from './CodeBlock.vue'

const { isPlaying } = usePulseAudio()

interface LogLine {
  id: number
  time: string
  event: string
  detail: string
}
const lines = ref<LogLine[]>([])
let seq = 0
const push = (event: string, detail: string): void => {
  const time = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  lines.value = [{ id: ++seq, time, event, detail }, ...lines.value].slice(0, 7)
}

const offs: Array<() => void> = []
onMounted(() => {
  offs.push(
    engine.subscribe('play', ({ track, time }) =>
      push('play', `${track.title} @ ${formatTime(time)}`),
    ),
    engine.subscribe('pause', ({ track, time }) =>
      push('pause', `${track.title} @ ${formatTime(time)}`),
    ),
    engine.subscribe('trackchange', ({ from, to, track }) =>
      push('trackchange', `${from} → ${to} · ${track.title}`),
    ),
    engine.subscribe('ended', ({ track }) => push('ended', track.title)),
    engine.subscribe('error', ({ reason }) => push('error', reason)),
  )
})
onBeforeUnmount(() => offs.forEach((off) => off()))

const wrappers = [
  { name: 'Vue', pkg: '@pulse-music/vue' },
  { name: 'React', pkg: '@pulse-music/react' },
  { name: 'Svelte', pkg: '@pulse-music/svelte' },
  { name: 'Angular', pkg: 'native Custom Elements' },
  { name: 'HTML · Astro', pkg: 'native Custom Elements' },
]

const eventsCode = `import { getSharedEngine } from '@pulse-music/core'

const engine = getSharedEngine()

engine.subscribe('trackchange', ({ track }) => {
  analytics.track('song_changed', { title: track.title })
})

// Build your own visualiser from the live spectrum.
engine.onFrame(({ bands, energy }) => draw(bands, energy))`
</script>

<template>
  <section id="frameworks" class="section">
    <div class="page">
      <header v-reveal class="section-head">
        <p class="eyebrow">Under the hood</p>
        <h2 class="title">One engine. One element. Every framework.</h2>
        <p class="lede">
          The audio engine is plain TypeScript, the UI is a standard Custom Element, and each
          framework gets a thin, typed wrapper — so a fix in the engine reaches everyone at once.
        </p>
      </header>

      <div class="arch-layout">
        <div
          v-reveal="1"
          class="arch card"
          :data-live="isPlaying || undefined"
          role="img"
          aria-label="Architecture: the core engine powers the web component, which is wrapped for Vue, React and Svelte and used natively by Angular and plain HTML."
        >
          <div class="node node--core">
            <strong>@pulse-music/core</strong>
            <span>Playback state · Web Audio spectrum · Media Session · typed events</span>
          </div>
          <svg class="flow" viewBox="0 0 10 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M5 0v40" />
          </svg>
          <div class="node node--wc">
            <strong>@pulse-music/web-component</strong>
            <span
              >&lt;pulse-player&gt; · &lt;pulse-fab&gt; · &lt;pulse-track&gt; — built with Lit</span
            >
          </div>
          <svg class="flow" viewBox="0 0 10 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M5 0v40" />
          </svg>
          <ul class="wrappers">
            <li v-for="w in wrappers" :key="w.name">
              <strong>{{ w.name }}</strong>
              <span>{{ w.pkg }}</span>
            </li>
          </ul>
        </div>

        <div v-reveal="2" class="events">
          <div class="log card" aria-live="polite">
            <div class="log__bar">
              <span class="log__dot" :data-live="isPlaying || undefined" />
              Live events from this page
            </div>
            <TransitionGroup tag="ol" name="log" class="log__lines">
              <li v-for="line in lines" :key="line.id">
                <time>{{ line.time }}</time>
                <code class="log__event" :data-event="line.event">{{ line.event }}</code>
                <span>{{ line.detail }}</span>
              </li>
              <li v-if="!lines.length" key="empty" class="log__empty">
                Press play anywhere on the page…
              </li>
            </TransitionGroup>
          </div>
          <CodeBlock :code="eventsCode" label="events.ts" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.arch-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
}
@media (max-width: 960px) {
  .arch-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
.arch {
  display: grid;
  justify-items: center;
  padding: var(--space-6) var(--space-5);
}
.node {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-3);
  border: 1px solid var(--line-strong);
  background: var(--surface-3);
  text-align: center;
}
.node strong {
  font-family: var(--mono);
  font-size: 14px;
}
.node span {
  font-size: var(--step--1);
  color: var(--text-2);
}
.node--core {
  border-color: color-mix(in oklab, var(--brand-2) 50%, transparent);
  box-shadow: 0 0 40px -18px var(--brand-2);
}
.node--wc {
  border-color: color-mix(in oklab, var(--brand) 50%, transparent);
  box-shadow: 0 0 40px -18px var(--brand);
}
.flow {
  width: 10px;
  height: 44px;
  overflow: visible;
}
.flow path {
  stroke: rgb(255 255 255 / 0.3);
  stroke-width: 2;
  stroke-dasharray: 3 7;
  stroke-linecap: round;
  animation: flow 1.6s linear infinite;
}
.arch[data-live] .flow path {
  stroke: var(--brand);
  animation-duration: 0.45s;
}
.wrappers {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
}
.wrappers li {
  flex: 1 1 110px;
  display: grid;
  gap: 2px;
  padding: 12px;
  border-radius: var(--radius-2);
  border: 1px solid var(--line);
  background: rgb(255 255 255 / 0.03);
  text-align: center;
}
.wrappers strong {
  font-size: var(--step--1);
}
.wrappers span {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-3);
}

.events {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}
.log {
  overflow: hidden;
  background: #0a0a10;
}
.log__bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}
.log__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-3);
  transition: background-color var(--pulse-dur-base) var(--pulse-ease-out);
}
.log__dot[data-live] {
  background: #4ade80;
  box-shadow: 0 0 10px #4ade80;
}
.log__lines {
  position: relative;
  display: grid;
  min-height: 236px;
  margin: 0;
  padding: 10px 16px;
  list-style: none;
  font-family: var(--mono);
  font-size: 12.5px;
}
.log__lines li {
  display: flex;
  gap: 12px;
  align-items: baseline;
  padding: 5px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.log__lines time {
  color: var(--text-3);
}
.log__event {
  min-width: 11ch;
  color: #7dd3fc;
}
.log__event[data-event='play'] {
  color: #4ade80;
}
.log__event[data-event='pause'] {
  color: #fbbf24;
}
.log__event[data-event='error'] {
  color: #f87171;
}
.log__empty {
  color: var(--text-3);
}
.log-enter-active {
  transition:
    opacity 500ms var(--pulse-ease-out),
    translate 700ms var(--pulse-ease-gentle);
}
.log-enter-from {
  opacity: 0;
  translate: -14px 0;
}
.log-leave-active {
  display: none;
}
.log-move {
  transition: translate 500ms var(--pulse-ease-gentle);
}
@keyframes flow {
  to {
    stroke-dashoffset: -20;
  }
}
</style>
