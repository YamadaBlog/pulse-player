<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { MusicPlayer, useAudioStore } from '../../../src/lib'

const store = useAudioStore()
const log = ref<string[]>([])

function push(line: string) {
  log.value = [line, ...log.value].slice(0, 20)
}

const offs = [
  store.subscribe('play', ({ track, time }) => {
    push(`▶ play ${track.title} at ${time.toFixed(1)}s`)
  }),
  store.subscribe('pause', ({ track, time }) => {
    push(`⏸ pause ${track.title} at ${time.toFixed(1)}s`)
  }),
  store.subscribe('trackchange', ({ from, to, track }) => {
    push(`⏭ trackchange ${from} → ${to} (${track.title})`)
  }),
  store.subscribe('error', ({ reason, detail }) => {
    push(`⚠ error ${reason} (${String(detail ?? '')})`)
  }),
]

onBeforeUnmount(() => offs.forEach((off) => off()))
</script>

<template>
  <main style="padding: 32px; max-width: 720px; margin: 0 auto; font-family: sans-serif">
    <h1>Event bus + counters</h1>

    <MusicPlayer variant="midnight" />

    <h2 style="margin-top: 32px">Counters</h2>
    <ul>
      <li>Plays: {{ store.playCount }}</li>
      <li>Pauses: {{ store.pauseCount }}</li>
      <li>Track changes: {{ store.trackChangeCount }}</li>
    </ul>

    <h2>Event log (last 20)</h2>
    <pre
      style="background: #111; color: #0f0; padding: 12px; max-height: 240px; overflow: auto"
    >{{ log.join('\n') }}</pre>
  </main>
</template>
