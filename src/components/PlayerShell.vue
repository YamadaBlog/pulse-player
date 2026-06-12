<script setup lang="ts">
/**
 * PlayerShell — round-14 performance architecture.
 *
 * A ZERO-COST visual stand-in for a full MusicPlayer instance : one
 * pre-rendered WebP of the real component (captured from the showcase
 * rig via `npm run generate:shells`), pixel-faithful, but with :
 *   - no audio engine wiring, no store subscription ;
 *   - no analyser, no canvas, no rAF loop ;
 *   - no backdrop-filter / live blur layers (the blur is baked into
 *     the capture) ;
 *   - no listeners, no per-frame work — it is an <img>.
 *
 * Rationale (measured) : the demo page mounted 25 full `.mp` instances
 * — 29 live backdrop-filters and 45 blur layers were composited while
 * scrolling at 2K even with audio paused. Decorative cards don't need
 * an engine ; they need the LOOK. Sections keep ONE real instance
 * where interaction matters and shells everywhere else.
 *
 * Regenerate the captures after any visual change to the lib :
 *   npm run generate:shells
 */

withDefaults(
  defineProps<{
    /** Pre-rendered capture URL (import the asset, pass the string). */
    src: string
    /** Accessible description, e.g. "Pulse Player — Vinyl mood". */
    alt: string
    /** Intrinsic aspect ratio of the capture, width/height. */
    ratio?: number
  }>(),
  { ratio: 480 / 218 },
)
</script>

<template>
  <img
    class="player-shell"
    :src="src"
    :alt="alt"
    :style="{ aspectRatio: String(ratio) }"
    loading="lazy"
    decoding="async"
    draggable="false"
  />
</template>

<style scoped>
.player-shell {
  display: block;
  width: 100%;
  height: auto;
  user-select: none;
  /* The capture already contains the card's own radius + shadow ;
     keep the element chrome-free so it composites as a plain quad. */
  border: 0;
  background: transparent;
}
</style>
