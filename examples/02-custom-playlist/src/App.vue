<script setup lang="ts">
import { useAudioStore } from '../../../src/lib'
const store = useAudioStore()
</script>

<template>
  <main style="padding: 32px; max-width: 720px; margin: 0 auto; font-family: sans-serif">
    <h1>Custom controls</h1>
    <p>
      No bundled
      <code>&lt;MusicPlayer /&gt;</code>
      on this page — just the store + a custom UI built around it.
    </p>

    <div style="display: flex; align-items: center; gap: 16px; margin-top: 24px">
      <button @click="store.prev">⏮</button>
      <button @click="store.toggle" style="font-size: 20px">
        {{ store.isPlaying ? '⏸' : '▶' }}
      </button>
      <button @click="store.next">⏭</button>
      <span style="margin-left: 16px">{{ store.track?.title ?? '—' }}</span>
    </div>

    <input
      type="range"
      min="0"
      max="100"
      :value="store.progress"
      @input="(e) => store.seek(+(e.target as HTMLInputElement).value / 100)"
      style="width: 100%; margin-top: 16px"
      aria-label="Seek"
    />

    <p style="color: #888; margin-top: 8px">
      {{ store.fmt(store.currentTime) }} / {{ store.fmt(store.duration) }}
    </p>
  </main>
</template>
