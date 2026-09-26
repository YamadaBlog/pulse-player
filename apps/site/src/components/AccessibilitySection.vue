<script setup lang="ts">
import { vReveal } from '../composables/reveal'

const shortcuts = [
  { keys: ['Space', 'K'], action: 'Play / pause' },
  { keys: ['J', 'L'], action: 'Back / forward 10 s' },
  { keys: ['←', '→'], action: 'Seek 5 s (on the progress bar)' },
  { keys: ['Home', 'End'], action: 'Start / end of the track' },
  { keys: ['M'], action: 'Mute / unmute' },
  { keys: ['Shift', 'N'], action: 'Next track', combo: true },
  { keys: ['Shift', 'P'], action: 'Previous track', combo: true },
]

const guarantees = [
  {
    title: 'Real controls',
    body: 'Native buttons with live labels, a proper seek slider with a spoken time value, 24 px minimum targets.',
  },
  {
    title: 'Hardware media keys',
    body: 'Media Session support: keyboard media keys, headsets, lock screen and notification controls just work.',
  },
  {
    title: 'Motion on your terms',
    body: 'prefers-reduced-motion stops every animation, the visualiser loop included. Forced-colors mode is respected.',
  },
  {
    title: 'Any language',
    body: 'Every string is overridable through the labels property — no hard-coded English in the UI.',
  },
]
</script>

<template>
  <section id="accessibility" class="section">
    <div class="page">
      <header v-reveal class="section-head">
        <p class="eyebrow">Accessibility</p>
        <h2 class="title">Built for keyboards, screen readers and lock screens.</h2>
        <p class="lede">
          Focus any player on this page and try the shortcuts — they're scoped to the player you're
          in.
        </p>
      </header>

      <div class="a11y">
        <div v-reveal="1" class="card shortcuts">
          <h3>Keyboard shortcuts</h3>
          <dl>
            <div v-for="s in shortcuts" :key="s.action" class="shortcut">
              <dt>
                <template v-for="(k, i) in s.keys" :key="k">
                  <kbd>{{ k }}</kbd>
                  <span v-if="i < s.keys.length - 1" class="sep">{{ s.combo ? '+' : '/' }}</span>
                </template>
              </dt>
              <dd>{{ s.action }}</dd>
            </div>
          </dl>
        </div>
        <ul class="guarantees">
          <li v-for="(g, i) in guarantees" :key="g.title" v-reveal="i + 1" class="card">
            <h3>{{ g.title }}</h3>
            <p>{{ g.body }}</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.a11y {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-4);
}
@media (max-width: 900px) {
  .a11y {
    grid-template-columns: minmax(0, 1fr);
  }
}
.card {
  padding: var(--space-5);
}
h3 {
  font-size: var(--step-1);
  letter-spacing: -0.01em;
  margin-bottom: var(--space-3);
}
dl {
  display: grid;
  margin: 0;
}
.shortcut {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-4);
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
}
.shortcut:last-child {
  border-bottom: 0;
}
dt {
  display: flex;
  align-items: center;
  gap: 6px;
}
dd {
  margin: 0;
  color: var(--text-2);
  font-size: var(--step--1);
  text-align: right;
}
.sep {
  color: var(--text-3);
  font-size: 12px;
}
.guarantees {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
}
@media (max-width: 560px) {
  .guarantees {
    grid-template-columns: minmax(0, 1fr);
  }
}
.guarantees p {
  color: var(--text-2);
  font-size: var(--step--1);
}
</style>
