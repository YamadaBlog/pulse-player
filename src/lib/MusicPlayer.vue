<script setup lang="ts">
/**
 * MusicPlayer — Full-size inline player.
 *
 * Sizing model:
 * - Every visible dimension (artwork, title, icons, buttons, padding, radius,
 *   shadows, progress bar, EQ bars, gaps) is driven by a single CSS custom
 *   property: `--pulse-scale` (unitless, typically 0.7 … 1.8).
 * - By default `--pulse-scale` is computed from the CONTAINER width via
 *   container queries (`100cqi / 360px`, clamped). So mounting the same
 *   component in a 280 px sidebar or a 720 px hero produces a coherent,
 *   genuinely proportional player — not a stretched mobile one.
 * - Pass the `size` prop (a number) to override the auto-scale entirely.
 *
 * Props:
 *  - `variant`: visual background preset.
 *  - `customBackground`: any CSS `background` value (used with `variant="custom"`).
 *  - `accentColor`: overrides the local accent (EQ bars, scrub hover, focus).
 *  - `githubUrl`: optional GitHub link. Without it, the icon is decorative.
 *  - `spotifyUrl`: optional Spotify link. Without it, decorative.
 *  - `hideIcons`: hide both icons entirely.
 *  - `size`: override the auto-scale (0.6 – 2.0).
 */
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
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
  /** Override the auto-responsive scale. 0.6 = compact, 1.0 = base, 1.8 = large. */
  size?: number
  /** Apply the subtle grain / noise texture overlay. On by default. */
  noise?: boolean
  /** Enable the drag-to-resize handle in the bottom-right corner. */
  resizable?: boolean
  /** Min / max width when resizable. Defaults: 180 / Infinity (no cap). */
  minWidth?: number
  maxWidth?: number
}>(), {
  variant: 'auto',
  hideIcons: false,
  noise: true,
  resizable: false,
  minWidth: 60,
})

const store = useAudioStore()

// ─── Auto-scale via ResizeObserver
// Map container width to a unitless scale:
// 240 px → 0.7    (very compact / sidebar)
// 360 px → 1.0    (base)
// 480 px → 1.25
// 640 px → 1.55
// 800 px+ → 1.80  (large / hero)
const containerRef = ref<HTMLElement | null>(null)
const autoScale = ref(1.0)
const containerWidth = ref(360)
const isCompact = computed(() => containerWidth.value < COMPACT_THRESHOLD)
const isFab = computed(() => containerWidth.value < FAB_THRESHOLD)
let resizeObs: ResizeObserver | null = null

/** Below this container width the layout collapses to compact mode. */
const COMPACT_THRESHOLD = 170
/** Below this width the player morphs into a circular FAB (just the cover
 *  artwork as a clickable disc). */
const FAB_THRESHOLD = 110

function computeScale(width: number): number {
  // Two-zone ramp:
  // - Above 280 px: gentle linear growth toward the 1.8 cap.
  // - Below 280 px: steeper shrink down to a 0.45 floor so the same
  //   layout (artwork + NOW PLAYING + title + icons + controls) keeps
  //   fitting much further down. Elements scale down rather than
  //   disappearing.
  let s: number
  if (width >= 280) {
    s = 0.85 + ((width - 280) / 600) * 0.95
  } else {
    s = 0.45 + ((width - 170) / 110) * 0.40
  }
  return Math.max(0.45, Math.min(1.8, Number(s.toFixed(3))))
}

const scale = computed(() =>
  typeof props.size === 'number' ? props.size : autoScale.value,
)

const rootStyle = computed(() => {
  const s: Record<string, string> = {
    '--pulse-scale': String(scale.value),
    // Always feed the current cover into the bg layer — the cover-blur is
    // the signature texture that gives EVERY variant its gradient.
    '--pulse-cover': `url(${store.track.cover})`,
  }
  if (props.accentColor) s['--pulse-accent'] = props.accentColor
  if (props.variant === 'custom' && props.customBackground) {
    s['--pulse-custom-bg'] = props.customBackground
  }
  if (userWidth.value !== null) {
    s.width = userWidth.value + 'px'
  }
  return s
})

function seek(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  store.seek((e.clientX - r.left) / r.width)
}

// ─── Manual resize via the bottom-right handle ───────────────────────
const userWidth = ref<number | null>(null)
const isResizing = ref(false)
let resizeStart = { x: 0, w: 0 }

function onResizePointerDown(e: PointerEvent) {
  if (!props.resizable || !containerRef.value) return
  e.preventDefault()
  e.stopPropagation()
  isResizing.value = true
  resizeStart = { x: e.clientX, w: containerRef.value.getBoundingClientRect().width }
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
}

