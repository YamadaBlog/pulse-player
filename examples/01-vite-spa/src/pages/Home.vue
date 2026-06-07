<script setup lang="ts">
import { MusicPlayer } from '../../../../src/lib'
</script>

<template>
  <main style="padding: 32px; max-width: 720px; margin: 0 auto">
    <h1>pulse-player — Vite + Vue 3 + Pinia</h1>
    <p>The inline player below shares its audio session with the floating FAB at the bottom.</p>

    <MusicPlayer variant="midnight" />

    <p style="margin-top: 24px">
      Press play, then navigate to
      <em>Other page</em>
      to confirm playback survives the route change.
    </p>
  </main>
</template>
