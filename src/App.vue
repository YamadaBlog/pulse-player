<script setup lang="ts">
import { ref } from 'vue'
import { MusicPlayer, MiniPlayer, useAudioStore, type MusicPlayerVariant } from './lib'

const store = useAudioStore()

interface VariantSpec {
  id: MusicPlayerVariant | 'custom-brown'
  variant: MusicPlayerVariant
  label: string
  caption: string
  customBackground?: string
  accentColor?: string
}

const variants: VariantSpec[] = [
  { id: 'auto',        variant: 'auto',        label: 'Auto (cover art)',  caption: 'Blurred artwork background — signature look.' },
  { id: 'vinyl',       variant: 'vinyl',       label: 'Vinyl Dark',        caption: 'Warm analog — vinyl + leather. Gold-cream text.', accentColor: '#C8A97E' },
  { id: 'sunset',      variant: 'sunset',      label: 'Sunset',            caption: 'Warm sepia / brown gradient.', accentColor: '#F59E0B' },
  { id: 'midnight',    variant: 'midnight',    label: 'Midnight',          caption: 'Deep navy / violet gradient.', accentColor: '#8B5CF6' },
  { id: 'aurora',      variant: 'aurora',      label: 'Aurora',            caption: 'Teal / cyan night gradient.', accentColor: '#06B6D4' },
  { id: 'dark',        variant: 'dark',        label: 'Dark',              caption: 'Pure neutral dark surface.' },
  { id: 'light',       variant: 'light',       label: 'Light',             caption: 'Inverted palette for light themes.', accentColor: '#6750A4' },
  { id: 'transparent', variant: 'transparent', label: 'Transparent',       caption: 'Sits over whatever background you give it.' },
  { id: 'custom-brown', variant: 'custom',     label: 'Custom (chocolate)', caption: 'Pass any CSS background via `customBackground`.', customBackground: 'linear-gradient(135deg, #2c1610 0%, #4a2c1f 45%, #6b4226 100%)', accentColor: '#E8A87C' },
]

// Width samples for the responsive section
const responsiveWidths = [320, 480, 720] as const

const activeFabVariant = ref<MusicPlayerVariant>('auto')
const fabPalette: { id: MusicPlayerVariant; label: string; accent?: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'vinyl', label: 'Vinyl', accent: '#C8A97E' },
  { id: 'sunset', label: 'Sunset', accent: '#F59E0B' },
  { id: 'midnight', label: 'Midnight', accent: '#8B5CF6' },
  { id: 'aurora', label: 'Aurora', accent: '#06B6D4' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
]
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="hero__badge">v0.2 · Vue 3 · MIT</div>
      <h1>pulse-player</h1>
      <p class="hero__tagline">
        A drop-in Vue 3 music player. A full-size inline card + a floating
        draggable FAB, backed by one persistent global store. Container-query
        responsive. 8 background presets. Custom gradient and accent ready.
      </p>
    </header>

    <!-- ─── Hero player ─────────────────────────────────────────── -->
    <section class="section">
      <h2 class="section__title">Default</h2>
      <p class="section__sub">Variant <code>auto</code> — uses the live cover art as a blurred background.</p>
      <div class="player-stage">
        <MusicPlayer
          github-url="https://github.com/YamadaBlog/pulse-player"
          spotify-url="https://open.spotify.com/"
        />
      </div>
    </section>

    <!-- ─── Variants gallery ────────────────────────────────────── -->
    <section class="section">
      <h2 class="section__title">Background variants</h2>
      <p class="section__sub">
        Eight curated presets out of the box plus a <code>custom</code> escape
        hatch. Pass <code>accentColor</code> to retune the EQ + progress hue.
      </p>
      <div class="grid">
        <article v-for="v in variants" :key="v.id" class="grid__cell">
          <div class="grid__label">
            <span class="grid__label-name">{{ v.label }}</span>
            <code class="grid__label-code">variant="{{ v.variant }}"</code>
          </div>
          <MusicPlayer
            :variant="v.variant"
            :custom-background="v.customBackground"
            :accent-color="v.accentColor"
          />
          <p class="grid__caption">{{ v.caption }}</p>
        </article>
      </div>
    </section>

    <!-- ─── Responsive proof ────────────────────────────────────── -->
    <section class="section">
      <h2 class="section__title">Responsive</h2>
      <p class="section__sub">
        Container queries: the typography scales with the COMPONENT width, not
        the viewport. Same component, three widths — no layout breaks.
      </p>
      <div class="responsive">
        <div v-for="w in responsiveWidths" :key="w" class="responsive__cell">
          <div class="responsive__rule">{{ w }} px container</div>
          <div class="responsive__frame" :style="{ width: w + 'px' }">
            <MusicPlayer variant="midnight" accent-color="#8B5CF6" />
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Controls ─────────────────────────────────────────────── -->
    <section class="section">
      <h2 class="section__title">Quick controls</h2>
      <div class="controls">
        <button class="btn" @click="store.toggle">{{ store.isPlaying ? 'Pause' : 'Play' }}</button>
        <button class="btn btn--ghost" @click="store.prev">Prev</button>
        <button class="btn btn--ghost" @click="store.next">Next</button>
        <button class="btn btn--ghost" @click="store.open" :disabled="store.isVisible">Show FAB</button>
        <button class="btn btn--ghost" @click="store.close">Close</button>
      </div>
      <p class="muted small">
        Track {{ store.currentTrack + 1 }} / {{ store.tracks.length }} ·
        {{ store.track.title }} ·
        {{ store.fmt(store.currentTime) }} / {{ store.fmt(store.duration) }} ·
        FAB: {{ store.isVisible ? 'visible' : 'hidden' }}
      </p>
    </section>

    <!-- ─── FAB palette switcher ─────────────────────────────────── -->
    <section class="section">
      <h2 class="section__title">Floating FAB — pick a variant</h2>
      <p class="section__sub">
        Drag to move, swipe down/right to dismiss, long-press for the radial menu.
      </p>
      <div class="palette">
        <button
          v-for="opt in fabPalette"
          :key="opt.id"
          class="palette__chip"
          :class="{ 'palette__chip--active': activeFabVariant === opt.id }"
          @click="activeFabVariant = opt.id"
        >
          {{ opt.label }}
        </button>
      </div>
    </section>

    <footer class="footer">
      <span>pulse-player · floating + inline music for Vue 3</span>
      <a href="https://github.com/YamadaBlog/pulse-player" target="_blank" rel="noopener">github →</a>
    </footer>

    <!-- Global, persistent across pages -->
    <MiniPlayer
      :variant="activeFabVariant"
      :accent-color="fabPalette.find(p => p.id === activeFabVariant)?.accent"
    />
  </div>
