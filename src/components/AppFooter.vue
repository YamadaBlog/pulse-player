<!-- ════════════════════════════════════════════════════════════════
     AppFooter.vue — extracted from App.vue (P1.1 audit follow-up,
     2026-06-10). Pure markup + style scoped, no script logic, no
     reactive dependencies. Decoupled to reduce App.vue surface area
     without touching the visual or accessibility contract.
     ════════════════════════════════════════════════════════════════ -->
<template>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__brand">pulse-player</div>
      <div class="footer__meta">
        Floating + inline music for Vue 3
        <!-- CC BY 4.0 attribution for the deployed demo tracks
             (NOTICE.md §3bis). Required by the licence — keep accurate
             if PULSE_TRACK*_URL overrides change the music. -->
        <span class="footer__credit"
          >· Music:
          <a
            href="https://incompetech.com"
            target="_blank"
            rel="noopener noreferrer"
            class="footer__credit-link"
            >Kevin MacLeod — incompetech.com</a
          >
          (CC BY 4.0)</span
        >
      </div>
      <a
        class="footer__link"
        href="https://github.com/YamadaBlog/pulse-player"
        target="_blank"
        rel="noopener noreferrer"
        >github →</a
      >
    </div>
  </footer>
</template>

<style scoped>
.footer {
  margin-top: 40px;
  border-top: 1px solid var(--pg-border);
}
.footer__inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 30px 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}
.footer__brand {
  font-weight: 700;
  letter-spacing: -0.01em;
}
.footer__meta {
  color: var(--pg-text-low);
  flex: 1;
}
.footer__link {
  color: var(--pg-accent);
  text-decoration: none;
  font-weight: 600;
}
.footer__link:hover {
  text-decoration: underline;
}
.footer__credit {
  font-size: 12px;
  color: var(--pg-text-low);
}
.footer__credit-link {
  color: var(--pg-text-low);
  text-decoration: underline;
  text-underline-offset: 2px;
}
.footer__credit-link:hover {
  color: var(--pg-text-mid);
}
</style>
