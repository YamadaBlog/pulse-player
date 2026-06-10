<!-- ════════════════════════════════════════════════════════════════
     DragStageSection.vue — section III·b · Drag · Pointer events.
     Extracted from App.vue (P1.1 round-3, 2026-06-10).

     Contract :
       props.tourWidth — programmatic width override (number | null).
       App.vue's demo tour tweens this to puppet the drag stage during
       step 4 ; `null` releases control back to the user's drag.

     The `#section-drag` id is part of the spotlight contract — keep it.

     The Ambient EQ toggle binds the global `store.ambientEq` directly
     (Pinia singleton — same instance App.vue reads).

     CSS (.drag-stage, .ambient-toggle…) stays in App.vue's global
     style block — responsive-fix.css targets the same selectors.
     ════════════════════════════════════════════════════════════════ -->
<script setup lang="ts">
import { MusicPlayer, useAudioStore } from '../lib'

defineProps<{
  tourWidth: number | null
}>()

const store = useAudioStore()
</script>

<template>
  <section id="section-drag" class="section section--narrow">
    <p class="section__eyebrow">
      <span class="act-num">III·b</span><span class="act-sep">·</span>Drag · Pointer events
    </p>
    <h2 class="section__h">Grab the corner. Resize it yourself.</h2>
    <p class="section__sub">
      Pass <code>resizable</code> to the inline player and a diagonal handle appears in the
      bottom-right corner. Mouse, finger or stylus — same code path (pointer events +
      <code>setPointerCapture</code>). Pull it small enough and it collapses to compact mode
      automatically.
    </p>

    <div class="drag-stage">
      <div class="drag-stage__hint">
        <span class="drag-stage__dot"></span>
        Grab the
        <span class="drag-stage__icon" aria-hidden="true">
          <svg viewBox="0 0 14 14" width="14" height="14">
            <path
              d="M1 13 L13 1 M5 13 L13 5 M9 13 L13 9"
              stroke="currentColor"
              stroke-width="1.5"
              fill="none"
              stroke-linecap="round"
            />
          </svg>
        </span>
        handle in the bottom-right corner
      </div>
      <MusicPlayer
        variant="auto"
        resizable
        :min-width="60"
        :width="tourWidth"
        github-url="https://github.com/YamadaBlog/pulse-player"
        spotify-url="https://open.spotify.com/"
      />
      <label class="ambient-toggle" :class="{ 'ambient-toggle--on': store.ambientEq }">
        <input type="checkbox" v-model="store.ambientEq" />
        <span class="ambient-toggle__dot"></span>
        <span class="ambient-toggle__label">Ambient EQ — global</span>
      </label>
    </div>
  </section>
</template>
