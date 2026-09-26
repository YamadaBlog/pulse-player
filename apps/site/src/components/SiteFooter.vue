<script setup lang="ts">
import BrandMark from './BrandMark.vue'

const links = [
  { href: 'https://github.com/YamadaBlog/pulse-player', label: 'GitHub' },
  { href: 'https://github.com/YamadaBlog/pulse-player/tree/main/docs', label: 'Documentation' },
  { href: 'https://www.npmjs.com/package/@pulse-music/web-component', label: 'npm' },
  { href: 'https://github.com/YamadaBlog/pulse-player/blob/main/CHANGELOG.md', label: 'Changelog' },
]
</script>

<template>
  <footer class="footer">
    <div class="page footer__inner">
      <div class="footer__brand">
        <BrandMark />
        <div>
          <strong>Pulse</strong>
          <p>MIT licensed. Made with Lit, Vue and Vite.</p>
        </div>
      </div>
      <nav aria-label="Footer">
        <ul>
          <li v-for="link in links" :key="link.label">
            <a :href="link.href" rel="noopener">{{ link.label }}</a>
          </li>
        </ul>
      </nav>
      <p class="footer__credit">
        Music: “Protofunk”, “Lobby Time” and “Deuces” by Kevin MacLeod (<a
          href="https://incompetech.com"
          rel="noopener"
          >incompetech.com</a
        >), licensed under
        <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">CC BY 4.0</a> —
        loudness-normalised for the web.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding-block: var(--space-7) calc(var(--space-7) + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--line);
  background: linear-gradient(180deg, transparent, rgb(255 255 255 / 0.015));
}
.footer__inner {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-5) var(--space-7);
  align-items: center;
}
@media (max-width: 720px) {
  .footer__inner {
    grid-template-columns: minmax(0, 1fr);
  }
}
.footer__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.footer__brand p {
  font-size: var(--step--1);
  color: var(--text-2);
}
nav ul {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2) var(--space-5);
  margin: 0;
  padding: 0;
  list-style: none;
}
@media (max-width: 720px) {
  nav ul {
    justify-content: flex-start;
  }
}
nav a {
  display: inline-block;
  padding: 6px 0;
  color: var(--text-2);
  font-size: var(--step--1);
  text-decoration: none;
  transition: color var(--pulse-dur-fast) var(--pulse-ease-out);
}
nav a:hover {
  color: var(--text);
}
.footer__credit {
  grid-column: 1 / -1;
  font-size: 12.5px;
  color: var(--text-3);
}
.footer__credit a {
  color: var(--text-2);
}
</style>