function onResizePointerMove(e: PointerEvent) {
  if (!isResizing.value) return
  const next = resizeStart.w + (e.clientX - resizeStart.x)
  const clamped = Math.max(
    props.minWidth,
    props.maxWidth ? Math.min(props.maxWidth, next) : next,
  )
  userWidth.value = clamped
}

function onResizePointerUp(e: PointerEvent) {
  if (!isResizing.value) return
  isResizing.value = false
  try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch {}
}

onMounted(() => {
  nextTick(() => {
    if (!containerRef.value) return
    autoScale.value = computeScale(containerRef.value.clientWidth)
    containerWidth.value = containerRef.value.clientWidth
    resizeObs = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
        autoScale.value = computeScale(entry.contentRect.width)
      }
    })
    resizeObs.observe(containerRef.value)
  })
})

onUnmounted(() => {
  if (resizeObs) { resizeObs.disconnect(); resizeObs = null }
})

// When the inline player is resized below FAB_THRESHOLD, it really
// turns into the floating FAB — `store.open()` makes the global
// <MiniPlayer /> visible. When the user drags the inline back out
// past the threshold, leave the FAB visible (user controls it via
// the FAB itself).
watch(isFab, (now) => {
  if (now) store.open()
})
</script>

<template>
  <div
    class="mp"
    ref="containerRef"
    :data-variant="variant"
    :data-compact="isCompact ? 'true' : undefined"
    :data-fab="isFab ? 'true' : undefined"
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

    <!-- Cover-art blurred backdrop — rendered ONLY on the `auto` variant.
         `transparent` stays purely transparent (no image, no overlay).
         Tinted variants stay opaque. -->
    <div
      v-if="variant === 'auto'"
      class="mp__bg"
      :class="{ 'mp__bg--active': store.isPlaying }"
    ></div>

    <!-- Subtle grain overlay — rendered on EVERY variant so the noise
         texture is part of the component's identity (matches the original
         dashboard). Disable with `:noise="false"`. -->
    <div v-if="noise" class="mp__noise" aria-hidden="true"></div>

    <div class="mp__art" @click="store.toggle">
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
        <Pause v-if="store.isPlaying" />
        <Play v-else />
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
            <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </component>
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
            <svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          </component>
        </div>
      </div>

      <div class="mp__spacer"></div>

      <div class="mp__meta">
        <h2 class="mp__title">{{ store.track.title }}</h2>
      </div>

      <div class="mp__controls">
        <button class="mp__btn" @click="store.prev" aria-label="Previous">
          <SkipBack />
        </button>
        <button class="mp__btn" @click="store.next" aria-label="Next">
          <SkipForward />
        </button>
      </div>
    </div>

    <div
      class="mp__bar"
      @click="seek"
    >
      <div class="mp__fill" :style="{ width: store.progress + '%' }">
        <div class="mp__dot"></div>
      </div>
    </div>

    <!-- Drag-to-resize handle (bottom-right corner). Pointer events =
         single code path for mouse, touch and pen. -->
    <div
      v-if="resizable"
      class="mp__resize"
      :class="{ 'mp__resize--active': isResizing }"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize player"
      @pointerdown="onResizePointerDown"
      @pointermove="onResizePointerMove"
      @pointerup="onResizePointerUp"
      @pointercancel="onResizePointerUp"
    >
      <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
        <path d="M1 13 L13 1 M5 13 L13 5 M9 13 L13 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════════════════════════
   SCALE SYSTEM
   Every dimension below is derived from --pulse-scale (unitless).
   --pulse-scale defaults to an auto value driven by the container
   width via container queries: `100cqi / 360px` clamped to 0.7–1.8.
   Pass the `size` prop to override the auto-scale entirely.
   ═══════════════════════════════════════════════════════════════ */
