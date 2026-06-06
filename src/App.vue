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

// Programmatic levers used by the demo to drive the drag-stage player and
// the floating FAB. `null` = release control.
const tourDragWidth = ref<number | null>(null)
const tourFabPos = ref<{ x: number; y: number } | null>(null)

const demoSteps: DemoStep[] = [
  // ─── 1. Welcome — calm intro, breathing room ─────────────────
  {
    title: 'Welcome',
    run: async (ctx) => {
      ctx.setMessage('A premium drop-in music player for Vue 3. Sit back.')
      await ctx.scrollTo('.hero', { speed: 'slow' })
      await ctx.delay(3200)
    },
  },

  // ─── 2. Press play — start audio, let FFT come alive ─────────
  {
    title: 'Press play',
    run: async (ctx) => {
      ctx.setMessage('Real audio · real FFT. The bars react to the track itself.')
      if (!store.isPlaying) store.toggle()
      await ctx.delay(3800)
    },
  },

  // ─── 3. SHORT preview on "Resize it. Everything follows."
  //        Just tap a smaller preset to prove the scale is reactive.
  {
    title: 'Container-aware',
    run: async (ctx) => {
      await ctx.scrollTo('.resize-stage')
      await ctx.delay(900)
      ctx.setMessage('Tap a smaller size — every dimension follows the same variable.')
      await ctx.tween((v) => { userScale.value = v }, userScale.value, 0.75, 1200, 'outQuart')
      await ctx.delay(2200)
      await ctx.tween((v) => { userScale.value = v }, userScale.value, 1.0, 900, 'outQuart')
      await ctx.delay(700)
    },
  },

  // ─── 4. MAIN resize show on "Grab the corner. Resize it yourself."
  //        Activate ambient EQ + animate the drag-stage player in STAGES,
  //        pausing at each morph threshold so the user can clearly see
  //        text, art and chrome retake their places before moving on.
  //        Thresholds in MusicPlayer: FAB < 110, COMPACT < 130, NARROW < 220.
  {
    title: 'Drag-to-resize',
    run: async (ctx) => {
      await ctx.scrollTo('.drag-stage', { speed: 'slow' })
      await ctx.delay(1100)
      ctx.setMessage('Ambient EQ on — let the wave settle in under the music.')
      store.ambientEq = true
      await ctx.delay(2400)

      const set = (v: number) => { tourDragWidth.value = Math.round(v) }

      // Stage 0 — Start at FAB form (< 110). Hold long enough for the disc
      // to fully render with cover, progress ring and EQ overlay.
      ctx.setMessage('Watch each piece find its place — we’ll start in FAB form.')
      tourDragWidth.value = 95
      await ctx.delay(2800)

      // Stage 1 — Cross the FAB threshold into compact (~145). Slow tween,
      // then a real pause so the compact layout (artwork + title + buttons)
      // can fully settle — the user sees the morph back into a rectangle.
      ctx.setMessage('Past the FAB threshold — the disc morphs back into an inline player.')
      await ctx.tween(set, 95, 150, 2400, 'inOutQuart')
      await ctx.delay(2200)

      // Stage 2 — Cross the narrow threshold (~245). NOW PLAYING + the
      // GitHub / Spotify icons fade back in. Pause to let them breathe.
      ctx.setMessage('NOW PLAYING and the social icons fade back in.')
      await ctx.tween(set, 150, 250, 2600, 'inOutQuart')
      await ctx.delay(2200)

      // Stage 3 — Mid-size (~420). Generous padding, larger artwork. Pause.
      ctx.setMessage('Mid-size — every dimension scales together from a single variable.')
      await ctx.tween(set, 250, 420, 2600, 'inOutQuart')
      await ctx.delay(1700)

      // Stage 4 — Full hero width (~680). Long tween, then linger.
      ctx.setMessage('All the way up to hero width — same component, never breaks.')
      await ctx.tween(set, 420, 680, 2800, 'inOutQuart')
      await ctx.delay(2600)

      // Stage 5 — Slow shrink back to a comfortable mid-size. Slower curve
      // so the viewer can watch the title, art and controls retake their
      // seats one by one as the thresholds are crossed in reverse.
      ctx.setMessage('And gracefully back down — text, art and controls retake their seats.')
      await ctx.tween(set, 680, 330, 5200, 'inOutQuart')
      await ctx.delay(1800)

      // Release programmatic control so the user can grab the handle.
      tourDragWidth.value = null
    },
  },

  // ─── 5. "Pick a mood." — gentle scroll into the theme grid
  {
    title: 'Pick a mood',
    run: async (ctx) => {
      await ctx.scrollTo('.variants', { speed: 'slow' })
      await ctx.delay(1400)
      ctx.setMessage('Nine themes ship in — each one tuned, not just tinted.')
      await ctx.delay(2800)
      ctx.setMessage('Mix them with your own accent colour. Brand fit, every time.')
      await ctx.delay(2600)
    },
  },

  // ─── 6. Boost to the bottom — fast scroll to the FAB section
  {
    title: 'Floating FAB',
    run: async (ctx) => {
      ctx.setMessage('Now meet the persistent floating FAB.')
      // The "boost" scroll the user asked for — quick, decelerating.
      await ctx.scrollTo('.palette', { speed: 'fast' })
      await ctx.delay(1400)
      if (!store.isVisible) store.open()
      await ctx.delay(900)
    },
  },

  // ─── 7. Drag the FAB to the centre of the viewport
  {
    title: 'Drag anywhere',
    run: async (ctx) => {
      ctx.setMessage('Drag it anywhere — it remembers where you left it.')
      const fabSize = 56
      const anchorRight = 16
      const anchorBottom = 32
      const targetX = -(window.innerWidth / 2 - anchorRight - fabSize / 2)
      const targetY = -(window.innerHeight / 2 - anchorBottom - fabSize / 2)
      tourFabPos.value = { x: 0, y: 0 }
      await ctx.tween((t) => {
        tourFabPos.value = { x: targetX * t, y: targetY * t }
      }, 0, 1, 2400, 'outQuart')
      await ctx.delay(1600)
    },
  },

  // ─── 8. Vinyl + Aurora — show two distinct moods on the FAB
  {
    title: 'Vinyl & Aurora',
    run: async (ctx) => {
      ctx.setMessage('A warm Vinyl mood — gold border, analog feel.')
      activeFabVariant.value = 'vinyl'
      await ctx.delay(3200)
      ctx.setMessage('And a cool Aurora — teal night, cyan accent.')
      activeFabVariant.value = 'aurora'
      await ctx.delay(3200)
    },
  },

  // ─── 9. Pulso — heartbeat ripple
  {
    title: 'Pulso',
    run: async (ctx) => {
      ctx.setMessage('Pulso — a heartbeat ripple that only animates while the music plays.')
      fabPulso.value = true
      await ctx.delay(5200)
      fabPulso.value = false
      await ctx.delay(400)
    },
  },

  // ─── 10. Outro — calm return, glide the FAB home, retire control
  {
    title: 'You’re in',
    run: async (ctx) => {
      ctx.setMessage('That’s pulse-player. Drop it in. Make it yours.')
      // Glide the FAB back to its corner before the curtain.
      const start = tourFabPos.value ?? { x: 0, y: 0 }
      await ctx.tween((t) => {
        tourFabPos.value = { x: start.x * (1 - t), y: start.y * (1 - t) }
      }, 0, 1, 1400, 'outQuart')
      tourFabPos.value = null
      await ctx.scrollTo('.hero', { speed: 'slow' })
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
  fabVariant: MusicPlayerVariant
  fabVisible: boolean
} | null = null

// Fullscreen handling — best-effort. If the browser refuses (mobile
// Safari, embedded frames, etc.) the demo still runs without it.
const isFullscreen = ref(false)
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}
async function enterFullscreen() {
  if (typeof document === 'undefined') return
  if (document.fullscreenElement) return
  const el = document.documentElement
  try { await el.requestFullscreen?.() } catch { /* refused — continue */ }
}
async function exitFullscreen() {
  if (typeof document === 'undefined') return
  if (!document.fullscreenElement) return
  try { await document.exitFullscreen?.() } catch { /* ignore */ }
}

async function startDemo() {
  if (tour.isRunning.value) return
  preDemoState = {
    heroVariant: heroVariant.value,
    heroAccent: heroAccent.value,
    ambientEq: store.ambientEq,
    userScale: userScale.value,
    fabPulso: fabPulso.value,
    fabVariant: activeFabVariant.value,
    fabVisible: store.isVisible,
  }
  await enterFullscreen()
  tour.start(demoSteps, { onStop: restoreFromDemo })
}

function stopDemo() {
  tour.stop()
}

function restoreFromDemo() {
  // Always leave fullscreen — both on Stop and on natural end.
  void exitFullscreen()

  if (!preDemoState) return
  const earlyStop = tour.progress.value < 0.85
  // Hero
  heroVariant.value = preDemoState.heroVariant
  heroAccent.value = preDemoState.heroAccent
  // Inline-resize slider
  userScale.value = preDemoState.userScale
  // Drag-stage MusicPlayer — release programmatic width so user can drag.
  tourDragWidth.value = null
  // FAB — release programmatic position, snap pulso, restore variant.
  tourFabPos.value = null
  fabPulso.value = preDemoState.fabPulso
  activeFabVariant.value = preDemoState.fabVariant
  // Ambient EQ — keep it ON if the demo finished (it's the highlight),
  // restore the pre-demo value on early stop.
  if (earlyStop && !preDemoState.ambientEq) {
    store.ambientEq = false
  }
  // FAB visibility — keep visible if demo completed, restore if early stop.
  if (earlyStop && !preDemoState.fabVisible) {
    store.close()
  }
  preDemoState = null
}

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
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
         DEMO OVERLAY — Netflix-style subtitle + Apple-style floating
         control pill. Discreet, premium, dismissible. Lives ONLY while
         the guided tour runs.
         ═══════════════════════════════════════════════════════════════ -->
    <Transition name="demo-overlay">
      <div v-if="tour.isRunning.value" class="demo-overlay" role="region" aria-label="Pulse demo controls">
        <!-- Transient caption (changes per step). No background — like
             a subtitle. Re-keyed so each new message fades in/out. -->
        <Transition name="demo-caption" mode="out-in">
          <p
            v-if="tour.message.value"
            :key="tour.message.value"
            class="demo-overlay__caption"
            aria-live="polite"
          >{{ tour.message.value }}</p>
        </Transition>

        <!-- Control pill. Dot progress + counter + prev / next / stop. -->
        <div class="demo-pill" role="toolbar" aria-label="Demo controls">
          <button
            class="demo-pill__nav"
            @click="tour.prev"
            :disabled="tour.currentStep.value === 0"
            aria-label="Previous step"
          >
            <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
              <path d="M9 2 L4 7 L9 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>

          <div class="demo-pill__dots">
            <button
              v-for="n in tour.totalSteps.value"
              :key="n"
              class="demo-pill__dot"
              :class="{ 'demo-pill__dot--active': (n - 1) === tour.currentStep.value }"
              @click="tour.goToStep(n - 1)"
              :aria-label="`Go to step ${n}`"
              :aria-current="(n - 1) === tour.currentStep.value ? 'step' : undefined"
            ></button>
          </div>

          <button
            class="demo-pill__nav"
            @click="tour.next"
            aria-label="Next step"
          >
            <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
              <path d="M5 2 L10 7 L5 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>

          <div class="demo-pill__divider" aria-hidden="true"></div>

          <span class="demo-pill__count" aria-live="polite">
            {{ tour.currentStep.value + 1 }} / {{ tour.totalSteps.value }}
          </span>

          <button class="demo-pill__stop" @click="stopDemo" aria-label="Stop demo">
            <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
              <rect x="2.5" y="2.5" width="7" height="7" rx="1" fill="currentColor"/>
            </svg>
            <span class="demo-pill__stop-label">Stop</span>
          </button>
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
          :width="tourDragWidth"
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
      :position="tourFabPos"
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

/* ─── DEMO OVERLAY (subtitle + floating pill) ────────────── */
.demo-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none;        /* page stays clickable; only pill is hit */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 0 24px 36px;
  gap: 22px;
}

