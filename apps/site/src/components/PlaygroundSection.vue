<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { PulsePlayer, type PulseVariant } from '@pulse-music/vue'
import { VARIANTS, type NamedVariant } from '@pulse-music/tokens'
import { vReveal } from '../composables/reveal'
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
// Never offer a width the stage can't show (small screens).
const stage = ref<HTMLElement | null>(null)
const maxWidth = ref(720)
let ro: ResizeObserver | undefined
onMounted(() => {
  ro = new ResizeObserver(([entry]) => {
    maxWidth.value = Math.max(160, Math.min(720, Math.floor((entry?.contentRect.width ?? 720) - 8)))
    if (width.value > maxWidth.value) width.value = maxWidth.value
  })
  if (stage.value) ro.observe(stage.value)
})
onBeforeUnmount(() => ro?.disconnect())
const framework = ref<Framework>('html')

const variants = Object.entries(VARIANTS) as Array<[NamedVariant, (typeof VARIANTS)[NamedVariant]]>
const accents = ['#3dbda7', '#a78bfa', '#ff7a59', '#f472b6', '#facc15', '#60a5fa']

const tiers = [
  { max: 128, label: 'Disc' },
  { max: 210, label: 'Compact' },
  { max: 280, label: 'Narrow' },
  { max: 460, label: 'Regular' },
  { max: Infinity, label: 'Full' },
]
const tier = computed(() => tiers.find((t) => width.value < t.max)!.label)
const code = computed(() => snippet(framework.value, config))
const install = computed(() => FRAMEWORKS.find((f) => f.id === framework.value)!.install)

const toggles = [
  { key: 'ambientEq', label: 'Ambient equaliser' },
  { key: 'grain', label: 'Film grain' },
  { key: 'resizable', label: 'Resize handle' },
] as const

const frame = ref<HTMLElement | null>(null)
const dragging = ref(false)
let idle: ReturnType<typeof setTimeout> | undefined

