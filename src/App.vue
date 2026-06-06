<script setup lang="ts">
/**
 * Demo app — shows both the inline `MusicPlayer` and the floating `MiniPlayer`.
 *
 * Two demo tracks ship under `/public/audio/`. Replace them (or call
 * `setAudioTracks([...])` before mount) with your own content.
 */
import { computed } from 'vue'
import { MusicPlayer, MiniPlayer, useAudioStore } from './lib'

const store = useAudioStore()

const fmtTime = computed(() => `${store.fmt(store.currentTime)} / ${store.fmt(store.duration)}`)
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1>pulse-player</h1>
      <p>
        A drop-in Vue 3 music player: a full-size <code>MusicPlayer</code> card
        plus a floating <code>MiniPlayer</code> FAB. Persistent global audio
        state survives page navigation. FFT equalizer, circular progress ring,
        drag-to-dismiss, long-press radial menu.
      </p>
    </header>

    <section class="card">
      <h2>Inline player</h2>
      <p class="muted">
        Embed anywhere. Mount/unmount never stops audio.
      </p>
      <MusicPlayer />
    </section>

    <section class="card">
      <h2>Controls</h2>
      <div class="row">
        <button class="btn" @click="store.toggle">
          {{ store.isPlaying ? 'Pause' : 'Play' }}
        </button>
        <button class="btn" @click="store.prev">Prev</button>
        <button class="btn" @click="store.next">Next</button>
        <button class="btn" @click="store.open" :disabled="store.isVisible">Show FAB</button>
        <button class="btn btn--ghost" @click="store.close">Close</button>
      </div>
      <p class="muted small">
        Track {{ store.currentTrack + 1 }} / {{ store.tracks.length }} — {{ store.track.title }} · {{ fmtTime }} ·
        {{ store.isVisible ? 'FAB visible' : 'FAB hidden' }}
      </p>
    </section>

    <section class="card">
      <h2>Floating FAB</h2>
      <p class="muted">
        Bottom-right corner once playback starts (or click <em>Show FAB</em>
        above). Drag to move, swipe to dismiss, long-press for the radial menu.
      </p>
    </section>

    <!-- Persistent global FAB — mount once at the app root. -->
    <MiniPlayer />
  </div>
</template>

<style>
:root {
  --pulse-accent: #3DBDA7;
  --pulse-bg: #14141a;
}
* { box-sizing: border-box; }
html, body, #app {
  margin: 0;
  background: #0a0a0f;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  min-height: 100vh;
}
.page { max-width: 760px; margin: 0 auto; padding: 48px 24px 120px; }
.hero h1 { font-size: 32px; margin: 0 0 12px; letter-spacing: -0.02em; }
.hero p { color: rgba(255, 255, 255, 0.6); line-height: 1.6; margin: 0; }
.hero code { background: rgba(255, 255, 255, 0.08); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
.card {
  margin-top: 40px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
}
.card h2 { margin: 0 0 8px; font-size: 18px; letter-spacing: -0.01em; }
.muted { color: rgba(255, 255, 255, 0.55); margin: 0 0 16px; }
.small { font-size: 12px; }
.row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.btn {
  padding: 10px 16px;
  background: var(--pulse-accent);
  color: #0a0a0f;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: filter 0.15s ease;
}
.btn:hover { filter: brightness(1.1); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
</style>
