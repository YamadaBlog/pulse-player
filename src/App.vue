<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { MusicPlayer, MiniPlayer, useAudioStore, type MusicPlayerVariant } from './lib'
import { useDemoTour, type DemoStep } from './composables/useDemoTour'

const store = useAudioStore()

// ─── Showcase mode (?showcase=1 — used for README hero capture) ────────
// Optional query params:
//   ?showcase=1                 → default (auto variant)
//   ?showcase=1&v=vinyl         → render that variant
//   ?showcase=1&v=sunset&a=...  → variant + accent override
const showcaseParams = () => {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search)
}
const showcase = computed(() => showcaseParams()?.has('showcase') ?? false)
const showcaseVariant = computed<MusicPlayerVariant>(() => {
  const v = showcaseParams()?.get('v') as MusicPlayerVariant | null
  const allowed: MusicPlayerVariant[] = [
    'auto', 'transparent', 'solid', 'dark', 'light',
    'sunset', 'midnight', 'aurora', 'vinyl', 'custom',
  ]
  return v && allowed.includes(v) ? v : 'auto'
})
const SHOWCASE_ACCENTS: Partial<Record<MusicPlayerVariant, string>> = {
  vinyl: '#C8A97E',
  sunset: '#F59E0B',
  midnight: '#8B5CF6',
  aurora: '#06B6D4',
  light: '#6750A4',
}
const showcaseAccent = computed(() =>
  showcaseParams()?.get('a') ?? SHOWCASE_ACCENTS[showcaseVariant.value],
)

// Showcase mode starts on track 2 (white "a couple of good days" cover —
// gives the backdrop a warm cream palette that reads cleanly on README).
onMounted(() => {
  if (showcase.value) store.loadTrack(1)
})

// ─── Interactive size slider ───────────────────────────────────
const userScale = ref(1.0)
const SIZE_PRESETS = [
  { label: 'S',   value: 0.75 },
  { label: 'M',   value: 1.0 },
  { label: 'L',   value: 1.35 },
  { label: 'XL',  value: 1.7 },
] as const

function setPreset(v: number) { userScale.value = v }

// ─── Variants gallery ──────────────────────────────────────────
interface VariantSpec {
  id: string
  variant: MusicPlayerVariant
  label: string
  caption: string
  customBackground?: string
  accentColor?: string
}

const variants: VariantSpec[] = [
  { id: 'auto',         variant: 'auto',        label: 'Auto',         caption: 'Live cover art blur — signature look.' },
  { id: 'vinyl',        variant: 'vinyl',       label: 'Vinyl',        caption: 'Warm analog · vinyl + leather.', accentColor: '#C8A97E' },
  { id: 'sunset',       variant: 'sunset',      label: 'Sunset',       caption: 'Sepia · brown gradient.', accentColor: '#F59E0B' },
  { id: 'midnight',     variant: 'midnight',    label: 'Midnight',     caption: 'Deep navy · violet.', accentColor: '#8B5CF6' },
  { id: 'aurora',       variant: 'aurora',      label: 'Aurora',       caption: 'Teal · cyan night.', accentColor: '#06B6D4' },
  { id: 'dark',         variant: 'dark',        label: 'Dark',         caption: 'Pure neutral dark.' },
  { id: 'light',        variant: 'light',       label: 'Light',        caption: 'Light-mode inversion.', accentColor: '#6750A4' },
  { id: 'transparent',  variant: 'transparent', label: 'Transparent',  caption: 'Frameless — over your bg.' },
  { id: 'custom-brown', variant: 'custom',      label: 'Custom',       caption: 'Any CSS background.',
    customBackground: 'linear-gradient(135deg, #2c1610 0%, #4a2c1f 45%, #6b4226 100%)', accentColor: '#E8A87C' },
]

const responsiveWidths = [320, 480, 720] as const

// ─── Hero variant — reactive so the demo tour can cycle it ─────
const heroVariant = ref<MusicPlayerVariant>('auto')
const heroAccent = ref<string | undefined>(undefined)

// ─── FAB switcher ─────────────────────────────────────────────
const activeFabVariant = ref<MusicPlayerVariant>('auto')
const fabPulso = ref(false)
const fabPalette: { id: MusicPlayerVariant; label: string; accent?: string }[] = [
  { id: 'auto',     label: 'Auto' },
  { id: 'vinyl',    label: 'Vinyl',    accent: '#C8A97E' },
  { id: 'sunset',   label: 'Sunset',   accent: '#F59E0B' },
  { id: 'midnight', label: 'Midnight', accent: '#8B5CF6' },
  { id: 'aurora',   label: 'Aurora',   accent: '#06B6D4' },
  { id: 'dark',     label: 'Dark' },
  { id: 'light',    label: 'Light' },
]

