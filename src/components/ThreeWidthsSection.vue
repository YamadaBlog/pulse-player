<!-- ════════════════════════════════════════════════════════════════
     ThreeWidthsSection.vue — section IV·b · Same component, three
     widths. Extracted from App.vue (P1.1 round-3, 2026-06-10).

     Self-contained : `responsiveWidths` had no other consumer.

     Hidden ≤ 720 px via `.section--three-widths` (responsive-fix.css)
     — on a 390 px viewport the 720 px frame can't render at its label
     width and the three clamped players repeat one message. Keep the
     class name stable.

     CSS (.responsive, .responsive__cell…) stays in App.vue's global
     style block — responsive-fix.css flips the layout to a row on
     ≥ 1440 px against those selectors.
     ════════════════════════════════════════════════════════════════ -->
<script setup lang="ts">
import PlayerShell from './PlayerShell.vue'
import shellManifest from '../assets/shells/manifest.json'

// Round-14 — this section is a static width comparison : 3 full
// MusicPlayer instances replaced by pre-rendered shells (same pixels,
// zero engine/blur cost). Regenerate via `npm run generate:shells`.
const shellSrc = import.meta.glob('../assets/shells/width-*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const shellFor = (w: number) => shellSrc[`../assets/shells/width-${w}.webp`]
const shellRatio = (w: number) =>
  (shellManifest as Record<string, { ratio: number }>)[`width-${w}`]?.ratio

const responsiveWidths = [320, 480, 720] as const
</script>

<template>
  <section class="section section--three-widths">
    <p class="section__eyebrow">
      <span class="act-num">IV·b</span><span class="act-sep">·</span>Responsive · Container queries
    </p>
    <h2 class="section__h">Same component. Three widths.</h2>
    <p class="section__sub">
      At 320 px the artwork is compact, the title sits tight. At 720 px the same component fills its
      space — bigger artwork, larger type, deeper chrome — not because there is a media query, but
      because every dimension is a function of <code>--pulse-scale</code>.
    </p>

    <div class="responsive">
      <div v-for="w in responsiveWidths" :key="w" class="responsive__cell">
        <div class="responsive__rule">{{ w }} px</div>
        <div class="responsive__frame" :style="{ width: w + 'px' }">
          <PlayerShell :src="shellFor(w)" :alt="`Pulse Player at ${w} px`" :ratio="shellRatio(w)" />
        </div>
      </div>
    </div>
  </section>
</template>
