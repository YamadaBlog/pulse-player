<script setup lang="ts">
import { PulsePlayer } from '@pulse-music/vue'
import { VARIANTS, type NamedVariant } from '@pulse-music/tokens'
import { vReveal } from '../composables/reveal'
import { look, withViewTransition } from '../lib/site'

const themes = Object.entries(VARIANTS) as Array<[NamedVariant, (typeof VARIANTS)[NamedVariant]]>

function apply(name: NamedVariant): void {
  withViewTransition(() => {
    look.variant = name
    look.accent = null
  })
}
</script>

<template>
  <section id="themes" class="section">
    <div class="page">
      <header v-reveal class="section-head">
        <p class="eyebrow">Themes</p>
        <h2 class="title">Nine moods. Or bring your own.</h2>
        <p class="lede">
          Pick one with <code>variant</code>, retune it with <code>accent-color</code>, or restyle
          everything with CSS custom properties and <code>::part()</code>. <code>auto</code> even
          samples its accent from the cover art.
        </p>
      </header>

      <ul class="themes">
        <li
          v-for="([name, tokens], i) in themes"
          :key="name"
          v-reveal="i % 3"
          class="theme"
          :data-active="look.variant === name || undefined"
        >
          <div class="theme__head">
            <div>
              <h3>{{ tokens.label }}</h3>
              <p>{{ tokens.description }}</p>
            </div>
            <button
              class="chip"
              type="button"
              :aria-pressed="look.variant === name"
              @click="apply(name)"
            >
              {{ look.variant === name ? 'In use' : 'Use' }}
              <span class="sr-only">the {{ tokens.label }} theme across the page</span>
            </button>
          </div>
          <div class="theme__stage" :class="{ 'theme__stage--photo': name === 'transparent' }">
            <PulsePlayer :variant="name" :ambient-eq="name === 'midnight' || name === 'aurora'" />
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.lede code {
  font-size: 0.9em;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgb(255 255 255 / 0.07);
  color: var(--text);
}
.themes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
.theme {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-4);
  background: linear-gradient(180deg, var(--surface-2), var(--surface));
  transition:
    border-color var(--pulse-dur-slow) var(--pulse-ease-out),
    box-shadow var(--pulse-dur-slow) var(--pulse-ease-out),
    translate var(--pulse-dur-spring) var(--pulse-ease-gentle);
}
.theme:hover {
  translate: 0 -3px;
  border-color: var(--line-strong);
}
.theme[data-active] {
  border-color: color-mix(in oklab, var(--brand) 55%, transparent);
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--brand) 30%, transparent),
    0 20px 50px -30px var(--glow);
}
.theme__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  padding: 4px 4px 0;
}
.theme__head h3 {
  font-size: var(--step-1);
  letter-spacing: -0.01em;
}
.theme__head p {
  font-size: var(--step--1);
  color: var(--text-2);
}
.theme__stage {
  border-radius: 22px;
}
.theme__stage--photo {
  padding: 14px;
  background: center / cover url('/audio/deuces.svg');
}
</style>