// ═══════════════════════════════════════════════════════════════
// GUIDED DEMO TOUR — scripted ~50 s walk-through
// Click "Watch demo" to launch. The banner up top stays in front
// of the user with a Stop button at all times.
// ═══════════════════════════════════════════════════════════════
const tour = useDemoTour()

const THEME_SHOWCASE: { variant: MusicPlayerVariant; accent?: string; label: string }[] = [
  { variant: 'auto',     label: 'Auto' },
  { variant: 'midnight', label: 'Midnight', accent: '#8B5CF6' },
  { variant: 'sunset',   label: 'Sunset',   accent: '#F59E0B' },
  { variant: 'aurora',   label: 'Aurora',   accent: '#06B6D4' },
  { variant: 'vinyl',    label: 'Vinyl',    accent: '#C8A97E' },
]

const demoSteps: DemoStep[] = [
  {
    title: 'Welcome',
    run: async (ctx) => {
      ctx.setMessage('A drop-in music player for Vue 3 — let me show you around.')
      await ctx.scrollTo('.hero')
      await ctx.delay(2200)
    },
  },
  {
    title: 'Press play',
    run: async (ctx) => {
      ctx.setMessage('Real audio. Real FFT. The bars react to the track.')
      if (!store.isPlaying) store.toggle()
      await ctx.delay(3200)
    },
  },
  {
    title: 'Responsive scaling',
    run: async (ctx) => {
      ctx.setMessage('One CSS variable scales every dimension — try the slider yourself after.')
      await ctx.scrollTo('.resize-stage')
      await ctx.delay(400)
      await ctx.tween((v) => { userScale.value = v }, userScale.value, 0.75, 900)
      await ctx.delay(600)
      await ctx.tween((v) => { userScale.value = v }, 0.75, 1.7, 1100)
      await ctx.delay(600)
      await ctx.tween((v) => { userScale.value = v }, 1.7, 1.0, 900)
      await ctx.delay(500)
    },
  },
  {
    title: 'Themes',
    run: async (ctx) => {
      ctx.setMessage('Nine themes, one component. Same player, every mood.')
      await ctx.scrollTo('.hero__player')
      for (const t of THEME_SHOWCASE) {
        if (ctx.signal.aborted) return
        heroVariant.value = t.variant
        heroAccent.value = t.accent
        ctx.setMessage(`Theme · ${t.label}`)
        await ctx.delay(1300)
      }
      heroVariant.value = 'auto'
      heroAccent.value = undefined
      await ctx.delay(300)
    },
  },
  {
    title: 'Ambient EQ',
    run: async (ctx) => {
      ctx.setMessage('Ambient EQ — 64 spectrum-coloured bars across every player.')
      store.ambientEq = true
      await ctx.delay(3000)
    },
  },
  {
    title: 'Floating FAB',
    run: async (ctx) => {
      ctx.setMessage('A persistent floating FAB — draggable, dismissible, always in sync.')
      await ctx.scrollTo('.palette')
      if (!store.isVisible) store.open()
      await ctx.delay(900)
      fabPulso.value = true
      ctx.setMessage('Pulso — a heartbeat ripple that only animates while the music plays.')
      await ctx.delay(3000)
      fabPulso.value = false
      await ctx.delay(300)
    },
  },
  {
    title: 'You’re in',
    run: async (ctx) => {
      ctx.setMessage('That’s pulse-player. Drop it in. Ship it. Have fun exploring.')
      await ctx.scrollTo('.hero')
      await ctx.delay(2400)
    },
  },
]

// Snapshot whatever state existed before the tour started so we can
// restore it cleanly on Stop / Done.
let preDemoState: {
  heroVariant: MusicPlayerVariant
  heroAccent: string | undefined
  ambientEq: boolean
  userScale: number
  fabPulso: boolean
  wasPlaying: boolean
  fabVisible: boolean
} | null = null

function startDemo() {
  if (tour.isRunning.value) return
  preDemoState = {
    heroVariant: heroVariant.value,
    heroAccent: heroAccent.value,
    ambientEq: store.ambientEq,
    userScale: userScale.value,
    fabPulso: fabPulso.value,
    wasPlaying: store.isPlaying,
    fabVisible: store.isVisible,
  }
  tour.start(demoSteps, { onStop: restoreFromDemo })
}

