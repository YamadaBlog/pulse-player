<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ beating?: boolean }>()
// Unique per instance: the mark appears in the nav and the footer.
const gradient = `mark-${useId()}`
</script>

<template>
  <svg class="mark" :class="{ 'mark--beating': beating }" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient :id="gradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#8b5cf6" />
        <stop offset="1" stop-color="#3dbda7" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="60" height="60" rx="16" fill="#101018" />
    <rect x="2" y="2" width="60" height="60" rx="16" :fill="`url(#${gradient})`" opacity="0.14" />
    <path
      class="mark__base"
      d="M10 32h8l4-10 6 20 4-30 4 30 6-20 4 10h8"
      :stroke="`url(#${gradient})`"
      stroke-width="3.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
    <path
      class="mark__wave"
      pathLength="100"
      d="M10 32h8l4-10 6 20 4-30 4 30 6-20 4 10h8"
      :stroke="`url(#${gradient})`"
      stroke-width="3.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    />
  </svg>
</template>

<style scoped>
.mark {
  width: 32px;
  height: 32px;
  flex: none;
}
.mark__base {
  opacity: 0;
  transition: opacity var(--pulse-dur-slow) var(--pulse-ease-out);
}
.mark--beating .mark__base {
  opacity: 0.45;
}
.mark__wave {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: draw 1.4s var(--pulse-ease-out) 0.2s forwards;
}
.mark--beating .mark__wave {
  stroke: #fff;
  stroke-dashoffset: 0;
  stroke-dasharray: 26 74;
  animation: travel 1.6s linear infinite;
}
@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
@keyframes travel {
  from {
    stroke-dashoffset: 100;
  }
  to {
    stroke-dashoffset: 0;
  }
}
</style>
