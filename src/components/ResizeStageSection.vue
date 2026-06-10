<!-- ════════════════════════════════════════════════════════════════
     ResizeStageSection.vue — section III · Made to grow.
     Extracted from App.vue (P1.1 round-3, 2026-06-10).

     Contract :
       v-model:width — the live player width in px. App.vue keeps
       ownership of the ref because the guided demo tour tweens it
       (useDemoTour steps 3/4 animate sliderWidth directly). The section
       renders + edits it ; the tour drives it from outside.

     The `#section-resize` id is part of the spotlight contract —
     `spotlight.focus('#section-resize')` in App.vue aims the demo
     overlay at this section. Keep the id stable.

     SIZE_PRESETS / SLIDER_MIN / SLIDER_MAX moved here from App.vue :
     a grep confirmed they had no other consumer.

     CSS (.resize-stage, .presets, .slider…) stays in App.vue's global
     style block because responsive-fix.css also targets those
     selectors from outside any scope.
     ════════════════════════════════════════════════════════════════ -->
<script setup lang="ts">
import { MusicPlayer } from '../lib'

const props = defineProps<{
  width: number
}>()

const emit = defineEmits<{
  (e: 'update:width', v: number): void
}>()

const SLIDER_MIN = 160
const SLIDER_MAX = 720

const SIZE_PRESETS = [
  { label: 'XS', value: 160 },
  { label: 'S', value: 240 },
  { label: 'M', value: 360 },
  { label: 'L', value: 540 },
  { label: 'XL', value: 720 },
] as const

function setPreset(v: number) {
  emit('update:width', v)
}

function onSliderInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:width', Number(target.value))
}

// Template helper keeps the prop read explicit.
const width = () => props.width
</script>

<template>
  <section id="section-resize" class="section section--narrow">
    <p class="section__eyebrow">
      <span class="act-num">III</span><span class="act-sep">·</span>Made to grow
    </p>
    <h2 class="section__h">Resize it. Everything follows.</h2>
    <p class="section__sub">
      One <code>--pulse-scale</code> variable drives the artwork, title, icons, buttons, padding,
      radius, shadows, EQ bars, progress and gaps. Move the slider — there is no breakpoint trick.
    </p>

    <div class="resize-stage">
      <div class="resize-stage__player">
        <MusicPlayer
          :width="width()"
          variant="auto"
          github-url="https://github.com/YamadaBlog/pulse-player"
          spotify-url="https://open.spotify.com/"
        />
      </div>

      <div class="resize-controls">
        <div class="presets" role="group" aria-label="Size presets">
          <button
            v-for="p in SIZE_PRESETS"
            :key="p.label"
            class="presets__btn"
            :class="{ 'presets__btn--active': width() === p.value }"
            @click="setPreset(p.value)"
          >
            {{ p.label }}
          </button>
        </div>
        <label class="slider">
          <span class="slider__label">Width</span>
          <input
            type="range"
            :min="SLIDER_MIN"
            :max="SLIDER_MAX"
            step="1"
            :value="width()"
            aria-label="Component width in pixels"
            @input="onSliderInput"
          />
          <span class="slider__value">{{ width() }} px</span>
        </label>
      </div>
    </div>
  </section>
</template>