function stopDemo() {
  tour.stop()
}

function restoreFromDemo() {
  if (!preDemoState) return
  // Keep audio playing if the user started it — most pleasant outcome.
  if (preDemoState.heroVariant !== heroVariant.value) heroVariant.value = preDemoState.heroVariant
  heroAccent.value = preDemoState.heroAccent
  // Keep ambient EQ ON after a successful tour (it was the highlight) —
  // but if user hit Stop early, restore. Heuristic: progress < 0.9 = stop.
  if (tour.progress.value < 0.85 && !preDemoState.ambientEq) {
    store.ambientEq = false
  }
  userScale.value = preDemoState.userScale
  fabPulso.value = preDemoState.fabPulso
  // FAB visibility: keep the demo's outcome (visible) unless it was hidden
  if (!preDemoState.fabVisible && tour.progress.value < 0.85) {
    store.close()
  }
  preDemoState = null
}

onUnmounted(() => {
  if (tour.isRunning.value) tour.stop()
})

// ─── Hero blurred backdrop driven by current cover ────────────
const hero = computed(() => ({
  '--hero-cover': `url(${store.track.cover})`,
}))
</script>

<template>
  <div class="app">
    <!-- ═══════════════════════════════════════════════════════════════
         SHOWCASE — clean hero capture for the README. Activate with
         `?showcase=1`. Renders the player centered over a blurred
         cover-art backdrop with rounded corners — no chrome, no text.
         ═══════════════════════════════════════════════════════════════ -->
    <section v-if="showcase" class="showcase" :style="hero">
      <div class="showcase__backdrop" aria-hidden="true"></div>
      <div class="showcase__player">
        <MusicPlayer
          :variant="showcaseVariant"
          :accent-color="showcaseAccent"
          github-url="https://github.com/YamadaBlog/pulse-player"
          spotify-url="https://open.spotify.com/"
        />
      </div>
    </section>

    <template v-if="!showcase">
    <!-- ═══════════════════════════════════════════════════════════════
         DEMO BANNER — sticky at the top of the viewport while the
         guided tour runs. Caption + progress bar + Stop button.
         ═══════════════════════════════════════════════════════════════ -->
    <Transition name="demo-banner">
      <div v-if="tour.isRunning.value" class="demo-banner" role="status" aria-live="polite">
        <div class="demo-banner__inner">
          <div class="demo-banner__pulse" aria-hidden="true"></div>
          <div class="demo-banner__meta">
            <div class="demo-banner__chip">
              PULSE DEMO · <strong>{{ tour.title.value }}</strong>
              <span class="demo-banner__step">
                · Step {{ tour.currentStep.value + 1 }} / {{ tour.totalSteps.value }}
              </span>
            </div>
            <div class="demo-banner__caption">{{ tour.message.value }}</div>
          </div>
          <button class="demo-banner__stop" @click="stopDemo" aria-label="Stop demo">
            <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
              <rect x="2" y="2" width="8" height="8" rx="1" fill="currentColor"/>
            </svg>
            Stop
          </button>
        </div>
        <div class="demo-banner__progress">
          <div class="demo-banner__progress-bar" :style="{ width: tour.progress.value * 100 + '%' }"></div>
        </div>
      </div>
    </Transition>

    <!-- ═══════════════════════════════════════════════════════════════
         HERO — Apple-grade showcase with blurred cover backdrop
         ═══════════════════════════════════════════════════════════════ -->
    <section class="hero" :style="hero">
      <div class="hero__backdrop" aria-hidden="true"></div>
      <div class="hero__glow" aria-hidden="true"></div>

      <div class="hero__inner">
        <div class="hero__badge">v0.11 · Vue 3 · MIT · ~47 kB gzip</div>
        <h1 class="hero__title">Premium drop-in music for Vue 3.</h1>
        <p class="hero__lede">
          An inline card and a floating FAB. One global audio session. FFT
          visualiser, nine themes, container-aware sizing — and a guided
          demo that walks you through the whole thing. Drop in. Ship.
        </p>

        <div class="hero__player">
          <MusicPlayer
            :variant="heroVariant"
            :accent-color="heroAccent"
            github-url="https://github.com/YamadaBlog/pulse-player"
            spotify-url="https://open.spotify.com/"
          />
        </div>

        <div class="hero__cta">
          <button class="cta cta--primary" @click="startDemo" :disabled="tour.isRunning.value">
            <span class="cta__icon" aria-hidden="true">
              <svg viewBox="0 0 14 14" width="13" height="13"><path d="M3 2 L11 7 L3 12 Z" fill="currentColor"/></svg>
            </span>
            Watch demo
          </button>
          <a class="cta cta--ghost" href="https://github.com/YamadaBlog/pulse-player" target="_blank" rel="noopener">
            View on GitHub
            <span class="cta__arrow">→</span>
          </a>
          <button class="cta cta--text" @click="store.toggle">
            {{ store.isPlaying ? 'Pause music' : 'Play music' }}
          </button>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         INTERACTIVE — Resize the component live
         ═══════════════════════════════════════════════════════════════ -->
    <section class="section section--narrow">
      <p class="section__eyebrow">Live · Interactive</p>
      <h2 class="section__h">Resize it. Everything follows.</h2>
      <p class="section__sub">
        One <code>--pulse-scale</code> variable drives the artwork, title,
        icons, buttons, padding, radius, shadows, EQ bars, progress and gaps.
        Move the slider — there is no breakpoint trick.
      </p>

      <div class="resize-stage">
        <div class="resize-stage__player" :style="{ maxWidth: 360 + userScale * 280 + 'px' }">
          <MusicPlayer
            :size="userScale"
            variant="midnight"
            accent-color="#8B5CF6"
            github-url="https://github.com/YamadaBlog/pulse-player"
            spotify-url="https://open.spotify.com/"
          />
        </div>

        <div class="resize-controls">
          <div class="presets" role="group" aria-label="Size presets">
            <button
              v-for="p in SIZE_PRESETS"
              :key="p.label"
              class="presets__btn"
              :class="{ 'presets__btn--active': Math.abs(userScale - p.value) < 0.01 }"
              @click="setPreset(p.value)"
            >{{ p.label }}</button>
          </div>
          <label class="slider">
            <span class="slider__label">Scale</span>
            <input
              type="range"
              min="0.6" max="1.8" step="0.01"
              v-model.number="userScale"
              aria-label="Component scale"
            />
            <span class="slider__value">×{{ userScale.toFixed(2) }}</span>
          </label>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         DRAG TO RESIZE — manual pointer-driven resize
         ═══════════════════════════════════════════════════════════════ -->
    <section class="section section--narrow">
      <p class="section__eyebrow">Drag · Pointer events</p>
      <h2 class="section__h">Grab the corner. Resize it yourself.</h2>
      <p class="section__sub">
        Pass <code>resizable</code> to the inline player and a diagonal handle
        appears in the bottom-right corner. Mouse, finger or stylus — same
        code path (pointer events + <code>setPointerCapture</code>). Pull it
        small enough and it collapses to compact mode automatically.
      </p>

      <div class="drag-stage">
        <div class="drag-stage__hint">
          <span class="drag-stage__dot"></span>
          Grab the
          <span class="drag-stage__icon" aria-hidden="true">
            <svg viewBox="0 0 14 14" width="14" height="14"><path d="M1 13 L13 1 M5 13 L13 5 M9 13 L13 9" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
          </span>
          handle in the bottom-right corner
        </div>
        <MusicPlayer
          variant="midnight"
          accent-color="#8B5CF6"
          resizable
          :min-width="60"
          github-url="https://github.com/YamadaBlog/pulse-player"
          spotify-url="https://open.spotify.com/"
        />
        <label class="ambient-toggle" :class="{ 'ambient-toggle--on': store.ambientEq }">
          <input type="checkbox" v-model="store.ambientEq" />
          <span class="ambient-toggle__dot"></span>
          <span class="ambient-toggle__label">Ambient EQ — global</span>
        </label>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         FEATURES — Three-up
         ═══════════════════════════════════════════════════════════════ -->
    <section class="section">
      <div class="features">
        <article class="feature">
          <div class="feature__chip">01</div>
          <h3 class="feature__h">Truly proportional</h3>
          <p class="feature__p">
            One CSS variable scales every dimension at once. Artwork, type,
            chrome and shadows all breathe together.
          </p>
        </article>
        <article class="feature">
          <div class="feature__chip">02</div>
          <h3 class="feature__h">Container-aware</h3>
          <p class="feature__p">
            Sizes itself off the container, not the viewport. Sidebar, hero,
            modal — it always looks intentional.
          </p>
        </article>
        <article class="feature">
          <div class="feature__chip">03</div>
          <h3 class="feature__h">Persistent session</h3>
          <p class="feature__p">
            One Pinia store, one audio element. Mount the FAB at the root
            and playback survives every route change.
          </p>
        </article>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         VARIANTS — gallery
         ═══════════════════════════════════════════════════════════════ -->
    <section class="section">
      <p class="section__eyebrow">Library · 9 presets</p>
      <h2 class="section__h">Pick a mood.</h2>
      <p class="section__sub">
        Nine curated background presets, including the new <code>vinyl</code>
        warm analog look. <code>accentColor</code> retunes the EQ + progress.
      </p>

      <div class="grid">
        <article v-for="v in variants" :key="v.id" class="grid__cell">
          <div class="grid__label">
            <span class="grid__label-name">{{ v.label }}</span>
            <code class="grid__label-code">{{ v.variant }}</code>
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

    <!-- ═══════════════════════════════════════════════════════════════
         RESPONSIVE — Three sizes side by side
         ═══════════════════════════════════════════════════════════════ -->
    <section class="section">
      <p class="section__eyebrow">Responsive · Container queries</p>
      <h2 class="section__h">Same component. Three widths.</h2>
      <p class="section__sub">
        At 320 px the artwork is compact, the title sits tight. At 720 px the
        same component fills its space — bigger artwork, larger type, deeper
        chrome — not because there is a media query, but because every
        dimension is a function of <code>--pulse-scale</code>.
      </p>

      <div class="responsive">
        <div v-for="w in responsiveWidths" :key="w" class="responsive__cell">
          <div class="responsive__rule">{{ w }} px</div>
          <div class="responsive__frame" :style="{ width: w + 'px' }">
            <MusicPlayer variant="midnight" accent-color="#8B5CF6"
              :github-url="'https://github.com/YamadaBlog/pulse-player'"
              :spotify-url="'https://open.spotify.com/'"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         FAB
         ═══════════════════════════════════════════════════════════════ -->
    <section class="section section--narrow">
      <p class="section__eyebrow">Floating FAB</p>
      <h2 class="section__h">Persistent, draggable, dismissible.</h2>
      <p class="section__sub">
        Mount once at the root. Drag to move, swipe down/right to dismiss,
        long-press for the radial menu. The ring around it tracks progress.
      </p>

      <div class="palette" role="group" aria-label="Mini-player variant">
        <button
          v-for="opt in fabPalette"
          :key="opt.id"
          class="palette__chip"
          :class="{ 'palette__chip--active': activeFabVariant === opt.id }"
          @click="activeFabVariant = opt.id"
        >{{ opt.label }}</button>
      </div>
      <div class="palette__hint">
        <button class="cta cta--ghost cta--sm" @click="store.open" :disabled="store.isVisible">Show FAB</button>
        <button class="cta cta--ghost cta--sm" @click="store.close">Hide FAB</button>
        <label class="pulso-toggle" :class="{ 'pulso-toggle--on': fabPulso }">
          <input type="checkbox" v-model="fabPulso" />
          <span class="pulso-toggle__dot"></span>
          <span class="pulso-toggle__label">Pulso</span>
        </label>
      </div>
      <p class="palette__note">
        <code>pulso</code> &nbsp;adds a subtle audio-wave ripple around the FAB.
        Try it once the FAB is visible.
      </p>
    </section>

    <!-- ═══════════════════════════════════════════════════════════════
         FOOTER
         ═══════════════════════════════════════════════════════════════ -->
    <footer class="footer">
      <div class="footer__inner">
        <div class="footer__brand">pulse-player</div>
        <div class="footer__meta">Floating + inline music for Vue 3</div>
        <a class="footer__link" href="https://github.com/YamadaBlog/pulse-player" target="_blank" rel="noopener">github →</a>
      </div>
    </footer>

    </template>

    <!-- Persistent FAB — global, survives navigation (hidden in showcase mode) -->
    <MiniPlayer
      v-if="!showcase"
      :variant="activeFabVariant"
      :accent-color="fabPalette.find(p => p.id === activeFabVariant)?.accent"
      :pulso="fabPulso"
    />
  </div>