.mp {
  /* --pulse-scale (unitless, 0.7 … 1.8) is set inline by a ResizeObserver
     in the component script. It can also be overridden by the `size` prop. */
  --pulse-scale: 1;

  /* All dimensions derived from --pulse-scale.
     Base values tuned so that at scale 1.0 (≈ 360 px container) the
     artwork lands at ~40 % of the container width — same proportions as
     the original dashboard component.
     Text-bearing dimensions use `max(floor, calc(base * scale))` so
     elements stay readable as the player shrinks (they keep their
     baseline size instead of going invisible). */
  --pulse-pad:        calc(14px  * var(--pulse-scale));
  --pulse-radius:     calc(18px  * var(--pulse-scale));
  --pulse-art:        calc(136px * var(--pulse-scale));
  --pulse-art-radius: calc(10px  * var(--pulse-scale));
  --pulse-title:      max(13px, calc(26px  * var(--pulse-scale)));
  --pulse-meta:       max(8px,  calc(10px  * var(--pulse-scale)));
  --pulse-icon:       max(11px, calc(17px  * var(--pulse-scale)));
  --pulse-btn:        max(22px, calc(34px  * var(--pulse-scale)));
  --pulse-btn-icon:   max(13px, calc(18px  * var(--pulse-scale)));
  --pulse-bar-h:      calc(3px   * var(--pulse-scale));
  --pulse-bar-h-hov:  calc(5px   * var(--pulse-scale));
  --pulse-eq-h:       max(8px,  calc(13px  * var(--pulse-scale)));
  --pulse-eq-w:       max(2px,  calc(3px   * var(--pulse-scale)));
  --pulse-eq-gap:     calc(2px   * var(--pulse-scale));
  --pulse-icon-gap:   max(5px,  calc(9px   * var(--pulse-scale)));
  --pulse-row-gap:    calc(7px   * var(--pulse-scale));
  --pulse-spacer:     calc(10px  * var(--pulse-scale));
  --pulse-shadow:     calc(6px   * var(--pulse-scale)) calc(24px * var(--pulse-scale)) rgba(0, 0, 0, 0.5);

  position: relative;
  display: flex;
  align-items: center;
  gap: var(--pulse-pad);
  padding: var(--pulse-pad);
  border-radius: var(--pulse-radius);
  overflow: hidden;
  color: var(--pulse-text, #ffffff);
  background: var(--pulse-bg, #14141a);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  transition: background 0.3s ease;
  /* Font sizing as the base unit for em-based children */
  font-size: var(--pulse-title);
  line-height: 1.1;
}

/* ─── Variants ──────────────────────────────────────────────
   Same opaque palette as v0.6.0 — restoring the original look.
   The only thing every variant gets ON TOP is the `.mp__noise`
   overlay so the grain texture matches the original dashboard. */

/* Auto = cover-blur visible AS the background. No opaque fill on top. */
.mp[data-variant="auto"] {
  background: transparent;
}

/* Transparent = pure transparent. No image, no overlay, just the frame. */
.mp[data-variant="transparent"] {
  background: transparent;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.10);
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
  background:
    radial-gradient(ellipse at 30% 20%, rgba(200, 169, 126, 0.06) 0%, transparent 60%),
    linear-gradient(135deg, #030302 0%, #0A0907 50%, #1A1712 100%);
  box-shadow: inset 0 0 0 1px rgba(200, 169, 126, 0.20);
  color: #F5F0E8;
}
.mp[data-variant="custom"] { background: var(--pulse-custom-bg, transparent); }

/* ─── FAB transformation ────────────────────────────────────
   Below FAB_THRESHOLD (110 px) the inline player REALLY transforms
   into the floating MiniPlayer FAB — `store.open()` (called from
   the watch in the script) makes the global <MiniPlayer /> visible.
   The inline shell becomes invisible (visibility: hidden) but stays
   in the DOM so the ResizeObserver keeps observing and the user
   can drag back up via the floating resize handle. */
.mp[data-fab="true"] {
  visibility: hidden;
  pointer-events: none;
  box-shadow: none;
  background: none;
}
.mp[data-fab="true"] .mp__bg,
.mp[data-fab="true"] .mp__noise { display: none; }
/* The resize handle floats next to the FAB so the user can grab
   it to drag the inline player back out. Visible again, pointer
   events on. */
.mp[data-fab="true"] .mp__resize {
  position: fixed;
  bottom: 16px;
  right: 80px;
  width: 28px;
  height: 28px;
  visibility: visible;
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 901;
  cursor: nw-resize;
}
.mp[data-fab="true"] .mp__resize svg { width: 12px; height: 12px; }

/* ─── Compact mode ──────────────────────────────────────────
   Triggered automatically when the container is < 240 px wide.
   Keeps the artwork + title + play, hides the secondary chrome.
   The component stays readable and interactive at any size. */
.mp[data-compact="true"] {
  --pulse-art:   calc(80px * var(--pulse-scale));
  --pulse-title: calc(15px * var(--pulse-scale));
  --pulse-pad:   calc(10px * var(--pulse-scale));
}
.mp[data-compact="true"] .mp__top,
.mp[data-compact="true"] .mp__spacer { display: none; }
.mp[data-compact="true"] .mp__body {
  justify-content: center;
  gap: calc(var(--pulse-pad) * 0.4);
}
.mp[data-compact="true"] .mp__meta { margin-bottom: 0; }
.mp[data-compact="true"] .mp__controls { gap: calc(var(--pulse-pad) * 0.4); }
.mp[data-compact="true"] .mp__btn {
  width: calc(var(--pulse-btn) * 0.75);
  height: calc(var(--pulse-btn) * 0.75);
}
.mp[data-compact="true"] .mp__btn svg {
  width: calc(var(--pulse-btn-icon) * 0.8);
  height: calc(var(--pulse-btn-icon) * 0.8);
}

.mp__filters { position: absolute; width: 0; height: 0; overflow: hidden; }

/* The cover-blur backdrop — rendered only on the `auto` variant.
   Shows the song's cover art blurred as the player background.
   No opaque overlay sits on top — the cover IS the background. */
.mp__bg {
  position: absolute;
  inset: -10%;
  width: 120%;
  height: 120%;
  background-image: var(--pulse-cover);
  background-size: cover;
  background-position: center;
  filter: blur(40px) saturate(1.2);
  opacity: 1;
  pointer-events: none;
  z-index: 0;
  transition: background-image 0.6s ease;
}

/* ─── Always-on noise overlay ───────────────────────────────
   A fixed SVG fractal-noise pattern, encoded as a data URI so it
   renders identically on every variant (including dark, light, vinyl,
   sunset, etc). Mix-blend-mode 'overlay' keeps it subtle on darks AND
   visible on lights. Toggle via the `noise` prop. */
.mp__noise {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.55;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
  background-size: 240px 240px;
}
/* Light variant — noise needs a different blend mode + opacity to stay
   visible without darkening the surface too much. */
.mp[data-variant="light"] .mp__noise {
  opacity: 0.18;
  mix-blend-mode: multiply;
}

/* ─── Artwork ───────────────────────────────────────────────── */
.mp__art {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: var(--pulse-art);
  height: var(--pulse-art);
  border-radius: var(--pulse-art-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 var(--pulse-shadow),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  overflow: hidden;
}
.mp[data-variant="light"] .mp__art {
  box-shadow:
    0 var(--pulse-shadow),
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
  color: rgba(255, 255, 255, 0.92);
  opacity: 0;
  transition: opacity 0.2s;
}
.mp__art:hover .mp__art-hover { opacity: 1; }
.mp__art-hover svg { width: calc(var(--pulse-art) * 0.28); height: calc(var(--pulse-art) * 0.28); }

/* ─── Body ──────────────────────────────────────────────────── */
.mp__body {
  flex: 1;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: flex-start;  /* lock children to the left edge */
  text-align: left;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  padding-right: calc(var(--pulse-pad) / 2);
  z-index: 1;
}
.mp__top, .mp__meta, .mp__controls { width: 100%; }

.mp__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pulse-pad);
}

.mp__now { display: flex; align-items: center; gap: var(--pulse-row-gap); flex-shrink: 0; min-width: 0; }
.mp__now-label {
  font-size: var(--pulse-meta);
  font-weight: 600;
  color: var(--pulse-text-muted, rgba(255, 255, 255, 0.45));
  letter-spacing: 0.14em;
  white-space: nowrap;
}
.mp[data-variant="light"] .mp__now-label { color: rgba(20, 20, 26, 0.55); }
.mp[data-variant="vinyl"] .mp__now-label { color: rgba(245, 240, 232, 0.5); }

.mp__eq { display: flex; align-items: flex-end; gap: var(--pulse-eq-gap); height: var(--pulse-eq-h); }
.mp__eq i {
  display: block;
  width: var(--pulse-eq-w);
  border-radius: calc(var(--pulse-eq-w) / 2);
  background: var(--pulse-accent, #3DBDA7);
  transition: height 0.08s linear;
}

.mp__icons {
  display: flex;
  align-items: center;
  gap: var(--pulse-icon-gap);
  flex-shrink: 0;
}
.mp__icon-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--pulse-icon);
  height: var(--pulse-icon);
  color: var(--pulse-text-muted, rgba(255, 255, 255, 0.40));
  transition: color 0.15s, transform 0.15s;
  text-decoration: none;
}
.mp__icon-link:not(.mp__icon-link--decorative) { cursor: pointer; }
.mp__icon-link--decorative { cursor: default; pointer-events: none; }
.mp__icon-link:hover { color: var(--pulse-text, rgba(255, 255, 255, 0.95)); transform: translateY(-1px); }
.mp__icon-link svg { display: block; width: 100%; height: 100%; }
.mp[data-variant="light"] .mp__icon-link { color: rgba(20, 20, 26, 0.5); }
.mp[data-variant="light"] .mp__icon-link:hover { color: #14141a; }
.mp[data-variant="vinyl"] .mp__icon-link { color: rgba(245, 240, 232, 0.4); }
.mp[data-variant="vinyl"] .mp__icon-link:hover { color: #F5F0E8; }
.mp__icon-link--spotify { color: #1DB954; opacity: 0.92; }
.mp__icon-link--spotify:hover { color: #1DB954; opacity: 1; }

.mp__spacer { flex: 1; min-height: var(--pulse-spacer); }
.mp__meta { margin-bottom: calc(var(--pulse-pad) / 3); min-width: 0; }

.mp__title {
  font-size: var(--pulse-title);
  font-weight: 800;
  color: var(--pulse-text, #ffffff);
  margin: 0;
  line-height: 1.1;
  letter-spacing: -0.01em;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
}
.mp[data-variant="light"] .mp__title { text-shadow: none; color: #14141a; }
.mp[data-variant="transparent"] .mp__title { text-shadow: 0 1px 6px rgba(0, 0, 0, 0.4); }
.mp[data-variant="vinyl"] .mp__title { color: #F5F0E8; text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5); }

.mp__controls { display: flex; align-items: center; gap: calc(var(--pulse-pad) * 0.75); }
.mp__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--pulse-btn);
  height: var(--pulse-btn);
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--pulse-text-muted, rgba(255, 255, 255, 0.5));
  cursor: pointer;
  padding: 0;
  transition: color 0.15s ease, transform 0.12s ease;
}
.mp__btn svg { width: var(--pulse-btn-icon); height: var(--pulse-btn-icon); }
.mp__btn:hover { color: var(--pulse-text, rgba(255, 255, 255, 0.95)); transform: scale(1.1); }
.mp__btn:focus-visible {
  outline: 2px solid var(--pulse-accent, #3DBDA7);
  outline-offset: 2px;
}
.mp[data-variant="light"] .mp__btn { color: rgba(20, 20, 26, 0.55); }
.mp[data-variant="light"] .mp__btn:hover { color: #14141a; }
.mp[data-variant="vinyl"] .mp__btn { color: rgba(245, 240, 232, 0.6); }
.mp[data-variant="vinyl"] .mp__btn:hover { color: #F5F0E8; }

/* ─── Progress bar ──────────────────────────────────────────── */
.mp__bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: var(--pulse-bar-h);
  background: rgba(255, 255, 255, 0.07);
  cursor: pointer;
  transition: height 0.12s;
  z-index: 3;
}
.mp[data-variant="light"] .mp__bar { background: rgba(0, 0, 0, 0.07); }
.mp__bar:hover { height: var(--pulse-bar-h-hov); }
.mp__fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.4);
  position: relative;
  transition: background 0.12s;
}
.mp[data-variant="light"] .mp__fill { background: rgba(20, 20, 26, 0.35); }
.mp__bar:hover .mp__fill { background: var(--pulse-accent, #3DBDA7); }
.mp__dot {
  position: absolute;
  right: calc(-1 * var(--pulse-bar-h-hov));
  top: 50%;
  transform: translateY(-50%) scale(0);
  width: calc(var(--pulse-bar-h-hov) * 2);
  height: calc(var(--pulse-bar-h-hov) * 2);
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
  transition: transform 0.12s;
}
.mp__bar:hover .mp__dot { transform: translateY(-50%) scale(1); }

/* ─── Resize handle ─────────────────────────────────────────── */
.mp__resize {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 22px;
  height: 22px;
  z-index: 4;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 3px;
  cursor: nwse-resize;
  color: rgba(255, 255, 255, 0.35);
  touch-action: none; /* pointer events take over — no scroll/zoom interference */
  user-select: none;
  -webkit-user-select: none;
  transition: color 0.15s ease, transform 0.15s ease;
}
.mp__resize:hover { color: rgba(255, 255, 255, 0.92); transform: scale(1.15); }
.mp__resize--active { color: var(--pulse-accent, #3DBDA7); }
.mp[data-variant="light"] .mp__resize { color: rgba(20, 20, 26, 0.4); }
.mp[data-variant="light"] .mp__resize:hover { color: rgba(20, 20, 26, 0.92); }
@media (prefers-reduced-motion: reduce) {
  .mp__resize { transition: color 0.1s ease; }
}


@media (prefers-reduced-motion: reduce) {
  .mp, .mp__btn, .mp__bg, .mp__fill, .mp__bar, .mp__dot, .mp__icon-link { transition: none; }
  .mp__eq i { transition: none; }
}
</style>