function onResize(e: { width: number }): void {
  // Follow the handle 1:1 while dragging; the eased width transition is for the slider.
  dragging.value = true
  clearTimeout(idle)
  idle = setTimeout(() => (dragging.value = false), 200)
  width.value = Math.round(e.width)
  // The stage owns the width: hand it back instead of keeping the element's inline size.
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
  <section id="playground" class="section">
    <div class="page">
      <header v-reveal class="section-head">
        <p class="eyebrow">Playground</p>
        <h2 class="title">Tune it, then copy the code.</h2>
        <p class="lede">
          Every option below is a plain attribute. The snippet updates as you play.
        </p>
      </header>

      <div class="pg">
        <aside v-reveal="1" class="pg__panel card" aria-label="Player options">
          <fieldset>
            <legend>Theme</legend>
            <div class="swatches" role="radiogroup" aria-label="Theme">
              <button
                v-for="[name, tokens] in variants"
                :key="name"
                class="swatch"
                type="button"
                role="radio"
                :aria-checked="config.variant === name"
                :title="tokens.description"
                @click="config.variant = name"
              >
                <span
                  class="swatch__dot"
                  :style="{ background: tokens.background, '--ring': tokens.accent }"
                />
                <span>{{ tokens.label }}</span>
              </button>
            </div>
          </fieldset>

          <fieldset>
            <legend>Accent</legend>
            <div class="accents" role="radiogroup" aria-label="Accent colour">
              <button
                class="accent accent--auto"
                type="button"
                role="radio"
                :aria-checked="config.accent === null"
                title="Theme default"
                @click="config.accent = null"
              >
                Auto
              </button>
              <button
                v-for="color in accents"
                :key="color"
                class="accent"
                type="button"
                role="radio"
                :aria-checked="config.accent === color"
                :aria-label="`Accent ${color}`"
                :style="{ background: color }"
                @click="config.accent = color"
              />
              <label class="accent accent--custom" title="Custom colour">
                <span class="sr-only">Custom accent colour</span>
                <input
                  type="color"
                  :value="config.accent ?? '#3dbda7'"
                  @input="config.accent = ($event.target as HTMLInputElement).value"
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>
              Width <output class="pg__readout">{{ width }}px · {{ tier }}</output>
            </legend>
            <input
              v-model.number="width"
              class="range"
              :max="maxWidth"
              type="range"
              min="72"
              step="1"
              aria-label="Player width"
            />
          </fieldset>

          <fieldset>
            <legend>Options</legend>
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
                <span class="switch__track"><span class="switch__thumb" /></span>
                {{ t.label }}
              </button>
            </div>
          </fieldset>
        </aside>

        <div v-reveal="2" class="pg__main">
          <div ref="stage" class="stage card">
            <span class="stage__tier" aria-hidden="true">{{ tier }}</span>
            <div
              ref="frame"
              class="stage__frame"
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
              aria-controls="pg-code"
              @click="framework = f.id"
              @keydown="onTabKey($event, i)"
            >
              {{ f.label }}
            </button>
          </div>
          <div id="pg-code" role="tabpanel" :aria-label="`${framework} code`">
            <div class="install">
              <code><span aria-hidden="true">$</span> {{ install }}</code>
              <CopyButton :text="install" label="Copy install command" />
            </div>
            <CodeBlock
              :code="code"
              :label="
                framework === 'react'
                  ? 'Player.tsx'
                  : framework === 'vue'
                    ? 'Player.vue'
                    : framework === 'svelte'
                      ? 'Player.svelte'
                      : framework === 'angular'
                        ? 'player.component.ts'
                        : 'index.html'
              "
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pg {
  display: grid;
  grid-template-columns: minmax(0, 340px) minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
}
@media (max-width: 960px) {
  .pg {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ─── Panel ──────────────────────────────────────────────────────── */
.pg__panel {
  display: grid;
  gap: var(--space-5);
  padding: var(--space-5);
}
fieldset {
  display: grid;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
}
legend {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: var(--space-3);
  padding: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-3);
}
.pg__readout {
  font-family: var(--mono);
  letter-spacing: 0;
  text-transform: none;
  color: var(--text-2);
}
.swatches {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.swatch {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 6px 8px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgb(255 255 255 / 0.02);
  color: var(--text-2);
  font-size: 12.5px;
  cursor: pointer;
  transition:
    border-color var(--pulse-dur-fast) var(--pulse-ease-out),
    background-color var(--pulse-dur-fast) var(--pulse-ease-out),
    color var(--pulse-dur-fast) var(--pulse-ease-out),
    scale var(--pulse-dur-spring) var(--pulse-ease-pop);
}
.swatch:hover {
  color: var(--text);
  border-color: var(--line-strong);
}
.swatch:active {
  scale: 0.95;
}
.swatch[aria-checked='true'] {
  color: var(--text);
  border-color: rgb(255 255 255 / 0.4);
  background: rgb(255 255 255 / 0.07);
}
.swatch__dot {
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 7px;
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.18),
    0 0 0 0 var(--ring);
  transition: box-shadow var(--pulse-dur-base) var(--pulse-ease-out);
}
.swatch[aria-checked='true'] .swatch__dot {
  box-shadow:
    inset 0 0 0 1px rgb(255 255 255 / 0.18),
    0 0 0 2px var(--surface-2),
    0 0 0 4px var(--ring);
}
.accents {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.accent {
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.2);
  transition:
    box-shadow var(--pulse-dur-base) var(--pulse-ease-out),
    scale var(--pulse-dur-spring) var(--pulse-ease-pop);
}
.accent:hover {
  scale: 1.1;
}
.accent[aria-checked='true'] {
  box-shadow:
    0 0 0 2px var(--surface-2),
    0 0 0 4px var(--text);
}
.accent--auto {
  width: auto;
  padding: 0 12px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
}
.accent--custom {
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
  outline: 2px solid var(--brand);
  outline-offset: 3px;
}
.range {
  width: 100%;
  accent-color: var(--brand);
  height: 28px;
  cursor: pointer;
}
.switches {
  display: grid;
  gap: 6px;
}
.switch {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 40px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-2);
  font-size: var(--step--1);
  text-align: left;
  cursor: pointer;
}
.switch:hover {
  color: var(--text);
}
.switch__track {
  position: relative;
  flex: none;
  width: 40px;
  height: 24px;
  border-radius: 999px;
  background: var(--surface-3);
  box-shadow: inset 0 0 0 1px var(--line-strong);
  transition: background-color var(--pulse-dur-base) var(--pulse-ease-out);
}
.switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--text-2);
  transition:
    translate var(--pulse-dur-spring) var(--pulse-ease-pop),
    background-color var(--pulse-dur-base) var(--pulse-ease-out);
}
.switch[aria-checked='true'] .switch__track {
  background: var(--brand);
}
.switch[aria-checked='true'] .switch__thumb {
  translate: 16px 0;
  background: #fff;
}

/* ─── Stage ──────────────────────────────────────────────────────── */
.pg__main {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}
.stage {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  place-items: center;
  min-height: 360px;
  padding: var(--space-7) var(--space-4);
  overflow: hidden;
  background:
    radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.07) 1px, transparent 0) 0 0 / 22px 22px,
    linear-gradient(180deg, var(--surface-2), var(--surface));
}
.stage__tier {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-2);
}
.stage__frame {
  max-width: 100%;
  transition: width 420ms var(--pulse-ease-gentle);
}
.stage__frame[data-dragging] {
  transition: none;
}

/* ─── Code ───────────────────────────────────────────────────────── */
.tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
}
.tab {
  min-height: 36px;
  padding: 0 14px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text-2);
  font-size: var(--step--1);
  font-weight: 600;
  cursor: pointer;
  transition:
    color var(--pulse-dur-fast) var(--pulse-ease-out),
    background-color var(--pulse-dur-base) var(--pulse-ease-out);
}
.tab:hover {
  color: var(--text);
}
.tab[aria-selected='true'] {
  color: #0b0b10;
  background: var(--text);
}
#pg-code {
  display: grid;
  gap: var(--space-3);
}
.install {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 6px 6px 6px 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #0a0a10;
  font-size: 13px;
}
.install code {
  color: var(--text-2);
  overflow-x: auto;
  white-space: nowrap;
}
.install code span {
  color: var(--brand);
}
</style>