</template>

<style>
:root {
  --pulse-accent: #3DBDA7;
  --pulse-bg: #14141a;
  /* page palette */
  --pg-bg:        #05050a;
  --pg-surface:   rgba(255, 255, 255, 0.04);
  --pg-border:    rgba(255, 255, 255, 0.07);
  --pg-text:      #ffffff;
  --pg-text-mid:  rgba(255, 255, 255, 0.65);
  --pg-text-low:  rgba(255, 255, 255, 0.45);
  --pg-accent:    #3DBDA7;
}

* { box-sizing: border-box; }
html, body, #app {
  margin: 0;
  background: var(--pg-bg);
  color: var(--pg-text);
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
body { min-height: 100vh; }

a { color: inherit; }
code {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.88em;
  font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace;
}

.app { width: 100%; }

/* ─── SHOWCASE — README hero capture ─────────────────────────
   Activate with ?showcase=1. Designed to be screenshotted at
   1280×500 and used as the README hero image. The blurred cover
   fills every pixel so the captured PNG has no black borders. */
.showcase {
  position: relative;
  isolation: isolate;
  width: 100vw;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: clamp(24px, 6vw, 80px) clamp(20px, 5vw, 64px);
}
.showcase__backdrop {
  position: absolute;
  inset: -40px;
  background-image: var(--hero-cover);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(60px) saturate(1.4) brightness(0.85);
  transform: scale(1.15);
  z-index: -1;
}
.showcase__backdrop::after {
  /* Subtle vignette so the player reads cleanly on any cover */
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(0, 0, 0, 0.35) 100%);
}
.showcase__player {
  width: min(720px, 100%);
  filter: drop-shadow(0 24px 50px rgba(0, 0, 0, 0.45));
}

