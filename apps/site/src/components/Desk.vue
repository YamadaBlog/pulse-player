<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { PulsePlayer, type PulseVariant } from '@pulse-music/vue'
import { VARIANTS, type NamedVariant } from '@pulse-music/tokens'
import { FRAMEWORKS, snippet, type Framework } from '../lib/snippets'
import CodeBlock from './CodeBlock.vue'
import CopyButton from './CopyButton.vue'

const config = reactive({
  variant: 'auto' as PulseVariant,
  accent: null as string | null,
  ambientEq: true,
  grain: true,
  resizable: false,
})
const width = ref(560)
const MIN = 72
// Never offer a width the monitor can't show (small screens).
const monitor = ref<HTMLElement | null>(null)
const maxWidth = ref(720)
let ro: ResizeObserver | undefined
onMounted(() => {
  ro = new ResizeObserver(([entry]) => {
    maxWidth.value = Math.max(160, Math.min(720, Math.floor((entry?.contentRect.width ?? 720) - 8)))
    if (width.value > maxWidth.value) width.value = maxWidth.value
  })
  if (monitor.value) ro.observe(monitor.value)
})
onBeforeUnmount(() => ro?.disconnect())

const framework = ref<Framework>('html')
const variants = Object.entries(VARIANTS) as Array<[NamedVariant, (typeof VARIANTS)[NamedVariant]]>
const accents = ['#ff4f1a', '#3dbda7', '#a78bfa', '#f472b6', '#facc15', '#60a5fa']

const tiers = [
  { min: 460, label: 'Full' },
  { min: 360, label: 'Wide' },
  { min: 280, label: 'Medium' },
  { min: 210, label: 'Narrow' },
  { min: 128, label: 'Compact' },
  { min: 0, label: 'Disc' },
]
const tier = computed(() => tiers.find((t) => width.value >= t.min)!.label)
const fader = computed(() => (width.value - MIN) / (maxWidth.value - MIN))
const code = computed(() => snippet(framework.value, config))
const install = computed(() => FRAMEWORKS.find((f) => f.id === framework.value)!.install)
const filename = computed(
  () =>
    ({
      html: 'index.html',
      vue: 'Player.vue',
      react: 'Player.tsx',
      svelte: 'Player.svelte',
      angular: 'player.component.ts',
    })[framework.value],
)

const toggles = [
  { key: 'ambientEq', label: 'Ambient EQ' },
  { key: 'grain', label: 'Film grain' },
  { key: 'resizable', label: 'Resize grip' },
] as const

const frame = ref<HTMLElement | null>(null)
const dragging = ref(false)
let idle: ReturnType<typeof setTimeout> | undefined
function onResize(e: { width: number }): void {
  // Follow the grip 1:1 while dragging; the eased width transition is for the fader.
  dragging.value = true
  clearTimeout(idle)
  idle = setTimeout(() => (dragging.value = false), 200)
  width.value = Math.round(e.width)
  frame.value?.querySelector<HTMLElement>('pulse-player')?.style.removeProperty('width')
}

const tabs = ref<HTMLButtonElement[]>([])
function onTabKey(e: KeyboardEvent, index: number): void {
  const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!delta && e.key !== 'Home' && e.key !== 'End') return
  e.preventDefault()
  const n = FRAMEWORKS.length
  const next = e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : (index + delta + n) % n
  framework.value = FRAMEWORKS[next]!.id
  tabs.value[next]?.focus()
}
</script>

