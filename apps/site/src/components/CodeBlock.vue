<script setup lang="ts">
import { computed } from 'vue'
import { highlight } from '../lib/highlight'
import CopyButton from './CopyButton.vue'

const props = defineProps<{ code: string; label?: string }>()
// `highlight()` escapes the source before adding markup, so v-html is safe.
const html = computed(() => highlight(props.code))
</script>

<template>
  <div class="code">
    <div class="code__bar">
      <span class="code__dots" aria-hidden="true"><i /><i /><i /></span>
      <span v-if="label" class="code__label">{{ label }}</span>
      <CopyButton :text="code" label="Copy code" />
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <pre tabindex="0"><code v-html="html" /></pre>
  </div>
</template>

<style scoped>
.code {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-3);
  background: #0a0a10;
}
.code__bar {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 8px 8px 8px 16px;
  border-bottom: 1px solid var(--line);
  background: rgb(255 255 255 / 0.02);
}
.code__dots {
  display: flex;
  gap: 6px;
}
.code__dots i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.12);
}
.code__label {
  margin-right: auto;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-3);
}
pre {
  margin: 0;
  padding: var(--space-5);
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.7;
  color: #d6d6e0;
  tab-size: 2;
}
pre:focus-visible {
  outline-offset: -3px;
}
:deep(.tok-tag) {
  color: #7dd3fc;
}
:deep(.tok-attr) {
  color: #c4b5fd;
}
:deep(.tok-string) {
  color: #86efac;
}
:deep(.tok-keyword) {
  color: #f9a8d4;
}
:deep(.tok-comment) {
  color: #8b8b9c;
  font-style: italic;
}
</style>