/* ─── HERO ─────────────────────────────────────────────────── */
.hero {
  position: relative;
  isolation: isolate;
  padding: clamp(80px, 12vw, 160px) 24px clamp(80px, 12vw, 140px);
  overflow: hidden;
  text-align: center;
}
.hero__backdrop {
  position: absolute;
  inset: -60px;
  background-image: var(--hero-cover);
  background-size: cover;
  background-position: center;
  filter: blur(80px) saturate(1.35);
  opacity: 0.55;
  z-index: -2;
  transform: scale(1.1);
  transition: background-image 0.6s ease, opacity 0.6s ease;
}
.hero__glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 0, 0, 0) 0%, var(--pg-bg) 90%),
    radial-gradient(ellipse 60% 40% at 50% 100%, rgba(0, 0, 0, 0.6) 0%, transparent 70%);
  z-index: -1;
  pointer-events: none;
}
.hero__inner {
  max-width: 880px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(20px, 3vw, 32px);
}
.hero__badge {
  padding: 7px 14px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--pg-text);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.hero__title {
  font-size: clamp(36px, 6vw, 64px);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.05;
  margin: 0;
  background: linear-gradient(180deg, #ffffff 0%, #c7c7d4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  max-width: 760px;
}
.hero__lede {
  font-size: clamp(15px, 1.6vw, 19px);
  line-height: 1.6;
  color: var(--pg-text-mid);
  max-width: 620px;
  margin: 0;
}
.hero__player {
  width: 100%;
  max-width: 680px;
  margin-top: 8px;
  filter: drop-shadow(0 30px 60px rgba(0, 0, 0, 0.45));
}
.hero__cta { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 4px; }

.cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 22px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  font-family: inherit;
}
.cta--primary {
  background: linear-gradient(135deg, #1DB954 0%, #15a047 100%);
  color: #ffffff;
  box-shadow: 0 8px 24px rgba(29, 185, 84, 0.30), inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}
.cta--primary:hover { transform: translateY(-1px); box-shadow: 0 12px 28px rgba(29, 185, 84, 0.40), inset 0 0 0 1px rgba(255, 255, 255, 0.20); }
.cta--primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.cta--primary .cta__icon { display: inline-flex; align-items: center; justify-content: center; }
.cta--ghost {
  background: rgba(255, 255, 255, 0.06);
  color: var(--pg-text);
  border-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
}
.cta--ghost:hover { background: rgba(255, 255, 255, 0.12); }
.cta--ghost:disabled { opacity: 0.4; cursor: not-allowed; }
.cta--text {
  background: transparent;
  color: var(--pg-text-mid);
  border-color: transparent;
  padding: 12px 14px;
}
.cta--text:hover { color: var(--pg-text); }
.cta--sm { padding: 9px 16px; font-size: 13px; }
.cta__arrow { transition: transform 0.15s ease; }
.cta:hover .cta__arrow { transform: translateX(3px); }

/* ─── DEMO BANNER ─────────────────────────────────────────── */
.demo-banner {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 1000;
  background: rgba(8, 10, 14, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}
.demo-banner__inner {
  display: flex;
  align-items: center;
  gap: 16px;
  max-width: 1180px;
  margin: 0 auto;
  padding: 14px 22px;
}
.demo-banner__pulse {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #1DB954;
  box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.6);
  animation: demo-banner-pulse 1.8s ease-out infinite;
  flex-shrink: 0;
}
@keyframes demo-banner-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0.45); }
  70%  { box-shadow: 0 0 0 10px rgba(29, 185, 84, 0); }
  100% { box-shadow: 0 0 0 0 rgba(29, 185, 84, 0); }
}
.demo-banner__meta { flex: 1; min-width: 0; line-height: 1.3; }
.demo-banner__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.10em;
  color: var(--pg-text-mid);
  text-transform: uppercase;
}
.demo-banner__chip strong {
  color: var(--pg-text);
  letter-spacing: 0.02em;
  text-transform: none;
  font-weight: 700;
  margin-left: 2px;
}
.demo-banner__step { color: var(--pg-text-low); font-weight: 500; }
.demo-banner__caption {
  margin-top: 3px;
  color: var(--pg-text);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.demo-banner__stop {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #ffffff;
  background: rgba(255, 90, 90, 0.18);
  border: 1px solid rgba(255, 90, 90, 0.35);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  flex-shrink: 0;
}
.demo-banner__stop:hover { background: rgba(255, 90, 90, 0.28); border-color: rgba(255, 90, 90, 0.50); transform: translateY(-1px); }
.demo-banner__progress {
  position: relative;
  height: 2px;
  background: rgba(255, 255, 255, 0.05);
}
.demo-banner__progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1DB954, #4ECDC4);
  box-shadow: 0 0 12px rgba(29, 185, 84, 0.45);
  transition: width 0.30s ease;
}
/* Slide-in / slide-out */
.demo-banner-enter-active,
.demo-banner-leave-active {
  transition: transform 0.40s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.30s ease;
}
.demo-banner-enter-from,
.demo-banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
@media (max-width: 640px) {
  .demo-banner__caption { white-space: normal; }
  .demo-banner__step { display: none; }
  .demo-banner__inner { padding: 12px 16px; gap: 10px; }
}