<template>
  <div class="desk">
    <div ref="monitor" class="monitor">
      <div class="monitor__meta">
        <span class="label">Monitor</span>
        <span class="label"
          ><b>{{ width }}</b> px · <em class="serif">{{ tier }}</em></span
        >
      </div>
      <div
        ref="frame"
        class="monitor__frame"
        :data-dragging="dragging || undefined"
        :style="{ width: `${width}px` }"
      >
        <PulsePlayer
          :variant="config.variant"
          :accent-color="config.accent ?? undefined"
          :ambient-eq="config.ambientEq"
          :grain="config.grain"
          :resizable="config.resizable"
          :resize-max="maxWidth"
          @resize="onResize"
        />
      </div>
    </div>

    <div class="strips" aria-label="Player options" role="group">
      <fieldset class="strip strip--moods">
        <legend class="label"><span>01</span> Mood</legend>
        <div class="moods">
          <label
            v-for="[name, tokens] in variants"
            :key="name"
            class="mood"
            :title="tokens.description"
          >
            <input v-model="config.variant" type="radio" name="desk-mood" :value="name" />
            <span
              class="mood__led"
              :style="{
                background: name === 'transparent' ? 'transparent' : tokens.background,
                '--led': tokens.accent,
              }"
            />
            <span>{{ tokens.label }}</span>
          </label>
        </div>
      </fieldset>

      <fieldset class="strip">
        <legend class="label"><span>02</span> Accent</legend>
        <div class="accents">
          <label class="accent accent--auto">
            <input v-model="config.accent" type="radio" name="desk-accent" :value="null" />
            <span>Auto</span>
          </label>
          <label v-for="color in accents" :key="color" class="accent">
            <input
              v-model="config.accent"
              type="radio"
              name="desk-accent"
              :value="color"
              :aria-label="`Accent ${color}`"
            />
            <span class="accent__dot" :style="{ background: color }" />
          </label>
          <label class="accent accent--custom" title="Custom colour">
            <span class="sr-only">Custom accent colour</span>
            <input
              type="color"
              :value="config.accent ?? '#ff4f1a'"
              @input="config.accent = ($event.target as HTMLInputElement).value"
            />
          </label>
        </div>
      </fieldset>

      <fieldset class="strip">
        <legend class="label"><span>03</span> Width</legend>
        <div class="fader" :style="{ '--f': fader }">
          <input
            v-model.number="width"
            type="range"
            :min="MIN"
            :max="maxWidth"
            step="1"
            aria-label="Player width"
            :aria-valuetext="`${width} pixels, ${tier}`"
          />
          <div class="fader__scale" aria-hidden="true">
            <span>{{ MIN }}</span
            ><span>{{ maxWidth }}</span>
          </div>
        </div>
      </fieldset>

      <fieldset class="strip">
        <legend class="label"><span>04</span> Options</legend>
        <div class="switches">
          <button
            v-for="t in toggles"
            :key="t.key"
            class="switch"
            type="button"
            role="switch"
            :aria-checked="config[t.key]"
            @click="config[t.key] = !config[t.key]"
          >
            <span class="switch__lamp" aria-hidden="true" />
            {{ t.label }}
          </button>
        </div>
      </fieldset>
    </div>

    <div class="output">
      <div class="tabs" role="tablist" aria-label="Framework">
        <button
          v-for="(f, i) in FRAMEWORKS"
          :key="f.id"
          ref="tabs"
          class="tab"
          type="button"
          role="tab"
          :aria-selected="framework === f.id"
          :tabindex="framework === f.id ? 0 : -1"
          aria-controls="desk-code"
          @click="framework = f.id"
          @keydown="onTabKey($event, i)"
        >
          {{ f.label }}
        </button>
      </div>
      <div id="desk-code" role="tabpanel" :aria-label="`${framework} code`">
        <div class="install">
          <code><span aria-hidden="true">$</span> {{ install }}</code>
          <CopyButton :text="install" label="Copy install command" />
        </div>
        <CodeBlock :code="code" :label="filename" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.desk {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
}
.label {
  font-family: var(--mono);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ─── Monitor ────────────────────────────────────────────────────── */
.monitor {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  place-items: center;
  min-height: clamp(320px, 46vh, 460px);
  padding: 4.5rem 1rem 3rem;
  border-radius: 14px 14px 4px 4px;
  overflow: hidden;
  background:
    radial-gradient(ellipse 60% 70% at 50% 60%, rgb(255 79 26 / 0.07), transparent 70%),
    radial-gradient(circle at 1px 1px, rgb(236 231 220 / 0.07) 1px, transparent 0) 0 0 / 24px 24px,
    var(--night-2);
}
.monitor__meta {
  position: absolute;
  inset: 1rem 1.2rem auto;
  display: flex;
  justify-content: space-between;
  color: var(--fg-3);
}
.monitor__meta b {
  color: var(--fg);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.monitor__meta em {
  font-size: 1.2rem;
  letter-spacing: 0;
  color: var(--signal);
}
.monitor__frame {
  max-width: 100%;
  transition: width 420ms cubic-bezier(0.34, 1.2, 0.64, 1);
}
.monitor__frame[data-dragging] {
  transition: none;
}

/* ─── Channel strips ─────────────────────────────────────────────── */
.strips {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 6px;
}
.strip {
  display: grid;
  align-content: start;
  gap: 1rem;
  min-width: 0;
  margin: 0;
  padding: 1.1rem 1.2rem 1.3rem;
  border: 0;
  border-radius: 4px;
  background: var(--night-2);
}
.strip legend {
  float: left;
  width: 100%;
  margin-bottom: 1rem;
  padding: 0;
  color: var(--fg-2);
}
.strip legend span {
  color: var(--signal);
  margin-right: 0.4rem;
}
input[type='radio'] {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
.moods {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
}
.mood {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0 0.6rem;
  border-radius: 6px;
  background: rgb(236 231 220 / 0.04);
  color: var(--fg-2);
  font-size: 0.8rem;
  cursor: pointer;
  transition:
    background-color 0.3s var(--ease-out),
    color 0.3s var(--ease-out);
}
.mood:hover {
  color: var(--fg);
}
.mood:has(:checked) {
  color: var(--fg);
  background: rgb(236 231 220 / 0.1);
}
.mood:has(:focus-visible),
.accent:has(:focus-visible) {
  outline: 2px solid var(--signal);
  outline-offset: 2px;
}
.mood__led {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.25);
  transition: box-shadow 0.3s var(--ease-out);
}
.mood:has(:checked) .mood__led {
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.25),
    0 0 0 2px var(--night-2),
    0 0 0 3.5px var(--led),
    0 0 14px var(--led);
}
.accents {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.accent {
  position: relative;
  display: grid;
  place-items: center;
  min-width: 36px;
  height: 36px;
  border-radius: 999px;
  cursor: pointer;
}
.accent__dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.2);
  transition:
    box-shadow 0.3s var(--ease-out),
    scale 0.4s cubic-bezier(0.34, 1.5, 0.64, 1);
}
.accent:hover .accent__dot {
  scale: 1.1;
}
.accent:has(:checked) .accent__dot {
  box-shadow:
    0 0 0 2px var(--night-2),
    0 0 0 4px var(--fg);
}
.accent--auto {
  padding: 0 0.8rem;
  background: rgb(236 231 220 / 0.06);
  color: var(--fg-2);
  font: 500 0.75rem var(--mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.accent--auto:has(:checked) {
  color: var(--ink);
  background: var(--fg);
}
.accent--custom {
  width: 36px;
  overflow: hidden;
  background: conic-gradient(#f87171, #facc15, #4ade80, #22d3ee, #818cf8, #f472b6, #f87171);
}
.accent--custom input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}
.accent--custom:focus-within {
  outline: 2px solid var(--signal);
  outline-offset: 3px;
}
.fader {
  display: grid;
  gap: 0.4rem;
}
.fader input {
  width: 100%;
  height: 32px;
  accent-color: var(--signal);
  cursor: pointer;
}
.fader__scale {
  display: flex;
  justify-content: space-between;
  font: 0.75rem var(--mono);
  color: var(--fg-3);
}
.switches {
  display: grid;
  gap: 4px;
}
.switch {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 40px;
  padding: 0 0.7rem;
  border: 0;
  border-radius: 6px;
  background: rgb(236 231 220 / 0.04);
  color: var(--fg-2);
  font-size: 0.82rem;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.3s var(--ease-out),
    color 0.3s var(--ease-out);
}
.switch:hover {
  color: var(--fg);
}
.switch__lamp {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(236 231 220 / 0.2);
  transition:
    background-color 0.3s var(--ease-out),
    box-shadow 0.3s var(--ease-out);
}
.switch[aria-checked='true'] {
  color: var(--fg);
}
.switch[aria-checked='true'] .switch__lamp {
  background: var(--signal);
  box-shadow: 0 0 10px var(--signal);
}

/* ─── Output ─────────────────────────────────────────────────────── */
.output {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
  margin-top: 2rem;
}
.tabs {
  display: flex;
  gap: 4px;
  max-width: 100%;
  overflow-x: auto;
}
.tab {
  min-height: 44px;
  padding: 0 1.1rem;
  border: 1px solid var(--rule);
  border-radius: 999px;
  background: none;
  color: var(--fg-2);
  font: 500 0.78rem var(--mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition:
    color 0.3s var(--ease-out),
    background-color 0.3s var(--ease-out);
}
.tab:hover {
  color: var(--fg);
}
.tab[aria-selected='true'] {
  color: var(--ink);
  background: var(--fg);
  border-color: var(--fg);
}
#desk-code {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
}
.install {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 6px 6px 6px 16px;
  border-radius: 10px;
  background: var(--night-2);
  font-size: 0.82rem;
}
.install code {
  min-width: 0;
  overflow-x: auto;
  font-family: var(--mono);
  white-space: nowrap;
  color: var(--fg-2);
}
.install code span {
  color: var(--signal);
}
@media (max-width: 1000px) {
  .strips {
    grid-template-columns: 1fr 1fr;
  }
  .strip--moods {
    grid-column: 1 / -1;
  }
}
@media (max-width: 560px) {
  .strips {
    grid-template-columns: minmax(0, 1fr);
  }
  .moods {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
