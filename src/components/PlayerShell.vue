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
    /**
     * Load eagerly instead of lazily. REQUIRED for shells inside 3D-
     * transformed / backface-hidden contexts (rotate3d faces, phone
     * screen) : lazy images there are never considered "near the
     * viewport" by the browser and stay naturalWidth=0 forever —
     * caught by the live-deploy verify job (round-15).
     */
    eager?: boolean
    /**
     * Mood variant of the captured component — exposed as
     * `data-variant` so the demo glow system (glow-system.css) can
     * bloom shell cells exactly like live `.mp[data-variant]` cards
     * (round-20 : the blooms had silently died with the shell swap).
     */
    variant?: string
  }>(),
  { ratio: 480 / 218, eager: false, variant: undefined },
)
</script>

<template>
  <img
    class="player-shell"
    :src="src"
    :alt="alt"
    :style="{ aspectRatio: String(ratio) }"
    :data-variant="variant"
    :loading="eager ? 'eager' : 'lazy'"
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
  border: 0;
  background: transparent;
  /* Round-21 — the capture is now shadow-FREE (the card's box-shadow
     used to dirty the corners beyond the radius with semi-opaque
     black). The shadow is re-created here with drop-shadow, which
     follows the image's alpha — i.e. the real rounded outline. Static
     raster, never animated. */
  filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.35));
}
</style>
