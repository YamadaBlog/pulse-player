<script setup lang="ts">
/**
 * MusicPlayer — Full-size inline player.
 *
 * Mounting / unmounting NEVER stops audio: playback state is owned by the
 * global `useAudioStore` so the component is purely a projection.
 *
 * Props:
 *  - `variant`: visual background preset. `'auto'` keeps the signature
 *    blurred cover-art background (default). Other presets (`'sunset'`,
 *    `'midnight'`, `'aurora'`, `'dark'`, `'light'`, `'solid'`,
 *    `'transparent'`) replace it with a curated background.
 *  - `customBackground`: any CSS `background` value (gradient, image, etc.).
 *    Used when `variant === 'custom'`.
 *  - `accentColor`: override the local accent (EQ bars, hover progress).
 *  - `githubUrl`: optional inline GitHub icon link (hidden when unset).
 *  - `showSpotifyIcon`: opt-in decorative Spotify glyph (off by default).
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import { useAudioStore } from './useAudioStore'

export type MusicPlayerVariant =
  | 'auto'
  | 'transparent'
  | 'solid'
  | 'dark'
  | 'light'
  | 'sunset'
  | 'midnight'
  | 'aurora'
  | 'vinyl'
  | 'custom'

const props = withDefaults(defineProps<{
  variant?: MusicPlayerVariant
  customBackground?: string
  accentColor?: string
  /** If set, the GitHub icon becomes a link to this URL. */
  githubUrl?: string
  /** If set, the Spotify icon becomes a link to this URL. */
  spotifyUrl?: string
  /** Hide BOTH icons entirely (overrides defaults). */
  hideIcons?: boolean
}>(), {
  variant: 'auto',
  hideIcons: false,
})

const store = useAudioStore()

const isHoveringBar = ref(false)
const containerRef = ref<HTMLElement | null>(null)
let resizeObs: ResizeObserver | null = null
const containerWidth = ref(360)

/** Fluid container-driven scaling — keeps proportions clean from 240 to 800 px. */
const sizing = computed(() => {
  const w = containerWidth.value
  // Artwork = 38% of container width, clamped to a tasteful range.
  const art = Math.max(80, Math.min(220, Math.round(w * 0.38)))
  const padY = Math.max(8, Math.round(art * 0.07))
  return {
    artPx: art,
    heightPx: art + padY * 2,
    paddingPx: padY,
  }
})

const rootStyle = computed(() => {
  const s: Record<string, string> = {
    '--pulse-art-size': sizing.value.artPx + 'px',
    '--pulse-frame-pad': sizing.value.paddingPx + 'px',
    height: sizing.value.heightPx + 'px',
  }
  if (props.accentColor) s['--pulse-accent'] = props.accentColor
  if (props.variant === 'custom' && props.customBackground) {
    s['--pulse-custom-bg'] = props.customBackground
  }
  return s
})

function seek(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  store.seek((e.clientX - r.left) / r.width)
}

function onResize(entries: ResizeObserverEntry[]) {
  for (const entry of entries) {
    containerWidth.value = entry.contentRect.width
  }
}

onMounted(() => {
  nextTick(() => {
    if (!containerRef.value) return
    containerWidth.value = containerRef.value.clientWidth
    resizeObs = new ResizeObserver(onResize)
    resizeObs.observe(containerRef.value)
  })
})

onUnmounted(() => {
  if (resizeObs) { resizeObs.disconnect(); resizeObs = null }
  // NOTE: audio is NOT stopped here — store persists.
})
</script>

