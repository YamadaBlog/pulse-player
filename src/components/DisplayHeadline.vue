<script setup lang="ts">
/**
 * DisplayHeadline — alpha.32 huge editorial type panel.
 *
 * One ginormous Geist 900 phrase, sized to flood the visitor's
 * viewport before the next scene. Apple page rhythm: between two
 * busy scenes, sit a giant single statement.
 *
 * No JS — pure CSS clamp + variable axis interpolation tied to the
 * existing `--scroll-progress` channel the hero already writes.
 */

defineProps<{
  /** The phrase. Keep it short — one sentence, one breath. */
  text: string
  /** Side accent line label. */
  eyebrow?: string
}>()
</script>

<template>
  <section class="display" aria-labelledby="display-h">
    <p v-if="eyebrow" class="display__eyebrow">{{ eyebrow }}</p>
    <h2 id="display-h" class="display__h">{{ text }}</h2>
  </section>
</template>

<style scoped>
.display {
  padding: clamp(96px, 22vh, 220px) clamp(24px, 6vw, 80px);
  max-width: 1400px;
  margin: 0 auto;
  text-align: left;
}
.display__eyebrow {
  font-family: 'Geist Mono', ui-monospace, 'SF Mono', Consolas, monospace;
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-amber, #f59e0b);
  margin: 0 0 24px;
}
.display__h {
  font-family:
    'Geist',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-variation-settings: 'wght' 800;
  font-size: clamp(48px, 9vw, 144px);
  line-height: 0.96;
  letter-spacing: -0.038em;
  margin: 0;
  /* Editorial premium: a warm-white → cooler tint horizontal gradient
     instead of a flat fill. NOT the AI-purple gradient — this is a
     near-monochrome that just shifts the eye gently. */
  background: linear-gradient(
    100deg,
    rgba(255, 255, 255, 0.97) 0%,
    rgba(255, 232, 195, 0.86) 55%,
    rgba(214, 178, 130, 0.74) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /* Apple-page style hanging dot for end of statement. */
  text-wrap: balance;
}
</style>
