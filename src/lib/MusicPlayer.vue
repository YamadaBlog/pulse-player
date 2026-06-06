<script setup lang="ts">
/**
 * MusicPlayer — Full-size inline player (artwork + title + controls + progress).
 *
 * Visually decoupled from playback: mounting/unmounting NEVER stops audio
 * (state lives in the global `useAudioStore`). Embed anywhere in a layout.
 *
 * Props:
 *  - `githubUrl`: optional URL for an inline GitHub icon link (hidden when
 *    unset — keeps the component neutral by default).
 *  - `showSpotifyIcon`: show a decorative Spotify glyph (no link). Off by default.
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-vue-next'
import { useAudioStore } from './useAudioStore'

defineProps<{
  githubUrl?: string
  showSpotifyIcon?: boolean
}>()

const store = useAudioStore()

const isHoveringBar = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const artSize = ref(120)
const containerHeight = ref(136)
let resizeObs: ResizeObserver | null = null

function calcArtSize() {
  if (!containerRef.value) return
  const w = containerRef.value.clientWidth
  const s = Math.floor(w * 0.4) - 16
  artSize.value = s
  containerHeight.value = s + 16
}

function seek(e: MouseEvent) {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  store.seek((e.clientX - r.left) / r.width)
}

onMounted(() => {
  nextTick(() => {
    calcArtSize()
    if (containerRef.value) {
      resizeObs = new ResizeObserver(() => calcArtSize())
      resizeObs.observe(containerRef.value)
    }
  })
})

onUnmounted(() => {
  if (resizeObs) { resizeObs.disconnect(); resizeObs = null }
  // NOTE: audio is NOT stopped here — store persists.
})
</script>

<template>
  <div class="mp" ref="containerRef" :style="{ height: containerHeight + 'px' }">
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

    <div class="mp__bg" :class="{ 'mp__bg--active': store.isPlaying }"></div>

    <div
      class="mp__art"
      :style="{ width: artSize + 'px', height: artSize + 'px', minWidth: artSize + 'px', marginLeft: '8px' }"
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
          <span class="mp__eq">
            <i v-for="(v, idx) in store.eqBars" :key="idx" :style="{ height: (store.isPlaying ? Math.max(15, v * 100) : 15) + '%' }"></i>
          </span>
          <span class="mp__now-label">NOW PLAYING</span>
        </div>
        <div class="mp__icons" v-if="githubUrl || showSpotifyIcon">
          <a v-if="githubUrl" :href="githubUrl" target="_blank" rel="noopener" class="mp__icon-link" aria-label="GitHub">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <span v-if="showSpotifyIcon" class="mp__icon-link mp__icon-link--spotify" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          </span>
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
.mp {
  position: relative;
  display: flex;
  align-items: center;
  border-radius: 16px;
  overflow: hidden;
  margin-top: 16px;
  background: var(--pulse-bg, #14141a);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.mp__filters { position: absolute; width: 0; height: 0; overflow: hidden; }

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

.mp__art {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  margin: 8px 0;
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
  color: rgba(255, 255, 255, 0.8);
  opacity: 0;
  transition: opacity 0.2s;
}
.mp__art:hover .mp__art-hover { opacity: 1; }

.mp__body {
  flex: 1;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  padding: 8px 16px 8px 16px;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  z-index: 1;
}

.mp__top { display: flex; align-items: center; justify-content: space-between; }

.mp__now { display: flex; align-items: center; gap: 7px; }
.mp__now-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.1em;
}

.mp__eq { display: flex; align-items: flex-end; gap: 2px; height: 14px; }
.mp__eq i {
  display: block;
  width: 3px;
  border-radius: 1px;
  background: var(--pulse-accent, #3DBDA7);
  transition: height 0.08s linear;
}

.mp__icons { display: flex; align-items: center; gap: 8px; }
.mp__icon-link {
  display: flex; align-items: center; justify-content: center;
  color: rgba(255, 255, 255, 0.35);
  transition: color 0.15s;
  text-decoration: none;
}
.mp__icon-link:hover { color: rgba(255, 255, 255, 0.8); }
.mp__icon-link--spotify { color: #1DB954; opacity: 0.85; }
.mp__icon-link--spotify:hover { color: #1DB954; opacity: 1; }

.mp__spacer { flex: 1; }
.mp__meta { margin-bottom: 4px; }

.mp__title {
  font-size: 28px;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
  line-height: 1.1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mp__controls { display: flex; align-items: center; gap: 12px; }
.mp__btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  padding: 0;
  transition: all 0.12s;
}
.mp__btn:hover { color: rgba(255, 255, 255, 0.85); transform: scale(1.1); }

.mp__bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: height 0.12s;
  z-index: 3;
}
.mp__bar--hover { height: 5px; }
.mp__fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.4);
  position: relative;
  transition: background 0.12s;
}
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

@media (max-width: 480px) {
  .mp { height: 180px; }
  .mp__art { width: 110px; margin: 0 0 0 12px; }
  .mp__title { font-size: 20px; }
  .mp__body { padding: 14px 16px 12px 14px; }
}
@media (max-width: 360px) {
  .mp { height: 150px; }
  .mp__art { width: 85px; margin: 0 0 0 10px; }
  .mp__title { font-size: 17px; }
  .mp__body { padding: 10px 12px 8px 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .mp__eq i { transition: none; }
}
</style>