<template>
  <div
    class="mp"
    ref="containerRef"
    :data-variant="variant"
    :style="rootStyle"
  >
    <svg class="mp__filters" aria-hidden="true">
      <defs>
        <filter id="pulseMpBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
        </filter>
        <filter id="pulseMpNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
      </defs>
    </svg>

    <!-- Cover-art blurred background, only when variant === 'auto' -->
    <div v-if="variant === 'auto'" class="mp__bg" :class="{ 'mp__bg--active': store.isPlaying }"></div>

    <div
      class="mp__art"
      :style="{ width: 'var(--pulse-art-size)', height: 'var(--pulse-art-size)' }"
      @click="store.toggle"
    >
      <img
        v-for="(t, i) in store.tracks"
        :key="t.cover"
        :src="t.cover"
        alt=""
        class="mp__art-img"
        :class="{ 'mp__art-img--active': store.currentTrack === i }"
        :style="{ objectPosition: t.coverPos, transform: t.coverScale ? `scale(${t.coverScale})` : undefined }"
      />
      <div class="mp__art-hover">
        <Pause v-if="store.isPlaying" :size="28" />
        <Play v-else :size="28" style="margin-left: 3px;" />
      </div>
    </div>

    <div class="mp__body">
      <div class="mp__top">
        <div class="mp__now">
          <span class="mp__eq" aria-hidden="true">
            <i v-for="(v, idx) in store.eqBars" :key="idx" :style="{ height: (store.isPlaying ? Math.max(15, v * 100) : 15) + '%' }"></i>
          </span>
          <span class="mp__now-label">NOW PLAYING</span>
        </div>
        <div class="mp__icons" v-if="!hideIcons">
          <!-- GitHub: link if URL given, decorative span otherwise -->
          <component
            :is="githubUrl ? 'a' : 'span'"
            :href="githubUrl"
            :target="githubUrl ? '_blank' : undefined"
            :rel="githubUrl ? 'noopener noreferrer' : undefined"
            class="mp__icon-link"
            :class="{ 'mp__icon-link--decorative': !githubUrl }"
            :aria-label="githubUrl ? 'GitHub' : undefined"
            :aria-hidden="githubUrl ? undefined : 'true'"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </component>
          <!-- Spotify: link if URL given, decorative span otherwise -->
          <component
            :is="spotifyUrl ? 'a' : 'span'"
            :href="spotifyUrl"
            :target="spotifyUrl ? '_blank' : undefined"
            :rel="spotifyUrl ? 'noopener noreferrer' : undefined"
            class="mp__icon-link mp__icon-link--spotify"
            :class="{ 'mp__icon-link--decorative': !spotifyUrl }"
            :aria-label="spotifyUrl ? 'Open on Spotify' : undefined"
            :aria-hidden="spotifyUrl ? undefined : 'true'"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          </component>
        </div>
      </div>

      <div class="mp__spacer"></div>

      <div class="mp__meta">
        <h2 class="mp__title">{{ store.track.title }}</h2>
      </div>

      <div class="mp__controls">
        <button class="mp__btn" @click="store.prev" aria-label="Previous"><SkipBack :size="18" /></button>
        <button class="mp__btn" @click="store.next" aria-label="Next"><SkipForward :size="18" /></button>
      </div>
    </div>

    <div
      class="mp__bar"
      :class="{ 'mp__bar--hover': isHoveringBar }"
      @click="seek"
      @mouseenter="isHoveringBar = true"
      @mouseleave="isHoveringBar = false"
    >
      <div class="mp__fill" :style="{ width: store.progress + '%' }">
        <div class="mp__dot"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   Container — fluid, variant-driven background.
   `container-type: inline-size` enables container queries for
   typography that scales with the COMPONENT, not the viewport.
   ═══════════════════════════════════════════════════════════════ */