/* ─── SECTIONS ─────────────────────────────────────────────── */
.section {
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(60px, 8vw, 100px) 24px;
}
.section--narrow { max-width: 760px; }

.section__eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--pg-accent);
  margin: 0 0 12px;
}
.section__h {
  font-size: clamp(28px, 3.4vw, 44px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;
  margin: 0 0 14px;
}
.section__sub {
  font-size: clamp(15px, 1.4vw, 17px);
  line-height: 1.65;
  color: var(--pg-text-mid);
  max-width: 640px;
  margin: 0 0 36px;
}

/* ─── RESIZE STAGE ─────────────────────────────────────────── */
.resize-stage {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 28px;
  background: var(--pg-surface);
  border: 1px solid var(--pg-border);
  border-radius: 24px;
}
.resize-stage__player {
  margin: 0 auto;
  width: 100%;
  transition: max-width 0.2s ease;
}

.resize-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.presets { display: flex; gap: 6px; padding: 4px; background: rgba(0, 0, 0, 0.35); border-radius: 999px; align-self: center; }
.presets__btn {
  width: 44px; height: 32px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--pg-text-mid);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
  font-family: inherit;
}
.presets__btn:hover { color: var(--pg-text); }
.presets__btn--active {
  color: #0a0a0f;
  background: #ffffff;
}

