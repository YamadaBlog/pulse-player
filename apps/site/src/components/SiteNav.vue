<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { usePulseAudio } from '@pulse-music/vue'
import BrandMark from './BrandMark.vue'

const { isPlaying } = usePulseAudio()
const scrolled = ref(false)
const links = [
  { href: '#playground', label: 'Playground' },
  { href: '#sizes', label: 'Sizing' },
  { href: '#themes', label: 'Themes' },
  { href: '#frameworks', label: 'Frameworks' },
]

const onScroll = (): void => {
  scrolled.value = window.scrollY > 24
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <header class="nav" :data-scrolled="scrolled || undefined">
    <nav class="nav__inner page" aria-label="Main">
      <a class="nav__brand" href="#top" aria-label="Pulse — back to top">
        <BrandMark :beating="isPlaying" />
        <span>Pulse</span>
      </a>
      <ul class="nav__links">
        <li v-for="link in links" :key="link.href">
          <a :href="link.href">{{ link.label }}</a>
        </li>
      </ul>
      <a class="nav__gh" href="https://github.com/YamadaBlog/pulse-player" rel="noopener">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.34-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"
          />
        </svg>
        <span>GitHub</span>
      </a>
    </nav>
  </header>
</template>

<style scoped>
.skip {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 100;
  padding: 10px 16px;
  border-radius: 10px;
  background: var(--text);
  color: #0b0b10;
  font-weight: 600;
  text-decoration: none;
  translate: 0 -200%;
  transition: translate var(--pulse-dur-base) var(--pulse-ease-out);
}
.skip:focus-visible {
  translate: 0 0;
}
.nav {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  height: var(--nav-h);
  padding-top: env(safe-area-inset-top, 0px);
  border-bottom: 1px solid transparent;
  transition:
    background-color var(--pulse-dur-slow) var(--pulse-ease-out),
    border-color var(--pulse-dur-slow) var(--pulse-ease-out),
    backdrop-filter var(--pulse-dur-slow) var(--pulse-ease-out);
}
.nav[data-scrolled] {
  background: rgb(7 7 11 / 0.72);
  border-color: var(--line);
  backdrop-filter: blur(18px) saturate(1.4);
}
.nav__inner {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  height: 100%;
}
.nav__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  font-size: 1.0625rem;
  letter-spacing: -0.02em;
  text-decoration: none;
}
.nav__links {
  display: flex;
  gap: var(--space-1);
  margin: 0 auto;
  padding: 0;
  list-style: none;
}
.nav__links a {
  display: block;
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--text-2);
  font-size: var(--step--1);
  font-weight: 500;
  text-decoration: none;
  transition:
    color var(--pulse-dur-fast) var(--pulse-ease-out),
    background-color var(--pulse-dur-fast) var(--pulse-ease-out);
}
.nav__links a:hover {
  color: var(--text);
  background: rgb(255 255 255 / 0.06);
}
.nav__gh {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--line-strong);
  font-size: var(--step--1);
  font-weight: 600;
  text-decoration: none;
  transition:
    border-color var(--pulse-dur-fast) var(--pulse-ease-out),
    background-color var(--pulse-dur-fast) var(--pulse-ease-out);
}
.nav__gh:hover {
  border-color: rgb(255 255 255 / 0.28);
  background: rgb(255 255 255 / 0.05);
}
.nav__gh svg {
  width: 17px;
  height: 17px;
}
@media (max-width: 760px) {
  .nav__links {
    display: none;
  }
  .nav__gh {
    margin-left: auto;
  }
}
</style>