/* Subtitle — no background, just typography. Reads like Netflix
   captions: centred, bold, legible over any cover. */
.demo-overlay__caption {
  margin: 0;
  max-width: 720px;
  text-align: center;
  font-size: clamp(15px, 1.6vw, 19px);
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: -0.005em;
  color: rgba(255, 255, 255, 0.96);
  text-shadow:
    0 1px 3px rgba(0, 0, 0, 0.7),
    0 4px 18px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
.demo-caption-enter-active,
.demo-caption-leave-active {
  transition: opacity 0.32s ease, transform 0.32s ease;
}
.demo-caption-enter-from { opacity: 0; transform: translateY(4px); }
.demo-caption-leave-to   { opacity: 0; transform: translateY(-4px); }

/* Control pill — small, tightly packed, glass background, premium feel. */
.demo-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px 5px 5px;
  background: rgba(10, 12, 18, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  backdrop-filter: blur(22px) saturate(140%);
  -webkit-backdrop-filter: blur(22px) saturate(140%);
  box-shadow: 0 14px 38px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.04) inset;
  pointer-events: auto;
  font-family: inherit;
  color: rgba(255, 255, 255, 0.85);
}

/* Nav arrows — circular ghost buttons. */
.demo-pill__nav {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 0;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.62);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
.demo-pill__nav:hover { background: rgba(255, 255, 255, 0.10); color: #fff; }
.demo-pill__nav:active { transform: scale(0.92); }
.demo-pill__nav:disabled { opacity: 0.30; cursor: not-allowed; }
.demo-pill__nav:disabled:hover { background: transparent; color: rgba(255, 255, 255, 0.62); }

/* Dot progress — current dot stretches into an accent pill. */
.demo-pill__dots {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
}
.demo-pill__dot {
  width: 6px;
  height: 6px;
  padding: 0;
  background: rgba(255, 255, 255, 0.22);
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition: width 0.28s cubic-bezier(0.22, 0.61, 0.36, 1),
              background 0.20s ease,
              transform 0.15s ease;
}
.demo-pill__dot:hover { background: rgba(255, 255, 255, 0.45); transform: scale(1.15); }
.demo-pill__dot--active {
  width: 22px;
  background: #1DB954;
  box-shadow: 0 0 12px rgba(29, 185, 84, 0.5);
}
.demo-pill__dot--active:hover { background: #1DB954; transform: none; }

.demo-pill__divider {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.10);
  margin: 0 4px;
}

.demo-pill__count {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.55);
  padding: 0 6px;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.demo-pill__stop {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px 6px 10px;
  font-family: inherit;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 78, 78, 0.18);
  border: 1px solid rgba(255, 78, 78, 0.30);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}
.demo-pill__stop:hover {
  background: rgba(255, 78, 78, 0.28);
  border-color: rgba(255, 78, 78, 0.50);
  transform: translateY(-1px);
}

/* Overlay enter / leave. */
.demo-overlay-enter-active,
.demo-overlay-leave-active {
  transition: opacity 0.30s ease;
}
.demo-overlay-enter-from,
.demo-overlay-leave-to { opacity: 0; }
.demo-overlay-enter-active .demo-pill,
.demo-overlay-leave-active .demo-pill {
  transition: transform 0.40s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.30s ease;
}
.demo-overlay-enter-from .demo-pill,
.demo-overlay-leave-to   .demo-pill {
  transform: translateY(24px);
  opacity: 0;
}

@media (max-width: 640px) {
  .demo-overlay { padding-bottom: 22px; gap: 14px; }
  .demo-overlay__caption { font-size: 14px; max-width: 90vw; }
  .demo-pill__divider { display: none; }
  .demo-pill__count { display: none; }
  .demo-pill__stop-label { display: none; }
  .demo-pill__stop { padding: 6px 10px; }
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