.slider {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 14px;
  align-items: center;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
}
.slider__label, .slider__value {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--pg-text-low);
  font-variant-numeric: tabular-nums;
}
.slider__value { color: var(--pg-text); text-transform: none; }

.slider input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.10);
  border-radius: 4px;
  outline: none;
}
.slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px; height: 18px;
  background: var(--pg-accent);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 0 4px rgba(61, 189, 167, 0.18);
  transition: transform 0.1s ease;
}
.slider input[type="range"]::-webkit-slider-thumb:hover { transform: scale(1.1); }
.slider input[type="range"]::-moz-range-thumb {
  width: 18px; height: 18px;
  background: var(--pg-accent);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 0 4px rgba(61, 189, 167, 0.18);
}

/* ─── FEATURES ─────────────────────────────────────────────── */
/* ─── DRAG STAGE ──────────────────────────────────────────── */
.drag-stage {
  position: relative;
  padding: 28px;
  background: var(--pg-surface);
  border: 1px solid var(--pg-border);
  border-radius: 24px;
}
.drag-stage > .mp {
  margin: 0 auto;
}
.drag-stage__hint {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--pg-text-mid);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  margin-bottom: 22px;
}
.drag-stage__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--pg-accent);
  box-shadow: 0 0 0 4px rgba(61, 189, 167, 0.18);
  animation: hint-pulse 2.2s ease-in-out infinite;
}
@keyframes hint-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(61, 189, 167, 0.18); }
  50% { box-shadow: 0 0 0 8px rgba(61, 189, 167, 0.06); }
}
.drag-stage__icon {
  display: inline-flex;
  align-items: center;
  color: var(--pg-accent);
}

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

