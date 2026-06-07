<script setup lang="ts">
import { RouterView, RouterLink } from 'vue-router'
import { MiniPlayer } from '../../../src/lib'
</script>

<template>
  <nav style="padding: 16px">
    <RouterLink to="/">Home</RouterLink>
    &nbsp;·&nbsp;
    <RouterLink to="/other">Other page</RouterLink>
  </nav>
  <RouterView />

  <!-- The FAB lives at the root of the app, so playback survives
       every route change. -->
  <MiniPlayer />
</template>
