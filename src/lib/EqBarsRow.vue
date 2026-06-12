<script setup lang="ts">
/**
 * EqBarsRow — v2.3.5 internal micro-component.
 *
 * Renders the 4 `<i>` elements of a condensed EQ row, bound to the
 * store's `eqBars`. Why a dedicated child : Vue re-runs the render
 * effect of EVERY component whose template reads `eqBars` on each
 * notification — when that template was the 1 500-line MusicPlayer
 * (and the 900-line MiniPlayer), each eq tick patched the entire
 * player vdom. Profiled on the demo page (2560×1440, headed
 * Chromium): the broadcast chain was the largest per-frame cost while
 * audio played. Isolating the read here confines the per-tick patch
 * to these 4 elements.
 *
 * Styling stays in the PARENT component (`.mp__eq :deep(i)` etc.) so
 * each call-site keeps its own bar geometry.
 *
 * Not exported from the package index — internal building block.
 */
import { useAudioStore } from './useAudioStore'

const props = withDefaults(
  defineProps<{
    /** Minimum bar scale so a silent band never fully collapses. */
    floor?: number
    /** When true, bars pin to the floor while paused (NOW PLAYING row). */
    idleWhenPaused?: boolean
  }>(),
  { floor: 0.2, idleWhenPaused: false },
)

const store = useAudioStore()
</script>

<template>
  <i
    v-for="(v, idx) in store.eqBars"
    :key="idx"
    :style="{
      '--bar-y': props.idleWhenPaused && !store.isPlaying ? props.floor : Math.max(props.floor, v),
    }"
  ></i>
</template>
