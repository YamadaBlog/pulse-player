<script setup lang="ts">
import { PulseFab, usePulseAudio, type FabPlacement } from '@pulse-music/vue'
import { vReveal } from '../composables/reveal'
import { look } from '../lib/site'

const fab = defineModel<{ placement: FabPlacement; pulso: boolean }>({ required: true })
const { open, isPlaying } = usePulseAudio()

const placements: Array<{ id: FabPlacement; label: string }> = [
  { id: 'bottom-end', label: 'Bottom right' },
  { id: 'bottom-start', label: 'Bottom left' },
  { id: 'top-end', label: 'Top right' },
  { id: 'top-start', label: 'Top left' },
]
</script>

<template>
  <section id="fab" class="section">
    <div class="page fab-section">
      <div class="fab-section__copy">
        <header v-reveal class="section-head">
          <p class="eyebrow">Floating player</p>
          <h2 class="title">Keeps playing while people browse.</h2>
          <p class="lede">
            <code>&lt;pulse-fab&gt;</code> shares the audio session with every player on the page.
            It appears when the music starts, springs to the nearest edge when dropped, and
            remembers where it was left.
          </p>
        </header>

        <ul v-reveal="1" class="hints">
          <li><strong>Tap</strong> to play or pause.</li>
          <li><strong>Drag</strong> anywhere — it snaps to the closest side.</li>
          <li>
            <strong>Long-press</strong>, right-click or <kbd>Shift</kbd> + <kbd>F10</kbd> for
            previous, next and close.
          </li>
        </ul>

        <div v-reveal="2" class="controls">
          <div class="chips" role="radiogroup" aria-label="Floating player position">
            <button
              v-for="p in placements"
              :key="p.id"
              class="chip"
              type="button"
              role="radio"
              :aria-checked="fab.placement === p.id"
              @click="fab = { ...fab, placement: p.id }"
            >
              {{ p.label }}
            </button>
          </div>
          <div class="chips">
            <button
              class="chip"
              type="button"
              :aria-pressed="fab.pulso"
              @click="fab = { ...fab, pulso: !fab.pulso }"
            >
              Heartbeat ripple
            </button>
            <button class="btn btn--primary" type="button" @click="open()">
              {{ isPlaying ? 'It’s on screen — try dragging it' : 'Show the mini player' }}
            </button>
          </div>
        </div>
      </div>

      <div v-reveal="1" class="phone" role="group" aria-label="Preview on a phone">
        <div class="phone__screen">
          <div class="phone__status" aria-hidden="true">
            <span>9:41</span><span class="phone__island" /><span>●●●</span>
          </div>
          <div class="phone__app" aria-hidden="true">
            <div class="skeleton skeleton--hero" />
            <div class="skeleton skeleton--title" />
            <div class="skeleton" />
            <div class="skeleton skeleton--short" />
            <div class="skeleton" />
            <div class="skeleton skeleton--short" />
          </div>
          <div class="phone__fab">
            <PulseFab
              placement="inline"
              reveal="always"
              :variant="look.variant"
              :pulso="fab.pulso"
              :size="58"
              locked
              persist-key=""
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fab-section {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: var(--space-8);
  align-items: center;
}
@media (max-width: 900px) {
  .fab-section {
    grid-template-columns: minmax(0, 1fr);
  }
}
.lede code {
  font-size: 0.9em;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgb(255 255 255 / 0.07);
  color: var(--text);
}
.hints {
  display: grid;
  gap: var(--space-3);
  margin: 0 0 var(--space-6);
  padding: 0;
  list-style: none;
  color: var(--text-2);
}
.hints li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-left: 22px;
  position: relative;
}
.hints li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.62em;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--brand);
  box-shadow: 0 0 12px var(--glow);
}
.hints strong {
  color: var(--text);
}
.controls {
  display: grid;
  gap: var(--space-3);
}
.controls .chips {
  align-items: center;
}

/* ─── Phone mock ─────────────────────────────────────────────────── */
.phone {
  justify-self: center;
  width: min(300px, 80vw);
  aspect-ratio: 9 / 19;
  padding: 12px;
  border-radius: 48px;
  background: linear-gradient(160deg, #2a2a36, #0f0f15);
  box-shadow:
    inset 0 0 0 1.5px rgb(255 255 255 / 0.12),
    0 50px 100px -40px rgb(0 0 0 / 0.9),
    0 30px 80px -50px var(--glow);
  rotate: -4deg;
  transition: rotate 1.2s var(--pulse-ease-gentle);
}
.phone:hover {
  rotate: 0deg;
}
.phone__screen {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 38px;
  background: linear-gradient(180deg, #121019, #0b0b10);
}
.phone__status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 22px 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2);
}
.phone__island {
  width: 86px;
  height: 24px;
  border-radius: 999px;
  background: #000;
}
.phone__app {
  display: grid;
  gap: 10px;
  padding: 26px 18px;
}
.skeleton {
  height: 10px;
  border-radius: 6px;
  background: linear-gradient(
      90deg,
      rgb(255 255 255 / 0.06),
      rgb(255 255 255 / 0.12),
      rgb(255 255 255 / 0.06)
    )
    0 0 / 200% 100%;
  animation: shimmer 2.4s linear infinite;
}
.skeleton--hero {
  height: 150px;
  border-radius: 18px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, rgb(139 92 246 / 0.35), rgb(61 189 167 / 0.25));
  animation: none;
}
.skeleton--title {
  height: 16px;
  width: 70%;
}
.skeleton--short {
  width: 55%;
}
.phone__fab {
  position: absolute;
  right: 18px;
  bottom: 26px;
}
@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}
</style>
