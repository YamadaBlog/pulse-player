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
  border: 1px solid var(--rule);
  border-radius: 10px;
  background: var(--night-2);
}
.code__bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 8px 8px 8px 16px;
  border-bottom: 1px solid var(--rule);
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
  color: var(--fg-3);
}
pre {
  margin: 0;
  padding: 1.4rem;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.7;
  color: var(--fg);
  tab-size: 2;
}
pre:focus-visible {
  outline-offset: -3px;
}
:deep(.tok-tag) {
  color: #ff8a5c;
}
:deep(.tok-attr) {
  color: #f3c77b;
}
:deep(.tok-string) {
  color: #9fd8a4;
}
:deep(.tok-keyword) {
  color: var(--signal);
}
:deep(.tok-comment) {
  color: var(--fg-3);
  font-style: italic;
}
</style>
