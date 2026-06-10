<!-- ════════════════════════════════════════════════════════════════
     FloatingFabSection.vue — section V · Floating FAB.
     Extracted from App.vue (P1.1 ext, 2026-06-10).

     The section is mostly markup + 2 store actions + 4 reactive bindings
     that the demo tour controller drives from App.vue. We model that
     contract explicitly :
       props.fabPalette        — list of variant chips
       v-model:activeVariant   — currently selected variant
       v-model:pulso           — pulso option toggle
       props.pulsoHighlight    — demo tour pulses this label
     The two "Show FAB" / "Hide FAB" buttons talk to the global audio
     store directly (same instance as App.vue's useAudioStore() call,
     Pinia keeps it a singleton).

     CSS for `.palette__*` and `.pulso-toggle__*` stays in App.vue
     because the same classes are reused by the "Pick a mood" gallery
     above. Moving them here behind scoped would shadow the other usage.
     ════════════════════════════════════════════════════════════════ -->
<script setup lang="ts">
import { useAudioStore, type MusicPlayerVariant } from '../lib'
import { withViewTransition } from '../composables/usePremiumMotion'

interface PaletteOption {
  id: MusicPlayerVariant
  label: string
  accent?: string
}

const props = defineProps<{
  fabPalette: PaletteOption[]
  activeVariant: MusicPlayerVariant
  pulso: boolean
  pulsoHighlight: boolean
}>()

const emit = defineEmits<{
  (e: 'update:activeVariant', v: MusicPlayerVariant): void
  (e: 'update:pulso', v: boolean): void
}>()

const store = useAudioStore()

function selectVariant(v: MusicPlayerVariant) {
  withViewTransition(() => emit('update:activeVariant', v))
}

function togglePulso(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:pulso', target.checked)
}

// Read-only template helpers — keep type inference tight.
const palette = () => props.fabPalette
</script>

<template>
  <section class="section section--narrow">
    <p class="section__eyebrow">
      <span class="act-num">V</span><span class="act-sep">·</span>Floating FAB
    </p>
    <h2 class="section__h">Persistent, draggable, dismissible.</h2>
    <p class="section__sub">
      Mount once at the root. Drag to move, swipe down/right to dismiss, long-press for the radial
      menu. The ring around it tracks progress.
    </p>

    <div class="palette" role="group" aria-label="Mini-player variant">
      <button
        v-for="opt in palette()"
        :key="opt.id"
        class="palette__chip"
        :class="{ 'palette__chip--active': activeVariant === opt.id }"
        @click="selectVariant(opt.id)"
      >
        {{ opt.label }}
      </button>
    </div>
    <p class="palette__group-label">Options</p>
    <div class="palette__hint">
      <button class="cta cta--ghost cta--sm" @click="store.open" :disabled="store.isVisible">
        Show FAB
      </button>
      <button class="cta cta--ghost cta--sm" @click="store.close">Hide FAB</button>
      <label
        class="pulso-toggle"
        :class="{
          'pulso-toggle--on': pulso,
          'pulso-toggle--highlight': pulsoHighlight,
        }"
      >
        <input type="checkbox" :checked="pulso" @change="togglePulso" />
        <span class="pulso-toggle__dot"></span>
        <span class="pulso-toggle__label">Pulso</span>
      </label>
    </div>
    <p class="palette__note">
      <code>pulso</code> &nbsp;adds a subtle audio-wave ripple around the FAB. Try it once the FAB
      is visible.
    </p>
  </section>
</template>
