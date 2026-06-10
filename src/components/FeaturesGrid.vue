<!-- ════════════════════════════════════════════════════════════════
     FeaturesGrid.vue — three-up "Truly proportional / Container-aware
     / Persistent session" cards. Pure markup, zero reactive deps.
     Extracted from App.vue (P1.1 ext, 2026-06-10) to keep the demo
     orchestrator slim.
     ════════════════════════════════════════════════════════════════ -->
<template>
  <section class="section">
    <div class="features">
      <article class="feature">
        <div class="feature__chip">01</div>
        <h3 class="feature__h">Truly proportional</h3>
        <p class="feature__p">
          One CSS variable scales every dimension at once. Artwork, type, chrome and shadows all
          breathe together.
        </p>
      </article>
      <article class="feature">
        <div class="feature__chip">02</div>
        <h3 class="feature__h">Container-aware</h3>
        <p class="feature__p">
          Sizes itself off the container, not the viewport. Sidebar, hero, modal — it always looks
          intentional.
        </p>
      </article>
      <article class="feature">
        <div class="feature__chip">03</div>
        <h3 class="feature__h">Persistent session</h3>
        <p class="feature__p">
          One Pinia store, one audio element. Mount the FAB at the root and playback survives every
          route change.
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}
.feature {
  padding: 28px;
  background: var(--pg-surface);
  border: 1px solid var(--pg-border);
  border-radius: 20px;
}
.feature__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 11px;
  font-weight: 700;
  color: var(--pg-accent);
  background: rgba(61, 189, 167, 0.12);
  border: 1px solid rgba(61, 189, 167, 0.3);
  border-radius: 50%;
  margin-bottom: 16px;
}
.feature__h {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 8px;
}
.feature__p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--pg-text-mid);
  margin: 0;
}
</style>