</template>

<style>
:root {
  --pulse-accent: #3DBDA7;
  --pulse-bg: #14141a;
}
* { box-sizing: border-box; }
html, body, #app {
  margin: 0;
  background: #06060a;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
.page { max-width: 1080px; margin: 0 auto; padding: 56px 24px 140px; }

.hero { margin-bottom: 56px; }
.hero__badge {
  display: inline-block;
  padding: 5px 11px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--pulse-accent);
  background: rgba(61, 189, 167, 0.10);
  border: 1px solid rgba(61, 189, 167, 0.25);
  border-radius: 999px;
  margin-bottom: 18px;
}
.hero h1 {
  font-size: clamp(36px, 5vw, 56px);
  font-weight: 900;
  margin: 0 0 14px;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #ffffff 0%, #b8b8c4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero__tagline { color: rgba(255, 255, 255, 0.62); line-height: 1.6; max-width: 720px; font-size: 17px; }

.section { margin-bottom: 64px; }
.section__title {
  font-size: 22px;
  letter-spacing: -0.015em;
  margin: 0 0 6px;
}
.section__sub { color: rgba(255, 255, 255, 0.55); margin: 0 0 22px; line-height: 1.55; }
.section__sub code,
.hero__tagline code {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.88em;
}

.player-stage { max-width: 680px; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 28px;
}
.grid__cell { display: flex; flex-direction: column; gap: 8px; }
.grid__label { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.grid__label-name { font-size: 13px; font-weight: 600; letter-spacing: -0.005em; }
.grid__label-code {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 7px;
  border-radius: 4px;
}
.grid__caption { color: rgba(255, 255, 255, 0.5); font-size: 12.5px; line-height: 1.5; margin: 6px 0 0; }

.responsive { display: flex; flex-direction: column; gap: 26px; align-items: flex-start; }
.responsive__cell { width: 100%; max-width: 720px; }
.responsive__rule {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.responsive__frame { resize: horizontal; overflow: hidden; }

.controls { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.btn {
  padding: 10px 18px;
  background: var(--pulse-accent);
  color: #06060a;
  border: none;
  border-radius: 999px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease;
}
.btn:hover { filter: brightness(1.1); }
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: 0.35; cursor: not-allowed; }
.btn--ghost {
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.palette { display: flex; flex-wrap: wrap; gap: 8px; }
.palette__chip {
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.palette__chip:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
.palette__chip--active {
  color: var(--pulse-accent);
  background: rgba(61, 189, 167, 0.10);
  border-color: rgba(61, 189, 167, 0.40);
}

.muted { color: rgba(255, 255, 255, 0.50); margin: 0; }
.small { font-size: 12px; }

.footer {
  margin-top: 80px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12.5px;
}
.footer a { color: var(--pulse-accent); text-decoration: none; }
.footer a:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .page { padding: 40px 18px 120px; }
  .grid { grid-template-columns: 1fr; }
}
</style>
