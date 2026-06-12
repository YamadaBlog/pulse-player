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
/* Round-22 user feedback — the three feature cards read tiny on 2K
   ("Grossis cette partie, c'est trop petit") : 17/14 px typography in
   a 2560 px viewport. Everything now scales fluidly with clamp(). */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: clamp(20px, 1.8vw, 36px);
}
.feature {
  padding: clamp(28px, 2.6vw, 52px);
  background: var(--pg-surface);
  border: 1px solid var(--pg-border);
  border-radius: 20px;
}
.feature__chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: clamp(32px, 2.4vw, 48px);
  height: clamp(32px, 2.4vw, 48px);
  font-size: clamp(11px, 0.8vw, 15px);
  font-weight: 700;
  color: var(--pg-accent);
  background: rgba(61, 189, 167, 0.12);
  border: 1px solid rgba(61, 189, 167, 0.3);
  border-radius: 50%;
  margin-bottom: clamp(16px, 1.4vw, 26px);
}
.feature__h {
  font-size: clamp(17px, 1.35vw, 27px);
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 10px;
}
.feature__p {
  font-size: clamp(14px, 0.95vw, 19px);
  line-height: 1.65;
  color: var(--pg-text-mid);
  margin: 0;
}
</style>
