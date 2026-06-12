<!-- ════════════════════════════════════════════════════════════════
     PickAMoodSection.vue — section IV · Nine moods gallery.
     Extracted from App.vue (P1.1 round-3, 2026-06-10).

     Fully self-contained : the VariantSpec list had no other consumer
     in App.vue (verified by grep — the demo tour aims its spotlight at
     the CSS class `.variants`, not at the JS array). Keep the
     `class="variants" id="variants"` hooks stable for the spotlight +
     the `#variants` anchor used by capture tooling.

     CSS (.grid, .grid__cell, .grid__label…) stays in App.vue's global
     style block — glow-system.css + responsive-fix.css target the same
     selectors from outside any scope.
     ════════════════════════════════════════════════════════════════ -->
<script setup lang="ts">
import { ref } from 'vue'
import { MusicPlayer, type MusicPlayerVariant } from '../lib'
import PlayerShell from './PlayerShell.vue'
import shellManifest from '../assets/shells/manifest.json'

// Round-14 performance architecture — ONE real MusicPlayer (the
// selected mood) + 8 pre-rendered shells. The grid used to mount 9
// full instances (engine wiring, live backdrop-filter + blur layers
// each) for what is 8/9ths a static illustration. Clicking a shell
// moves the single real instance to that card — interaction fidelity
// preserved at 1/9th the runtime cost. Captures regenerate via
// `npm run generate:shells`.
const shellSrc = import.meta.glob('../assets/shells/mood-*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const shellFor = (id: string) => shellSrc[`../assets/shells/mood-${id}.webp`]
const shellRatio = (id: string) =>
  (shellManifest as Record<string, { ratio: number }>)[`mood-${id}`]?.ratio

const selected = ref('auto')

interface VariantSpec {
  id: string
  variant: MusicPlayerVariant
  label: string
  caption: string
  customBackground?: string
  accentColor?: string
}

const variants: VariantSpec[] = [
  { id: 'auto', variant: 'auto', label: 'Auto', caption: 'Live cover art blur — signature look.' },
  {
    id: 'vinyl',
    variant: 'vinyl',
    label: 'Vinyl',
    caption: 'Warm analog · vinyl + leather.',
    accentColor: '#C8A97E',
  },
  {
    id: 'sunset',
    variant: 'sunset',
    label: 'Sunset',
    caption: 'Sepia · brown gradient.',
    accentColor: '#F59E0B',
  },
  {
    id: 'midnight',
    variant: 'midnight',
    label: 'Midnight',
    caption: 'Deep navy · violet.',
    accentColor: '#8B5CF6',
  },
  {
    id: 'aurora',
    variant: 'aurora',
    label: 'Aurora',
    caption: 'Teal · cyan night.',
    accentColor: '#06B6D4',
  },
  { id: 'dark', variant: 'dark', label: 'Dark', caption: 'Pure neutral dark.' },
  {
    id: 'light',
    variant: 'light',
    label: 'Light',
    caption: 'Light-mode inversion.',
    accentColor: '#6750A4',
  },
  {
    id: 'transparent',
    variant: 'transparent',
    label: 'Transparent',
    caption: 'Frameless — over your bg.',
  },
  {
    id: 'custom-brown',
    variant: 'custom',
    label: 'Custom',
    caption: 'Any CSS background.',
    customBackground: 'linear-gradient(135deg, #2c1610 0%, #4a2c1f 45%, #6b4226 100%)',
    accentColor: '#E8A87C',
  },
]
</script>

<template>
  <section class="section variants" id="variants">
    <p class="section__eyebrow">
      <span class="act-num">IV</span><span class="act-sep">·</span>Nine moods
    </p>
    <h2 class="section__h">Pick a mood.</h2>
    <p class="section__sub">
      Nine curated background presets, including the new <code>vinyl</code> warm analog look.
      <code>accentColor</code> retunes the EQ + progress.
    </p>

    <div class="grid">
      <article
        v-for="v in variants"
        :key="v.id"
        class="grid__cell"
        :class="{ 'grid__cell--live': selected === v.id }"
      >
        <div class="grid__label">
          <span class="grid__label-name">{{ v.label }}</span>
          <code class="grid__label-code">{{ v.variant }}</code>
        </div>
        <!-- ONE live instance (selected mood) ; every other card is a
             pre-rendered shell. Click/Enter a shell to move the live
             player there. -->
        <MusicPlayer
          v-if="selected === v.id"
          :variant="v.variant"
          :custom-background="v.customBackground"
          :accent-color="v.accentColor"
          github-url="https://github.com/YamadaBlog/pulse-player"
          spotify-url="https://open.spotify.com/"
        />
        <button
          v-else
          type="button"
          class="grid__shell-btn"
          :aria-label="`Activate the ${v.label} mood`"
          @click="selected = v.id"
        >
          <PlayerShell
            :src="shellFor(v.id)"
            :alt="`Pulse Player — ${v.label} mood`"
            :ratio="shellRatio(v.id)"
            :variant="v.variant"
          />
        </button>
        <p class="grid__caption">{{ v.caption }}</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
/* Round-14 — shell activation button : zero chrome, the capture IS the
   visual. Hover lift mirrors the live card's presence so the swap
   reads as 'same object'. */
.grid__shell-btn {
  display: block;
  width: 100%;
  padding: 0;
  margin: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 24px;
  transition: transform 160ms ease;
}
.grid__shell-btn:hover {
  transform: translateY(-2px);
}
.grid__shell-btn:focus-visible {
  outline: 2px solid rgba(139, 92, 246, 0.8);
  outline-offset: 4px;
}
@media (prefers-reduced-motion: reduce) {
  .grid__shell-btn,
  .grid__shell-btn:hover {
    transition: none;
    transform: none;
  }
}
</style>