.mp {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--pulse-frame-pad, 12px);
  padding: var(--pulse-frame-pad, 12px);
  border-radius: 16px;
  overflow: hidden;
  container-type: inline-size;
  color: var(--pulse-text, #ffffff);
  background: var(--pulse-bg, #14141a);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  transition: background 0.3s ease;
}

.mp[data-variant="transparent"] {
  background: transparent;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}
.mp[data-variant="solid"] { background: var(--pulse-bg, #14141a); }
.mp[data-variant="dark"]  { background: #0a0a0f; }
.mp[data-variant="light"] {
  background: #f4f4f7;
  color: #14141a;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.mp[data-variant="sunset"] {
  background: linear-gradient(135deg, #1A1410 0%, #2D241C 50%, #4A3527 100%);
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.18);
}
.mp[data-variant="midnight"] {
  background: linear-gradient(135deg, #0a0a18 0%, #14142a 50%, #1a1a3a 100%);
  box-shadow: inset 0 0 0 1px rgba(139, 92, 246, 0.18);
}
.mp[data-variant="aurora"] {
  background: linear-gradient(135deg, #061a1a 0%, #0a2e2e 40%, #103040 100%);
  box-shadow: inset 0 0 0 1px rgba(6, 182, 212, 0.18);
}
.mp[data-variant="vinyl"] {
  /* Warm analog — inspired by vinyl + leather, almost-black with sepia warmth */
  background:
    radial-gradient(ellipse at 30% 20%, rgba(200, 169, 126, 0.06) 0%, transparent 60%),
    linear-gradient(135deg, #030302 0%, #0A0907 50%, #1A1712 100%);
  box-shadow: inset 0 0 0 1px rgba(200, 169, 126, 0.20);
  color: #F5F0E8;
}
.mp[data-variant="vinyl"] .mp__title { color: #F5F0E8; text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5); }
.mp[data-variant="vinyl"] .mp__now-label { color: rgba(245, 240, 232, 0.45); }
.mp[data-variant="vinyl"] .mp__btn { color: rgba(245, 240, 232, 0.55); }
.mp[data-variant="vinyl"] .mp__btn:hover { color: #F5F0E8; }
.mp[data-variant="vinyl"] .mp__icon-link { color: rgba(245, 240, 232, 0.35); }
.mp[data-variant="vinyl"] .mp__icon-link:hover { color: #F5F0E8; }

.mp[data-variant="custom"] {
  background: var(--pulse-custom-bg, transparent);
}

.mp__filters { position: absolute; width: 0; height: 0; overflow: hidden; }

/* Cover-art blurred background (auto variant only) */
.mp__bg {
  position: absolute;
  inset: -20%;
  width: 140%;
  height: 140%;
  filter: url(#pulseMpBlur) url(#pulseMpNoise);
  opacity: 0.22;
  pointer-events: none;
  z-index: 0;
  transition: opacity 0.8s ease;
}
.mp__bg--active { opacity: 0.18; }

/* ═══════════════════════════════════════════════════════════════
   Artwork — square, sized in JS via --pulse-art-size.
   ═══════════════════════════════════════════════════════════════ */
.mp__art {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.mp[data-variant="light"] .mp__art {
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.15),
    inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.mp__art-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.25s ease;
}
.mp__art-img--active { opacity: 1; }

.mp__art-hover {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.85);
  opacity: 0;
  transition: opacity 0.2s;
}
.mp__art:hover .mp__art-hover { opacity: 1; }

/* ═══════════════════════════════════════════════════════════════
   Body — flex column, holds NOW PLAYING / title / controls.
   ═══════════════════════════════════════════════════════════════ */
.mp__body {
  flex: 1;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding-right: calc(var(--pulse-frame-pad, 12px) / 2);
  z-index: 1;
}

.mp__top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }

.mp__now { display: flex; align-items: center; gap: 7px; flex-shrink: 0; }
.mp__now-label {
  font-size: clamp(9px, 2.1cqi, 11px);
  font-weight: 600;
  color: var(--pulse-text-muted, rgba(255, 255, 255, 0.4));
  letter-spacing: 0.12em;
  white-space: nowrap;
}
.mp[data-variant="light"] .mp__now-label { color: rgba(20, 20, 26, 0.55); }

.mp__eq { display: flex; align-items: flex-end; gap: 2px; height: 14px; }
.mp__eq i {
  display: block;
  width: 3px;
  border-radius: 1px;
  background: var(--pulse-accent, #3DBDA7);
  transition: height 0.08s linear;
}

.mp__icons { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.mp__icon-link {
  display: flex; align-items: center; justify-content: center;
  color: var(--pulse-text-muted, rgba(255, 255, 255, 0.35));
  transition: color 0.15s;
  text-decoration: none;
}
.mp__icon-link:not(.mp__icon-link--decorative) { cursor: pointer; }
.mp__icon-link--decorative { cursor: default; pointer-events: none; }
.mp__icon-link:hover { color: var(--pulse-text, rgba(255, 255, 255, 0.85)); }
.mp[data-variant="light"] .mp__icon-link { color: rgba(20, 20, 26, 0.5); }
.mp[data-variant="light"] .mp__icon-link:hover { color: #14141a; }

.mp__icon-link--spotify { color: #1DB954; opacity: 0.85; }
.mp__icon-link--spotify:hover { color: #1DB954; opacity: 1; }

.mp__spacer { flex: 1; min-height: 4px; }

.mp__meta {
  margin-bottom: clamp(4px, 1cqi, 8px);
  min-width: 0;
}

/* ═══════════════════════════════════════════════════════════════
   Title — fluid type. Uses container queries (cqi) so the title
   sizes to the COMPONENT width, not the viewport. Guarantees no
   overflow because `min-width: 0` on parents + ellipsis fallback.
   ═══════════════════════════════════════════════════════════════ */
.mp__title {
  font-size: clamp(15px, 5.5cqi, 40px);
  font-weight: 800;
  color: var(--pulse-text, #ffffff);
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.005em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* Subtle text shadow on dark variants for legibility against blurred bg */
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}
.mp[data-variant="light"] .mp__title { text-shadow: none; color: #14141a; }
.mp[data-variant="transparent"] .mp__title { text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4); }

.mp__controls { display: flex; align-items: center; gap: 12px; }
.mp__btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--pulse-text-muted, rgba(255, 255, 255, 0.45));
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease, transform 0.12s ease;
}
.mp__btn:hover { color: var(--pulse-text, rgba(255, 255, 255, 0.95)); transform: scale(1.1); }
.mp__btn:focus-visible {
  outline: 2px solid var(--pulse-accent, #3DBDA7);
  outline-offset: 2px;
}
.mp[data-variant="light"] .mp__btn { color: rgba(20, 20, 26, 0.55); }
.mp[data-variant="light"] .mp__btn:hover { color: #14141a; }

/* ═══════════════════════════════════════════════════════════════
   Progress bar — absolute bottom, full-width.
   ═══════════════════════════════════════════════════════════════ */
.mp__bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: height 0.12s;
  z-index: 3;
}
.mp[data-variant="light"] .mp__bar { background: rgba(0, 0, 0, 0.06); }
.mp__bar--hover { height: 5px; }
.mp__fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.4);
  position: relative;
  transition: background 0.12s;
}
.mp[data-variant="light"] .mp__fill { background: rgba(20, 20, 26, 0.35); }
.mp__bar--hover .mp__fill { background: var(--pulse-accent, #3DBDA7); }
.mp__dot {
  position: absolute;
  right: -5px;
  top: 50%;
  transform: translateY(-50%) scale(0);
  width: 10px; height: 10px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  transition: transform 0.12s;
}
.mp__bar--hover .mp__dot { transform: translateY(-50%) scale(1); }

/* ═══════════════════════════════════════════════════════════════
   Container-query tuning — uniformly elegant from 240 to 800 px.
   ═══════════════════════════════════════════════════════════════ */

/* Very narrow containers (e.g. portrait phone, sidebar) */
@container (max-width: 280px) {
  .mp { border-radius: 12px; }
  .mp__title { letter-spacing: 0; }
  .mp__btn { width: 28px; height: 28px; }
  .mp__icons { display: none; } /* only hide on truly narrow widths to avoid clipping NOW PLAYING */
}

/* Wide desktop containers — relax spacing a touch */
@container (min-width: 640px) {
  .mp { gap: calc(var(--pulse-frame-pad, 12px) * 1.4); }
  .mp__body { padding-right: var(--pulse-frame-pad, 12px); }
  .mp__title { letter-spacing: -0.01em; }
}

@media (prefers-reduced-motion: reduce) {
  .mp, .mp__btn, .mp__bg, .mp__fill, .mp__bar, .mp__dot { transition: none; }
  .mp__eq i { transition: none; }
}
</style>