/* ─── GRID (variants) ──────────────────────────────────────── */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 28px;
}
.grid__cell { display: flex; flex-direction: column; gap: 10px; }
.grid__label { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.grid__label-name { font-size: 13px; font-weight: 700; letter-spacing: -0.005em; }
.grid__label-code {
  font-size: 11px;
  color: var(--pg-text-low);
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 8px;
  border-radius: 4px;
}
.grid__caption { color: var(--pg-text-low); font-size: 12.5px; line-height: 1.5; margin: 6px 0 0; }

/* ─── RESPONSIVE PROOF ─────────────────────────────────────── */
.responsive { display: flex; flex-direction: column; gap: 26px; align-items: flex-start; max-width: 100%; overflow-x: auto; padding-bottom: 4px; }
.responsive__cell { max-width: 100%; }
.responsive__rule {
  font-size: 11px;
  color: var(--pg-text-low);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 10px;
}
.responsive__frame {
  max-width: 100%;
  filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.35));
}

/* ─── FAB PALETTE ──────────────────────────────────────────── */
.palette { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.palette__chip {
  padding: 9px 16px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--pg-text-mid);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}
.palette__chip:hover { color: var(--pg-text); background: rgba(255, 255, 255, 0.10); }
.palette__chip--active {
  color: var(--pg-accent);
  background: rgba(61, 189, 167, 0.12);
  border-color: rgba(61, 189, 167, 0.40);
}
.palette__hint { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.palette__note {
  margin: 12px 0 0;
  font-size: 12.5px;
  color: var(--pg-text-low);
}
.palette__note code {
  background: rgba(61, 189, 167, 0.12);
  color: var(--pg-accent);
  padding: 2px 6px;
  border-radius: 4px;
}

/* ─── Pulso toggle ──────────────────────────────────────────── */
.pulso-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--pg-text-mid);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.pulso-toggle:hover { color: var(--pg-text); background: rgba(255, 255, 255, 0.08); }
.pulso-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.pulso-toggle__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.pulso-toggle--on {
  color: var(--pg-accent);
  background: rgba(61, 189, 167, 0.12);
  border-color: rgba(61, 189, 167, 0.40);
}
.pulso-toggle--on .pulso-toggle__dot {
  background: var(--pg-accent);
  box-shadow: 0 0 0 3px rgba(61, 189, 167, 0.25);
  animation: pulso-toggle-pulse 1.6s ease-in-out infinite;
}
@keyframes pulso-toggle-pulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(61, 189, 167, 0.25); }
  50% { box-shadow: 0 0 0 6px rgba(61, 189, 167, 0.10); }
}

/* ─── Ambient EQ toggle (Spotify green accent) ──────────────── */
.ambient-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  padding: 9px 16px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--pg-text-mid);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.ambient-toggle:hover { color: var(--pg-text); background: rgba(255, 255, 255, 0.08); }
.ambient-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.ambient-toggle__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}
.ambient-toggle--on {
  color: #1DB954;
  background: rgba(29, 185, 84, 0.10);
  border-color: rgba(29, 185, 84, 0.40);
}
.ambient-toggle--on .ambient-toggle__dot {
  background: #1DB954;
  box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.22);
}

/* ─── FOOTER ───────────────────────────────────────────────── */
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
.footer__brand { font-weight: 700; letter-spacing: -0.01em; }
.footer__meta { color: var(--pg-text-low); flex: 1; }
.footer__link { color: var(--pg-accent); text-decoration: none; font-weight: 600; }
.footer__link:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .grid { grid-template-columns: 1fr; }
}
</style>
