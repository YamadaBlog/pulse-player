<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const props = defineProps<{ text: string; label?: string }>()
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.text)
  } catch {
    // Clipboard API unavailable (insecure context): fall back to a selection copy.
    const area = document.createElement('textarea')
    area.value = props.text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    document.execCommand('copy')
    area.remove()
  }
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => (copied.value = false), 1600)
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <button
    class="copy"
    type="button"
    :data-copied="copied || undefined"
    :aria-label="copied ? 'Copied' : (label ?? 'Copy to clipboard')"
    @click="copy"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g class="copy__icon">
        <rect x="8" y="8" width="12" height="12" rx="2.5" />
        <path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8" />
      </g>
      <path class="copy__check" d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
    <span class="copy__toast" aria-hidden="true">Copied</span>
    <span class="sr-only" aria-live="polite">{{ copied ? 'Copied to clipboard' : '' }}</span>
  </button>
</template>

<style scoped>
.copy {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: rgb(255 255 255 / 0.04);
  color: var(--text-2);
  cursor: pointer;
  transition:
    color var(--pulse-dur-fast) var(--pulse-ease-out),
    background-color var(--pulse-dur-fast) var(--pulse-ease-out),
    scale var(--pulse-dur-spring) var(--pulse-ease-pop);
}
.copy:hover {
  color: var(--text);
  background: rgb(255 255 255 / 0.08);
}
.copy:active {
  scale: 0.9;
}
svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.copy__icon,
.copy__check {
  transform-origin: center;
  transition:
    opacity var(--pulse-dur-fast) var(--pulse-ease-out),
    scale var(--pulse-dur-spring) var(--pulse-ease-pop);
}
.copy__check {
  opacity: 0;
  scale: 0.4;
  stroke: var(--brand);
  stroke-width: 2.4;
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  transition-property: opacity, scale, stroke-dashoffset;
}
[data-copied] .copy__icon {
  opacity: 0;
  scale: 0.5;
}
[data-copied] .copy__check {
  opacity: 1;
  scale: 1;
  stroke-dashoffset: 0;
}
.copy__toast {
  position: absolute;
  bottom: calc(100% + 8px);
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--text);
  color: #0b0b10;
  font-size: 11px;
  font-weight: 600;
  opacity: 0;
  translate: 0 4px;
  pointer-events: none;
  transition:
    opacity var(--pulse-dur-fast) var(--pulse-ease-out),
    translate var(--pulse-dur-spring) var(--pulse-ease-pop);
}
[data-copied] .copy__toast {
  opacity: 1;
  translate: 0 0;
}
</style>
