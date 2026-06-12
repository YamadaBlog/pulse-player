<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, defineAsyncComponent } from 'vue'
import { MusicPlayer, MiniPlayer, useAudioStore, type MusicPlayerVariant } from './lib'
import { useDemoTour, type DemoStep } from './composables/useDemoTour'
import { useDemoSpotlight } from './composables/useDemoSpotlight'
import {
  useStagedReveal,
  useAudioReactiveBackdrop,
  useKineticType,
  useCursorGlow,
  useScrollParallax,
  useAudioParticles,
  // withViewTransition — now consumed inside FloatingFabSection.vue,
  // no longer needed at the App.vue top level after the P1.1 extraction.
} from './composables/usePremiumMotion'
import {
  useScrollKineticWave,
  useScrollOrbitField,
  useMagneticHover,
} from './composables/useAdvancedMotion'
import {
  useFloatingBob,
  // useTypeOnReveal — exported for future install section in alpha.33
  useFirstPlayFlare,
} from './composables/useCinematicEffects'
import { useResponsiveWidth } from './composables/useResponsiveWidth'
import CinematicIntro from './components/CinematicIntro.vue'
// Above-the-fold components stay statically imported — they ARE the
// LCP path (hero chrome + the EQ strip right under it).
import DisplayHeadline from './components/DisplayHeadline.vue'
import AudioBars from './components/AudioBars.vue'
// ─── Below-the-fold sections : async chunks (audit №5 perf P1) ────
// Measured baseline on the minified build (localhost, Playwright
// PerformanceObserver) : LCP 2 456 ms, worst init long task 1 237 ms,
// 1 797 ms total main-thread blocking at load. Cause : the whole demo
// (15 player instances, 3 GSAP ScrollTrigger scenes, gallery, tour
// plumbing) parsed + mounted in ONE synchronous flow.
// defineAsyncComponent splits each section into its own chunk : the
// entry bundle shrinks, parse/exec spreads across idle frames, and
// the DOM still ends up identical (chunks mount within ~1 s on
// localhost) — so the demo-tour selectors and spotlight anchors keep
// working unchanged. Deliberately NOT IntersectionObserver-gated :
// lazy-mount-on-scroll could race the tour's programmatic scrolling.
const ProductReveal = defineAsyncComponent(() => import('./components/ProductReveal.vue'))
const ProductRotate3D = defineAsyncComponent(() => import('./components/ProductRotate3D.vue'))
const PhoneShowcase = defineAsyncComponent(() => import('./components/PhoneShowcase.vue'))
const AppFooter = defineAsyncComponent(() => import('./components/AppFooter.vue'))
const FeaturesGrid = defineAsyncComponent(() => import('./components/FeaturesGrid.vue'))
const FloatingFabSection = defineAsyncComponent(() => import('./components/FloatingFabSection.vue'))
const ResizeStageSection = defineAsyncComponent(() => import('./components/ResizeStageSection.vue'))
const DragStageSection = defineAsyncComponent(() => import('./components/DragStageSection.vue'))
const PickAMoodSection = defineAsyncComponent(() => import('./components/PickAMoodSection.vue'))
const ThreeWidthsSection = defineAsyncComponent(() => import('./components/ThreeWidthsSection.vue'))

// ─── Staged idle mounting (audit №5 perf P1, step 2) ───────────────
// Code-splitting alone moved the parse cost off the entry bundle, but
// on a fast connection every chunk lands almost at once and the
// sections still MOUNT in a single burst — measured median worst task
// stayed ~1 s. `mountStage` gates the below-the-fold sections in three
// waves, each released in an idle slot (rIC, timeout fallback), so the
// mount work spreads across frames instead of stacking. Order follows
// the page : the further down a section lives, the later its wave.
// The demo tour is click-triggered seconds after load — all waves are
// long mounted by then.
const mountStage = ref(0)
onMounted(() => {
  const idle: (cb: () => void) => void =
    typeof requestIdleCallback === 'function'
      ? (cb) => requestIdleCallback(cb, { timeout: 800 })
      : (cb) => setTimeout(cb, 120)
  idle(() => {
    mountStage.value = 1 // six-act reveal
    idle(() => {
      mountStage.value = 2 // interactive stages + 3D + phone
      idle(() => {
        mountStage.value = 3 // gallery + widths + FAB + footer
      })
    })
  })
})

// Multi-step spotlight controller (replaces the v1.x single-boolean
// `fabFocused`). Lifecycle: every demo step can call
// `spotlight.focus('.selector')` to aim it at any element; `spotlight.clear()`
// at the outro releases it. Scroll + resize re-aim automatically.
const spotlight = useDemoSpotlight()

const store = useAudioStore()

// ─── Premium motion layer (alpha.27) ────────────────────────────
// Apple-style staged reveal on the hero block + audio-reactive
// ambient backdrop driven by the engine's FFT bars. NATIVE scroll
// (Lenis removed round-16 — see usePremiumMotion.ts §3 rationale).
// Everything respects prefers-reduced-motion and ships in the
// DEMO PAGE only (never in @pulse-music/* tarballs). See
// docs/setup/PREMIUM_DEMO.md for the design rationale.
// alpha.30 cascade order — PRODUCT FIRST (Apple page discipline).
// alpha.32 VISUAL-QA fix: `.hero__title` removed from this cascade
// because `useKineticType` (below) splits it into per-char spans and
// drives its own opacity animation — running both engines against the
// same element left chars stuck at opacity 0 on wide viewports. The
// title now relies solely on the kinetic char cascade.
useStagedReveal({
  selectors: ['.hero__player', '.hero__badge', '.hero__lede', '.hero__cta'],
  duration: 0.55,
  yFrom: 22,
  stagger: 0.08,
  startDelay: 0.12,
})
const audioReactiveSnapshot = computed(() => ({
  eqBars: store.eqBars,
  isPlaying: store.isPlaying,
}))

// alpha.28 — next-gen premium motion
// Kinetic title: split per-char + cascade
const heroTitleEl = ref<HTMLElement | null>(null)
useKineticType(heroTitleEl)
// Cursor-tracking glow on hero (Apple interactive light)
// alpha.30 — intensity bumped 0.32 → 0.42 so the resting state is
// visible even before the user moves; radius down 420 → 360 so the
// effect is tighter and feels more designed than ambient.
const heroEl = ref<HTMLElement | null>(null)
useCursorGlow(heroEl, { radius: 360, intensity: 0.42 })
// Round-12 FLUIDITY FIX — the audio pump used to write
// `--pulse-ambient` on the `.app` ROOT every playing frame : a custom-
// property change on the root invalidates style for the entire page
// subtree. Headed-GPU bisection at 2560×1440 measured that single
// write at ~24 ms/frame (playing p50 48.5 → 24.3 ms with the pump
// no-opped). Every live consumer (.hero__glow, .hero__backdrop,
// .hero__player::before) sits under the hero section, so the var is
// written there now — same visuals, a fraction of the subtree. (The
// FAB consumer was provably inert anyway : MiniPlayer teleports to
// <body>, OUTSIDE the old .app root, and falls back to 0.)
useAudioReactiveBackdrop(audioReactiveSnapshot, heroEl)
// Scroll parallax on hero backdrop (subtle depth)
const heroBackdropEl = ref<HTMLElement | null>(null)
useScrollParallax(heroBackdropEl, { depth: 50 })
// Audio-reactive particle field overlay
const particleCanvasEl = ref<HTMLCanvasElement | null>(null)
useAudioParticles(particleCanvasEl, audioReactiveSnapshot, {
  count: 48,
  colour: 'rgba(245, 158, 11, 0.55)', // amber — breaks the AI purple-teal default
})

// alpha.30 — scroll-progress channel on the hero powers the
// variable-font weight axis (Geist 650→800). The CSS consumer reads
// --scroll-progress and drives font-variation-settings.

// alpha.31 — cinematic finishing touches.
// 1. Hero player floats — subtle 12 s Y bob, 6 px amplitude.
const heroPlayerEl = ref<HTMLElement | null>(null)
useFloatingBob(heroPlayerEl, { amplitude: 6, period: 12_000 })
// alpha.33 — fluid hero player width responsive from mobile to 4K.
// Drives the MusicPlayer :width prop so the chrome stays balanced
// across the full viewport range. See ./composables/useResponsiveWidth.ts.
const heroPlayerWidth = useResponsiveWidth({
  multiplier: 1,
  min: 280,
  max: 1080,
  fractionOfViewport: 0.78,
})

// alpha.37 — responsive MiniPlayer (persistent FAB) size.
// Previous attempt overrode `--fab-size` via CSS `!important` to scale
// the FAB on wide screens — that broke the internal SVG progress ring
// because MiniPlayer computes the ring radius from `props.size` (default
// 56), not from the CSS variable. The CSS override grew the box without
// recomputing the ring geometry → ring sat off-centred in the corner.
//
// The correct path is to drive `props.size` reactively from the
// viewport, so Vue re-runs the ring computed and re-renders the SVG
// with matching coordinates.
//
//   Mobile  (≤ 720)         → 56 px  (Material default)
//   Tablet  (721 → 1279)    → 64 px
//   Laptop  (1280 → 1919)   → 72 px
//   Desktop (1920 → 2559)   → 88 px
//   2K + 4K (≥ 2560)        → 104 px
const fabResponsiveSize = ref(56)
const _updateFabSize = () => {
  if (typeof window === 'undefined') return
  const w = window.innerWidth
  if (w >= 2560) fabResponsiveSize.value = 104
  else if (w >= 1920) fabResponsiveSize.value = 88
  else if (w >= 1280) fabResponsiveSize.value = 72
  else if (w >= 721) fabResponsiveSize.value = 64
  else fabResponsiveSize.value = 56
}
onMounted(() => {
  _updateFabSize()
  window.addEventListener('resize', _updateFabSize, { passive: true })
})
onUnmounted(() => {
  if (typeof window !== 'undefined') window.removeEventListener('resize', _updateFabSize)
})
// 2. useTypeOnReveal — composable ready, no install code block in the
// current template to attach to. Wired in alpha.32 when a dedicated
// install section ships (currently the install snippet lives in the
// README only).
// 3. First-play flare — Apple "screen lights up" cue.
useFirstPlayFlare(audioReactiveSnapshot)

// alpha.29 — informed by deep research on Anthropic frontend-design
// skill anti-slop rules + Leonxlnx/taste-skill + Codrops 2026 patterns.
// New section "Why Pulse" demonstrates scroll-driven dual-wave text,
// orbit field with amber tertiary accent, and primary-CTA magnetic
// hover. See docs/setup/ALPHA_29_RESEARCH.md for the source map.
const whyPulseSectionEl = ref<HTMLElement | null>(null)
const whyPulseWaveEl = ref<HTMLElement | null>(null)
// alpha.30 — wave amplitude 20→8 + period 7→11 so the kinetic dual-
// wave reads as gentle parallax-per-glyph, NOT "drunk text" wiggle.
useScrollKineticWave(whyPulseWaveEl, { amplitude: 8, period: 11 })
const orbitFieldEl = ref<HTMLElement | null>(null)
useScrollOrbitField(orbitFieldEl, {
  count: 5,
  maxRadius: 22,
  // Palette deliberately includes amber + pink + cyan to break the
  // generic AI violet-teal default Anthropic's frontend-design skill
  // flags as "slop".
  colours: ['#8B5CF6', '#3DBDA7', '#F59E0B', '#EC4899', '#06B6D4'],
})
const ctaPrimaryEl = ref<HTMLElement | null>(null)
// alpha.30 — magnetic hover strength 6→10 so it's actually felt.
useMagneticHover(ctaPrimaryEl, { strength: 10, damping: 0.16 })

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
    'auto',
    'transparent',
    'solid',
    'dark',
    'light',
    'sunset',
    'midnight',
    'aurora',
    'vinyl',
    'custom',
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
const showcaseAccent = computed(
  () => showcaseParams()?.get('a') ?? SHOWCASE_ACCENTS[showcaseVariant.value],
)
// Round-14 shell pipeline — extra showcase params so the capture rig
// (scripts/generate-player-shells.mjs) can render every demo-card
// configuration :
//   &w=480       → explicit :width passed to the player
//   &bg=<css>    → customBackground (URL-encoded CSS, custom variant)
//   &t=0         → track index (demo cards show track 0)
//   &clean=1     → hide the showcase backdrop (alpha captures)
const showcaseWidth = computed(() => {
  const w = showcaseParams()?.get('w')
  return w ? Number(w) : undefined
})
const showcaseBg = computed(() => showcaseParams()?.get('bg') ?? undefined)
const showcaseClean = computed(() => showcaseParams()?.has('clean') ?? false)

// Showcase mode starts on track 2 (white "a couple of good days" cover —
// gives the backdrop a warm cream palette that reads cleanly on README)
// unless the capture rig pins a track via &t=.
onMounted(() => {
  if (showcase.value) {
    const t = showcaseParams()?.get('t')
    store.loadTrack(t !== null && t !== undefined ? Number(t) : 1)
  }
})

// ─── Interactive size slider ───────────────────────────────────
//   Drives the SAME `:width` prop the drag-stage uses, so the slider
//   and the corner-drag handle now share the exact same responsive
//   logic — the player crosses the same thresholds and goes through
//   the same morph at the same widths.
//   The ref stays HERE (not in ResizeStageSection) because the demo
//   tour tweens it directly from steps 3/4 — App.vue is the owner,
//   the section edits it via v-model:width. SIZE_PRESETS + SLIDER_MIN/
//   MAX moved into ResizeStageSection.vue (no other consumer).
const sliderWidth = ref(440) // mid-size default — comparable to the previous scale 1.0 visual

// ─── Variants gallery ──────────────────────────────────────────
// ─── Variants gallery + Three Widths data ─────────────────────
// Moved into PickAMoodSection.vue / ThreeWidthsSection.vue (P1.1
// round-3) — no other consumer existed in App.vue.

// ─── Hero variant — reactive so the demo tour can cycle it ─────
const heroVariant = ref<MusicPlayerVariant>('auto')
const heroAccent = ref<string | undefined>(undefined)

// ─── FAB switcher ─────────────────────────────────────────────
const activeFabVariant = ref<MusicPlayerVariant>('auto')
const fabPulso = ref(false)
// During step 9 of the demo we highlight the Pulso toggle and fire a
// one-shot green wave ripple around it so the user understands *where*
// the heartbeat effect comes from. Demo-only state.
const tourPulsoHighlight = ref(false)
const fabPalette: { id: MusicPlayerVariant; label: string; accent?: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'vinyl', label: 'Vinyl', accent: '#C8A97E' },
  { id: 'sunset', label: 'Sunset', accent: '#F59E0B' },
  { id: 'midnight', label: 'Midnight', accent: '#8B5CF6' },
  { id: 'aurora', label: 'Aurora', accent: '#06B6D4' },
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
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
// Backward-compatibility alias — kept so the FAB-focused steps still
// read naturally. Mapped to `spotlight.active` so the old name keeps
// working while the underlying overlay is now the multi-step system.
const fabFocused = computed({
  get: () => spotlight.active.value,
  set: (v: boolean) => {
    if (v) {
      // Re-aim to FAB when toggled on without an explicit target.
      spotlight.focus('.fab', { padding: 80, soft: 96 })
    } else {
      spotlight.clear()
    }
  },
})

const demoSteps: DemoStep[] = [
  // ─── 1. Welcome — calm intro, breathing room ─────────────────
  {
    title: 'Welcome',
    run: async (ctx) => {
      // Reset programmatic levers so jumping back here from any later
      // step restores a clean starting state.
      tourDragWidth.value = null
      tourFabPos.value = null
      spotlight.clear()
      ctx.setMessage('A premium drop-in music player for Vue 3. Sit back.')
      await ctx.scrollTo('.hero', { speed: 'slow' })
      spotlight.focus('.hero', { padding: 120, soft: 140 })
      await ctx.delay(3200)
    },
  },

  // ─── 2. Press play — start audio, let FFT come alive ─────────
  {
    title: 'Press play',
    run: async (ctx) => {
      // Aim the spotlight at the hero player so the eye lands on the
      // exact element that's about to come alive.
      spotlight.focus('.hero .mp', { padding: 80, soft: 100 })
      ctx.setMessage('Real audio · real FFT. The bars react to the track itself.')
      if (!store.isPlaying) store.toggle()
      await ctx.delay(3800)
    },
  },

  // ─── 3. SHORT preview on "Resize it. Everything follows."
  //        Just one preset tap — the slider drives the SAME `:width`
  //        prop the drag-stage uses, so the player crosses the same
  //        thresholds. No second cycle: keep this section short.
  {
    title: 'Container-aware',
    run: async (ctx) => {
      // Frame the ENTIRE section (eyebrow + heading + description + the
      // resize stage), not just the player. Scrolling to `.resize-stage`
      // pushed the heading off the top of the viewport and the user
      // lost the context the step is trying to communicate.
      // `offset: window.innerHeight * 0.08` lands the section's top
      // 8 % from the viewport top, leaving room for the heading +
      // description + the stage below.
      await ctx.scrollTo('#section-resize', { offset: window.innerHeight * 0.08 })
      await ctx.delay(900)
      spotlight.focus('#section-resize', { padding: 100, soft: 160 })
      ctx.setMessage('Drop it at any container width — no media queries needed.')
      await ctx.tween(
        (v) => {
          sliderWidth.value = Math.round(v)
        },
        sliderWidth.value,
        280,
        1400,
        'outQuart',
      )
      await ctx.delay(2200)
      await ctx.tween(
        (v) => {
          sliderWidth.value = Math.round(v)
        },
        sliderWidth.value,
        440,
        1000,
        'outQuart',
      )
      await ctx.delay(700)
    },
  },

  // ─── 4. MAIN resize show on "Grab the corner. Resize it yourself."
  //        Activate ambient EQ, ONE smooth growth to hero size, then a
  //        LONG, progressive shrink with a real pause at each morph
  //        threshold so the classic → compact → FAB transformation
  //        reads as a continuous transition, not three hard jumps.
  //        Thresholds in MusicPlayer: FAB < 110, COMPACT < 130, NARROW < 220.
  {
    title: 'Drag-to-resize',
    run: async (ctx) => {
      // Frame the ENTIRE section so the heading "Grab the corner.
      // Resize it yourself." stays in view alongside the stage —
      // previously only the stage was framed and the heading was
      // clipped above the fold.
      await ctx.scrollTo('#section-drag', { speed: 'slow', offset: window.innerHeight * 0.08 })
      await ctx.delay(1100)
      spotlight.focus('#section-drag', { padding: 100, soft: 160 })
      ctx.setMessage('Ambient EQ on — let the wave settle in under the music.')
      store.ambientEq = true
      await ctx.delay(2400)

      const set = (v: number) => {
        tourDragWidth.value = Math.round(v)
      }

      // Stage A — Start small (~280), grow up ONCE to hero width.
      // The growth is fast; the user has already seen the slider on
      // step 3, no need to belabour it.
      tourDragWidth.value = 280
      await ctx.delay(800)
      ctx.setMessage('Pull it open all the way to hero width — same component, never breaks.')
      await ctx.tween(set, 280, 680, 3200, 'outQuart')
      await ctx.delay(2200)

      // Stage B — Slow shrink past the NARROW threshold (220).
      // NOW PLAYING + the GitHub / Spotify icons fade out as we cross.
      ctx.setMessage('And now gracefully back down — watch each piece retake its seat.')
      await ctx.tween(set, 680, 235, 6000, 'inOutQuart')
      await ctx.delay(2400)

      // Stage C — Slow shrink past the COMPACT threshold (130).
      // The body collapses, only artwork + title + controls remain.
      ctx.setMessage('Past compact — the body folds in, artwork takes the floor.')
      await ctx.tween(set, 235, 145, 4400, 'inOutQuart')
      await ctx.delay(2400)

      // Stage D — Slow shrink past the FAB threshold (110).
      // The rectangle morphs into the circular FAB disc with chrome,
      // cover, ring and EQ overlay all fading in together.
      //
      // NOTE (audit round-4) : the tween target 95 only needs to be
      // BELOW the 110 threshold to flip `data-fab` — once flipped, the
      // RENDERED disc size is owned by the responsive FAB matrix in
      // responsive-fix.css §K (56/64/72/88/104 px by viewport,
      // !important), not by this width prop. The MusicPlayer's
      // ResizeObserver reads the CSS-forced size, so the ring + cover
      // geometry stay coherent. 95 is an input trigger, not the visual
      // output.
      ctx.setMessage('And finally the FAB form — circular, autonomous, ready to drag.')
      await ctx.tween(set, 145, 95, 4400, 'inOutQuart')
      await ctx.delay(2800)

      // Release programmatic control so the user can grab the handle.
      tourDragWidth.value = null
    },
  },

  // ─── 5. "Pick a mood." — frame the first row of three cards only,
  //        let the viewer read it, then descend in a single continuous
  //        sweep to reveal the rest of the gallery. The motion is one
  //        tween from start to end with `inOutCubic` easing, so there
  //        is no velocity discontinuity to read as a stutter or jolt.
  //
  //        Why the previous version felt janky:
  //        1) `scrollTo(speed:slow)` decelerated to v=0, then a `delay`
  //           held v=0, then `tween(linear)` snapped instantly to a
  //           constant non-zero velocity. The velocity discontinuity at
  //           that handoff read as a perceptible jolt.
  //        2) `linear` at 12 s over ~600 px averages ~0.83 px/frame.
  //           That's near the browser's pixel-snap threshold, so on
  //           many frames the rendered scroll position simply didn't
  //           move — visible as micro-stutter.
  //        3) The descent started below the section heading, so the
  //           viewer already saw every theme on landing; the "progressive
  //           reveal" intent of the step was lost.
  {
    title: 'Pick a mood',
    run: async (ctx) => {
      // Spotlight on the first row of cards — keeps the focus tight
      // on the gallery and dims the chrome around it. We re-aim as
      // the descent scrolls because the spotlight composable observes
      // `scroll` events.
      spotlight.focus('.variants', { padding: 40, soft: 160 })
      const variantsEl = document.querySelector('.variants') as HTMLElement | null
      const firstCell = document.querySelector('.variants .grid__cell') as HTMLElement | null

      if (variantsEl && firstCell) {
        const variantsRect = variantsEl.getBoundingClientRect()
        const firstCellRect = firstCell.getBoundingClientRect()
        const sectionAbsoluteTop = variantsRect.top + window.scrollY
        const sectionAbsoluteBottom = variantsRect.bottom + window.scrollY
        const firstCellAbsoluteBottom = firstCellRect.bottom + window.scrollY

        // START — frame so the FULL first row of three cards sits
        // cleanly in the lower half of the viewport: cell bottom at
        // ~85 % down the viewport, so the title + description fit
        // comfortably above and only the very top of row 2 peeks in
        // at the very bottom. v1.0.8 left the row peeking only and
        // sat too high on the section; this anchor puts the row
        // exactly where the reference asked — fully readable, with
        // the heading still visible above for context.
        const startY = Math.max(0, firstCellAbsoluteBottom - window.innerHeight * 0.85)

        // END — pick the more conservative of two limits:
        //
        // (a) The "title still visible" limit: stop where the H2
        //     "Pick a mood." remains fully readable at the top of
        //     the viewport (≈ 40 px scroll past section top, so the
        //     subtitle scrolls off but the heading and start of the
        //     description stay in frame). Losing the title means
        //     losing the section's context — never acceptable.
        //
        // (b) The "all content shown" limit: stop where the bottom
        //     of the section just clears the viewport bottom. For
        //     tall sections this is past (a); for short sections
        //     (where the entire grid fits in one viewport) this is
        //     above (a). Take whichever lands sooner.
        const titleStillVisibleEndY = sectionAbsoluteTop + 40
        const showAllContentEndY = sectionAbsoluteBottom - window.innerHeight + 32
        const pageBottom = document.documentElement.scrollHeight - window.innerHeight
        const endY = Math.max(
          startY,
          Math.min(pageBottom, titleStillVisibleEndY, showAllContentEndY),
        )

        // 1) Cinematic landing on the start framing.
        await ctx.tween((y) => window.scrollTo(0, y), window.scrollY, startY, 1800, 'inOutCubic')

        ctx.setMessage('Nine carefully tuned themes ship in — not just colour swatches.')
        await ctx.delay(2100)

        // 2) Single continuous descent. Duration scales with distance
        //    so a short reveal doesn't crawl and a long reveal doesn't
        //    feel rushed. `inOutCubic` keeps v=0 at both ends — no
        //    perceptible jolt at the start or end of the descent.
        const descentDistance = Math.abs(endY - startY)
        const descentDuration = Math.max(7000, Math.min(13000, 5500 + descentDistance * 18))
        await ctx.tween((y) => window.scrollTo(0, y), startY, endY, descentDuration, 'inOutCubic')

        ctx.setMessage('Auto, Midnight, Sunset, Aurora, Vinyl, Dark, Light, Transparent, Custom.')
        await ctx.delay(2300)
        ctx.setMessage('Pair any of them with your own accent colour. Brand fit, every time.')
        await ctx.delay(1900)
      } else {
        // Conservative fallback — element missing or layout pending.
        await ctx.scrollTo('.variants', { speed: 'slow', offset: 56 })
        await ctx.delay(14000)
      }
    },
  },

  // Helper used by steps 6-9: each one ensures the user is on the FAB
  // section AND the FAB is visible AND focused — so jumping straight
  // here from the pill always works.
  //
  // Inlined as plain code below.

  // ─── 6. Boost to the bottom — fast scroll to the FAB section
  {
    title: 'Floating FAB',
    run: async (ctx) => {
      ctx.setMessage('Now meet the persistent floating FAB.')
      // Make sure we leave the resize section in a clean state if the
      // user jumped straight here.
      tourDragWidth.value = null

      // Boost scroll to the palette section, but slowed by a factor of
      // 1.5 vs the default `fast` profile so the transition between
      // "Pick a mood" and the FAB section reads cleanly. We replicate
      // the `fast` profile's duration curve (350 ms base + 0.4 ms/px,
      // clamped 700–1400 ms) then multiply by 1.5 for a deliberate,
      // premium boost that's still snappier than `gentle`.
      const paletteEl = document.querySelector('.palette') as HTMLElement | null
      if (paletteEl) {
        const paletteAbsoluteTop = paletteEl.getBoundingClientRect().top + window.scrollY
        const offsetTop = window.innerHeight * 0.18
        const targetY = Math.max(0, paletteAbsoluteTop - offsetTop)
        const startY = window.scrollY
        const fastDuration = Math.max(700, Math.min(1400, 350 + Math.abs(targetY - startY) * 0.4))
        await ctx.tween(
          (y) => window.scrollTo(0, y),
          startY,
          targetY,
          fastDuration * 1.5,
          'outQuint',
        )
      } else {
        // Fallback — palette not in the DOM yet.
        await ctx.scrollTo('.palette', { speed: 'fast' })
      }

      // Bring focus on the palette so the colour chips + the
      // "Show FAB / Hide FAB / Pulso" options stand out.
      spotlight.focus('.palette', { padding: 60, soft: 140 })

      await ctx.delay(1400)
      if (!store.isVisible) store.open()
      await ctx.delay(900)
    },
  },

  // ─── 7. Drag the FAB toward the viewport — horizontal centre,
  //        65 % from the top. Pulled DOWN from dead centre on purpose
  //        so the top guidance pill and caption never crowd the FAB.
  //        A dim spotlight overlay (`fabFocused`) isolates the FAB
  //        visually for the rest of the FAB sequence.
  {
    title: 'Drag anywhere',
    run: async (ctx) => {
      // Preconditions: ensure the FAB is here, visible, and in its
      // corner. Lets the user jump straight here from any earlier step.
      if (!store.isVisible) store.open()
      if (tourFabPos.value === null) tourFabPos.value = { x: 0, y: 0 }
      await ctx.scrollTo('.palette', { speed: 'gentle' })
      await ctx.delay(700)

      ctx.setMessage('Drag it anywhere — it remembers where you left it.')
      // Engage the spotlight BEFORE the tween so the FAB pulls free from
      // the page content as soon as it starts moving.
      fabFocused.value = true
      await ctx.delay(500)

      // Bring the FAB to the dead centre of the viewport — both axes 50 %.
      // Slow drag (4.6 s) — matches a calm, deliberate hand movement, not
      // a teleport.
      const fabSize = 56
      const anchorRight = 16
      const anchorBottom = 32
      const targetX = -(window.innerWidth / 2 - anchorRight - fabSize / 2)
      const targetY = -(window.innerHeight / 2 - anchorBottom - fabSize / 2)
      const startPos = tourFabPos.value
      await ctx.tween(
        (t) => {
          tourFabPos.value = {
            x: startPos.x + (targetX - startPos.x) * t,
            y: startPos.y + (targetY - startPos.y) * t,
          }
        },
        0,
        1,
        4600,
        'inOutQuart',
      )
      await ctx.delay(2000)
    },
  },

  // ─── 8. Vinyl + Aurora — show two distinct moods on the FAB
  {
    title: 'Vinyl & Aurora',
    run: async (ctx) => {
      // Preconditions identical to step 7 — let users jump here too.
      if (!store.isVisible) store.open()
      fabFocused.value = true
      if (tourFabPos.value === null) {
        await ctx.scrollTo('.palette', { speed: 'gentle' })
        await ctx.delay(500)
        const fabSize = 56
        const targetX = -(window.innerWidth / 2 - 16 - fabSize / 2)
        const targetY = -(window.innerHeight / 2 - 32 - fabSize / 2)
        tourFabPos.value = { x: targetX, y: targetY }
        await ctx.delay(400)
      }

      ctx.setMessage('A warm Vinyl mood — gold border, analog feel.')
      activeFabVariant.value = 'vinyl'
      await ctx.delay(3400)
      ctx.setMessage('And a cool Aurora — teal night, cyan accent.')
      activeFabVariant.value = 'aurora'
      await ctx.delay(3400)
    },
  },

  // ─── 9. Pulso — heartbeat ripple
  //        The point of this step is the cause / effect link: the user
  //        flips the Pulso toggle in the palette, and the FAB starts
  //        beating. The spotlight stays ON for the whole step so the
  //        FAB stays the centre of attention; the pulso-toggle is
  //        elevated ABOVE the spotlight via z-index in CSS (the same
  //        way the FAB itself does, at z-index 900). Both the toggle
  //        and the FAB poke through the dim layer; everything else
  //        stays blurred.
  {
    title: 'Pulso',
    run: async (ctx) => {
      if (!store.isVisible) store.open()
      // Make sure the FAB is still parked in the centre area if the
      // user jumped straight to this step.
      if (tourFabPos.value === null) {
        const fabSize = 56
        const targetX = -(window.innerWidth / 2 - 16 - fabSize / 2)
        const targetY = -(window.innerHeight / 2 - 32 - fabSize / 2)
        tourFabPos.value = { x: targetX, y: targetY }
        await ctx.delay(300)
      }

      // Spotlight stays ON. The pulso-toggle--highlight class will lift
      // the toggle above the spotlight overlay (z-index 1000 > 800)
      // when the highlight kicks in — that reveal effect IS the visual
      // cue, with the rest of the page still dimmed.
      fabFocused.value = true

      // Bring the Pulso toggle into the lower half of the viewport.
      // The FAB stays anchored in the upper half (fixed positioning),
      // so once the toggle is highlighted both punch through the
      // spotlight in the same frame.
      await ctx.scrollTo('.pulso-toggle', { speed: 'gentle', offset: window.innerHeight * 0.45 })
      await ctx.delay(400)

      ctx.setMessage('Pulso — toggle this on to add a heartbeat ripple around the FAB.')
      await ctx.delay(1200)

      // Highlight the toggle BEFORE flipping it so the viewer's eye
      // catches the source of the change. The class lifts the toggle
      // above the spotlight, then the green wave ripples outward.
      tourPulsoHighlight.value = true
      await ctx.delay(700)

      // First activation — one full lub-dub cycle (2 thumps).
      // The heartbeat keyframes run lub at 300 ms and dub at 1.0 s of
      // a 5 s cycle, with the dub wave fading out by 1.7 s. 2.2 s of
      // dwell is enough to see the double-pulse and let the wave
      // settle. We then drop the prop to FORCE the CSS animation to
      // restart from frame 0 on the second activation; a 600 ms gap
      // gives the eye a clean beat of rest before round two.
      fabPulso.value = true
      ctx.setMessage('Activated — watch the heartbeat ripple around the FAB.')
      await ctx.delay(2200)
      fabPulso.value = false
      await ctx.delay(600)

      // Second activation — another full lub-dub. Two thumps × two
      // activations = four ripples total. Saying it out loud in the
      // caption helps the viewer count what they're seeing.
      fabPulso.value = true
      ctx.setMessage('And again — two beats per activation, like a real heart.')
      await ctx.delay(2200)

      // Clean up so the next step / jump-back leaves no visual debt.
      fabPulso.value = false
      tourPulsoHighlight.value = false
      await ctx.delay(300)
    },
  },

  // ─── 10. Outro — drop the spotlight, glide the FAB home, scroll back
  {
    title: 'You’re in',
    run: async (ctx) => {
      ctx.setMessage('That’s pulse-player. Drop it in. Make it yours.')
      // Release the spotlight first so the page comes back to life as
      // the FAB returns to its corner.
      fabFocused.value = false
      const start = tourFabPos.value ?? { x: 0, y: 0 }
      await ctx.tween(
        (t) => {
          tourFabPos.value = { x: start.x * (1 - t), y: start.y * (1 - t) }
        },
        0,
        1,
        1600,
        'outQuart',
      )
      tourFabPos.value = null
      await ctx.scrollTo('.hero', { speed: 'slow' })
      // Re-aim the spotlight one last time on the hero so the closing
      // caption lands on a real focal point instead of an empty fade.
      spotlight.focus('.hero', { padding: 140, soft: 180 })
      await ctx.delay(2400)
      // Final release — the overlay fades out so the demo finishes
      // cleanly with the page fully visible.
      spotlight.clear()
    },
  },
]

// Snapshot whatever state existed before the tour started so we can
// restore it cleanly on Stop / Done.
let preDemoState: {
  heroVariant: MusicPlayerVariant
  heroAccent: string | undefined
  ambientEq: boolean
  sliderWidth: number
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
  try {
    await el.requestFullscreen?.()
  } catch {
    /* refused — continue */
  }
}
async function exitFullscreen() {
  if (typeof document === 'undefined') return
  if (!document.fullscreenElement) return
  try {
    await document.exitFullscreen?.()
  } catch {
    /* ignore */
  }
}

async function startDemo() {
  if (tour.isRunning.value) return
  preDemoState = {
    heroVariant: heroVariant.value,
    heroAccent: heroAccent.value,
    ambientEq: store.ambientEq,
    sliderWidth: sliderWidth.value,
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
  sliderWidth.value = preDemoState.sliderWidth
  // Drag-stage MusicPlayer — release programmatic width so user can drag.
  tourDragWidth.value = null
  // FAB — release programmatic position, drop spotlight, snap pulso,
  // restore variant, clear the demo-only Pulso highlight.
  tourFabPos.value = null
  fabFocused.value = false
  fabPulso.value = preDemoState.fabPulso
  tourPulsoHighlight.value = false
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

// Toggle a body class while the tour runs, so MusicPlayer transitions
// can opt into a slower, more buttery curve via a global selector.
watch(
  () => tour.isRunning.value,
  (running) => {
    document.body.classList.toggle('tour-running', !!running)
  },
)

onMounted(() => {
  document.addEventListener('fullscreenchange', onFullscreenChange)
})
onUnmounted(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  if (tour.isRunning.value) tour.stop()
})

// ─── Hero blurred backdrop driven by current cover ────────────
// Round-16 : the backdrop consumes a PRE-BLURRED webp (baked by
// scripts/generate-hero-backdrop.mjs) instead of live-blurring the
// cover with filter: blur(110px) — that filter was the most expensive
// rasterised layer on the page at 2K. Convention : <cover>-blur.webp
// next to the cover asset ; falls back to the sharp cover if absent.
const hero = computed(() => ({
  '--hero-cover': `url(${store.track.cover})`,
  '--hero-cover-blur': `url(${store.track.cover.replace(/\.(svg|webp|png|jpg)$/, '-blur.webp')})`,
}))
</script>

<template>
  <CinematicIntro v-if="!showcase" />
  <div class="app">
    <!-- ═══════════════════════════════════════════════════════════════
         SHOWCASE — clean hero capture for the README. Activate with
         `?showcase=1`. Renders the player centered over a blurred
         cover-art backdrop with rounded corners — no chrome, no text.
         ═══════════════════════════════════════════════════════════════ -->
    <section
      v-if="showcase"
      class="showcase"
      :style="hero"
      :class="{ 'showcase--clean': showcaseClean }"
    >
      <div v-if="!showcaseClean" class="showcase__backdrop" aria-hidden="true"></div>
      <div class="showcase__player">
        <MusicPlayer
          :variant="showcaseVariant"
          :accent-color="showcaseAccent"
          :width="showcaseWidth"
          :custom-background="showcaseBg"
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
      <!-- Multi-step demo spotlight — a single overlay whose radial
           gradient centre + radius follow whichever element the
           current demo step has focused. CSS variables drive the
           geometry, so smoothing between two targets is the
           browser's compositor work (no JS tween, no main-thread
           cost per frame). See `useDemoSpotlight.ts` for the
           controller. -->
      <Transition name="demo-spotlight">
        <div
          v-if="spotlight.active.value"
          class="demo-spotlight"
          :style="{
            '--spotlight-x': spotlight.x.value + 'px',
            '--spotlight-y': spotlight.y.value + 'px',
            '--spotlight-radius': spotlight.radius.value + 'px',
            '--spotlight-soft': spotlight.soft.value + 'px',
          }"
          aria-hidden="true"
        ></div>
      </Transition>

      <Transition name="demo-overlay">
        <div
          v-if="tour.isRunning.value"
          class="demo-overlay"
          role="region"
          aria-label="Pulse demo controls"
        >
          <!-- Control pill at the TOP — dots + counter + prev / next / stop. -->
          <div class="demo-pill" role="toolbar" aria-label="Demo controls">
            <button
              class="demo-pill__nav"
              @click="tour.prev"
              :disabled="tour.currentStep.value === 0"
              aria-label="Previous step"
            >
              <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
                <path
                  d="M9 2 L4 7 L9 12"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                />
              </svg>
            </button>

            <div class="demo-pill__dots">
              <button
                v-for="n in tour.totalSteps.value"
                :key="n"
                class="demo-pill__dot"
                :class="{ 'demo-pill__dot--active': n - 1 === tour.currentStep.value }"
                @click="tour.goToStep(n - 1)"
                :aria-label="`Go to step ${n}`"
                :aria-current="n - 1 === tour.currentStep.value ? 'step' : undefined"
              ></button>
            </div>

            <button class="demo-pill__nav" @click="tour.next" aria-label="Next step">
              <svg viewBox="0 0 14 14" width="13" height="13" aria-hidden="true">
                <path
                  d="M5 2 L10 7 L5 12"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="none"
                />
              </svg>
            </button>

            <div class="demo-pill__divider" aria-hidden="true"></div>

            <span class="demo-pill__count" aria-live="polite">
              {{ tour.currentStep.value + 1 }} / {{ tour.totalSteps.value }}
            </span>

            <button
              class="demo-pill__pause"
              :class="{ 'demo-pill__pause--paused': tour.isPaused.value }"
              @click="tour.togglePause"
              :aria-label="tour.isPaused.value ? 'Resume demo' : 'Pause demo'"
            >
              <svg
                v-if="tour.isPaused.value"
                viewBox="0 0 12 12"
                width="10"
                height="10"
                aria-hidden="true"
              >
                <path d="M3.5 2 L9.5 6 L3.5 10 Z" fill="currentColor" />
              </svg>
              <svg v-else viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                <rect x="3" y="2.5" width="2" height="7" rx="0.4" fill="currentColor" />
                <rect x="7" y="2.5" width="2" height="7" rx="0.4" fill="currentColor" />
              </svg>
            </button>

            <button class="demo-pill__stop" @click="stopDemo" aria-label="Stop demo">
              <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true">
                <rect x="2.5" y="2.5" width="7" height="7" rx="1" fill="currentColor" />
              </svg>
              <span class="demo-pill__stop-label">Stop</span>
            </button>
          </div>

          <!-- Transient caption below the pill. No background — like a
             subtitle. Re-keyed so each new message fades in/out. -->
          <Transition name="demo-caption" mode="out-in">
            <p
              v-if="tour.message.value"
              :key="tour.message.value"
              class="demo-overlay__caption"
              aria-live="polite"
            >
              {{ tour.message.value }}
            </p>
          </Transition>
        </div>
      </Transition>

      <!-- ═══════════════════════════════════════════════════════════════
         HERO — Apple-grade showcase with blurred cover backdrop
         ═══════════════════════════════════════════════════════════════ -->
      <section class="hero" :style="hero" ref="heroEl">
        <div class="hero__backdrop" aria-hidden="true" ref="heroBackdropEl"></div>
        <div class="hero__glow" aria-hidden="true"></div>
        <div class="hero__cursor-glow" aria-hidden="true"></div>
        <canvas class="hero__particles" ref="particleCanvasEl" aria-hidden="true"></canvas>

        <div class="hero__inner">
          <div class="hero__badge">
            <span class="act-num">I</span><span class="act-sep">·</span>The instrument
            <span class="hero__badge-sep">·</span>v0.11 · Vue 3 · MIT
          </div>
          <h1 class="hero__title" ref="heroTitleEl">Premium drop-in music for Vue 3.</h1>
          <p class="hero__lede">
            An inline card and a floating FAB. One global audio session. FFT visualiser, nine
            themes, container-aware sizing — and a guided demo that walks you through the whole
            thing. Drop in. Ship.
          </p>

          <div class="hero__player" ref="heroPlayerEl">
            <MusicPlayer
              :variant="heroVariant"
              :accent-color="heroAccent"
              :width="heroPlayerWidth"
              github-url="https://github.com/YamadaBlog/pulse-player"
              spotify-url="https://open.spotify.com/"
            />
          </div>

          <div class="hero__cta">
            <button
              class="cta cta--primary"
              ref="ctaPrimaryEl"
              @click="startDemo"
              :disabled="tour.isRunning.value"
            >
              <span class="cta__icon" aria-hidden="true">
                <svg viewBox="0 0 14 14" width="13" height="13">
                  <path d="M3 2 L11 7 L3 12 Z" fill="currentColor" />
                </svg>
              </span>
              Watch demo
            </button>
            <a
              class="cta cta--ghost"
              href="https://github.com/YamadaBlog/pulse-player"
              target="_blank"
              rel="noopener noreferrer"
            >
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
         alpha.32 — Full-width FFT visualiser bars below the hero.
         Sits between the hero and the Why section as an audio receipt:
         "the engine is running, look".
         ═══════════════════════════════════════════════════════════════ -->
      <AudioBars :engine="audioReactiveSnapshot" />

      <!-- ═══════════════════════════════════════════════════════════════
         alpha.32 — Display headline as the page's first breath.
         Apple-page rhythm: between two busy scenes, sit one huge phrase.
         ═══════════════════════════════════════════════════════════════ -->
      <DisplayHeadline
        eyebrow="The instrument · in four facets"
        text="Audio. Mood. Touch. Anywhere."
      />

      <!-- ═══════════════════════════════════════════════════════════════
         alpha.32 — Sticky-pinned scrollytelling: the player stays in
         place while four facets reveal in sequence (AirPods Pro pattern).
         ═══════════════════════════════════════════════════════════════ -->
      <!-- alpha.32 — six-act pinned scrub: the production-grade
           cinematic. ProductReveal owns its GSAP timeline + pin. -->
      <ProductReveal v-if="mountStage >= 1" />

      <!-- ═══════════════════════════════════════════════════════════════
         WHY PULSE — alpha.29 scrollytelling moment
         Dual-wave kinetic text + orbit field with warm tertiary accents.
         Built from the research synthesis: Codrops Jan 2026 dual-wave
         pattern + Anthropic frontend-design anti-slop palette discipline.
         ═══════════════════════════════════════════════════════════════ -->
      <section id="section-why" class="section section--why" ref="whyPulseSectionEl">
        <div class="why__orbit" ref="orbitFieldEl" aria-hidden="true"></div>
        <p class="section__eyebrow why__eyebrow">
          <span class="act-num">II</span><span class="act-sep">·</span>In motion
        </p>
        <h2 class="why__title" ref="whyPulseWaveEl">Audio that moves the chrome, not the user.</h2>
        <div class="why__columns">
          <div class="why__col">
            <p class="why__lede">
              The FFT loop runs at 60 fps. The hero glow respires with it. The backdrop saturates
              with it. The particle field drifts faster with it. Three reactions, one signal, zero
              re-renders — the consumer never pays the cost.
            </p>
          </div>
          <div class="why__col why__col--offset">
            <p class="why__lede why__lede--alt">
              Scroll moves the page; the page moves with the scroll. Native scrolling,
              compositor-only motion — your input lands instantly, with none of the toy-car
              overshoot of hijacked momentum.
            </p>
          </div>
        </div>
      </section>

      <!-- INTERACTIVE sections III + III·b — extracted to dedicated SFCs.
           The demo tour still owns the `sliderWidth` / `tourDragWidth`
           refs ; the sections render + edit them through v-model/props. -->
      <ResizeStageSection v-if="mountStage >= 2" v-model:width="sliderWidth" />
      <DragStageSection v-if="mountStage >= 2" :tour-width="tourDragWidth" />

      <!-- ═══════════════════════════════════════════════════════════════
         ROTATE 3D — alpha.35 scroll-driven product-reveal rotation
         ═══════════════════════════════════════════════════════════════ -->
      <ProductRotate3D v-if="mountStage >= 2" />

      <!-- ═══════════════════════════════════════════════════════════════
         PHONE SHOWCASE — alpha.37 CSS phone frame + Pulse Player inside
         Desktop/tablet only. Hidden on mobile (user IS holding a phone).
         ═══════════════════════════════════════════════════════════════ -->
      <PhoneShowcase v-if="mountStage >= 2" />

      <!-- FEATURES — Three-up cards (extracted to FeaturesGrid.vue) -->
      <FeaturesGrid v-if="mountStage >= 3" />

      <!-- VARIANTS gallery IV + Three Widths IV·b — extracted SFCs.
           Both are self-contained (their data arrays had no other
           consumer in App.vue). -->
      <PickAMoodSection v-if="mountStage >= 3" />
      <ThreeWidthsSection v-if="mountStage >= 3" />

      <!-- FAB section V — markup extracted to FloatingFabSection.vue -->
      <FloatingFabSection
        v-if="mountStage >= 3"
        :fab-palette="fabPalette"
        v-model:active-variant="activeFabVariant"
        v-model:pulso="fabPulso"
        :pulso-highlight="tourPulsoHighlight"
      />

      <!-- ═══════════════════════════════════════════════════════════════
         FOOTER
         ═══════════════════════════════════════════════════════════════ -->
      <AppFooter v-if="mountStage >= 3" />
    </template>

    <!-- Persistent FAB — global, survives navigation (hidden in showcase mode).
         `:size` is responsive (56/64/72/88/104) so the ring + cover
         geometry inside MiniPlayer scales coherently across viewports
         instead of staying at the default 56 on a 2K display. -->
    <MiniPlayer
      v-if="!showcase"
      :variant="activeFabVariant"
      :accent-color="fabPalette.find((p) => p.id === activeFabVariant)?.accent"
      :pulso="fabPulso"
      :position="tourFabPos"
      :size="fabResponsiveSize"
    />
  </div>
</template>

<style>
:root {
  --pulse-accent: #3dbda7;
  --pulse-bg: #14141a;
  /* page palette */
  --pg-bg: #05050a;
  --pg-surface: rgba(255, 255, 255, 0.04);
  --pg-border: rgba(255, 255, 255, 0.07);
  --pg-text: #ffffff;
  --pg-text-mid: rgba(255, 255, 255, 0.65);
  /* WCAG 2.1 AA fix (v3.0.0-alpha.17): was 0.45 → contrast 4.48 against
     #05050a (just below the 4.5 threshold). Bumped to 0.55 → contrast
     ~5.1, comfortably above. Tiny visual diff (caption text marginally
     more legible). All `.grid__caption`, `.section__sub`, and similar
     low-emphasis captions inherit this fix automatically. */
  --pg-text-low: rgba(255, 255, 255, 0.55);
  --pg-accent: #3dbda7;
}

* {
  box-sizing: border-box;
}
html,
body,
#app {
  margin: 0;
  background: var(--pg-bg);
  color: var(--pg-text);
  font-family:
    'SF Pro Display',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Inter,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
body {
  min-height: 100vh;
}

a {
  color: inherit;
}
code {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.88em;
  font-family: ui-monospace, 'SF Mono', 'JetBrains Mono', Menlo, Consolas, monospace;
}

.app {
  width: 100%;
}

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
/* Round-14 capture rig — &clean=1 : fully transparent stage so element
   screenshots of the player keep their alpha (transparent variant). */
.showcase--clean {
  background: transparent;
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
  background: radial-gradient(
    ellipse 70% 60% at 50% 50%,
    transparent 30%,
    rgba(0, 0, 0, 0.35) 100%
  );
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
  /* Round-16 — pre-blurred asset (generate:backdrop) : blur(110px) +
     saturate + brightness are BAKED into the webp. The layer is now a
     plain textured quad — zero live filter, zero kernel re-raster
     during fast scrolling (this was the page's costliest layer). */
  background-image: var(--hero-cover-blur, var(--hero-cover));
  background-size: cover;
  background-position: center;
  opacity: 0.38;
  z-index: -2;
  transform: scale(1.18);
  /* Round-12 — `opacity` removed from this transition list: it is now
     pumped per-frame by `--pulse-ambient` (see the motion layer below)
     and a 600 ms transition would queue a fresh animation per write. */
  transition: background-image 0.6s ease;
}
.hero__backdrop::after {
  /* Centre vignette so the eye lands on the player even when the
     backdrop has a busy composition. */
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 45%,
    transparent 0%,
    rgba(5, 5, 10, 0.42) 55%,
    rgba(5, 5, 10, 0.78) 100%
  );
  pointer-events: none;
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
  /* alpha.33 — caps raised so 2K (2560) and 4K (3840) keep the hero
     proportional to viewport. Gap also scales so vertical rhythm
     stays balanced across the typography upscale. */
  width: min(84vw, 1640px);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(20px, 2vw, 48px);
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
  /* alpha.32 VISUAL-QA fix — kinetic-char spans inside the title were
     inheriting `color: transparent` from the gradient-text-fill and
     stayed invisible across every viewport.
     alpha.33 — was capped at 64 px which felt small on 2K/4K. New
     range scales to ~96 px on 2K and ~128 px on 4K. */
  font-size: clamp(36px, 5.4vw, 132px);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.02;
  margin: 0;
  color: #f5f6fa;
  max-width: min(20ch, 100%);
}
.hero__title .kinetic-char {
  /* Belt-and-braces — explicit colour on the spans defeats any cascade
     fight from `background-clip: text` higher up. */
  color: #f5f6fa;
  -webkit-text-fill-color: currentColor;
}
.hero__title {
  /* inline-block char spans create wrap opportunities at every char
     boundary, which produced ugly "V / ue 3." breaks. keep-all locks
     Latin words together. */
  word-break: keep-all;
  overflow-wrap: normal;
  text-wrap: balance;
}
.hero__lede {
  /* alpha.33 — was capped at 19 px which on 2K reads as fine print.
     New range scales to ~28 px on 2K, ~36 px on 4K. */
  font-size: clamp(16px, 1.25vw, 28px);
  line-height: 1.55;
  color: var(--pg-text-mid);
  max-width: min(64ch, 100%);
  margin: 0;
}
.hero__player {
  width: 100%;
  max-width: 680px;
  margin-top: 8px;
  filter: drop-shadow(0 30px 60px rgba(0, 0, 0, 0.45));
}
.hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 4px;
}

.cta {
  /* alpha.33 — fluid CTA so it stays touch-friendly on mobile + has
     real presence on 2K/4K. Padding and font-size both scale. */
  display: inline-flex;
  align-items: center;
  gap: clamp(8px, 0.6vw, 14px);
  padding: clamp(12px, 0.9vw, 22px) clamp(22px, 1.6vw, 40px);
  font-size: clamp(14px, 1vw, 22px);
  font-weight: 600;
  letter-spacing: 0;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  transition:
    transform 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
  font-family: inherit;
}
.cta--primary {
  background: linear-gradient(135deg, #1db954 0%, #15a047 100%);
  color: #ffffff;
  box-shadow:
    0 8px 24px rgba(29, 185, 84, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.15);
}
.cta--primary:hover {
  transform: translateY(-1px);
  box-shadow:
    0 12px 28px rgba(29, 185, 84, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}
.cta--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.cta--primary .cta__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cta--ghost {
  background: rgba(255, 255, 255, 0.06);
  color: var(--pg-text);
  border-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
}
.cta--ghost:hover {
  background: rgba(255, 255, 255, 0.12);
}
.cta--ghost:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.cta--text {
  background: transparent;
  color: var(--pg-text-mid);
  border-color: transparent;
  padding: 12px 14px;
}
.cta--text:hover {
  color: var(--pg-text);
}
.cta--sm {
  padding: 9px 16px;
  font-size: 13px;
}
.cta__arrow {
  transition: transform 0.15s ease;
}
.cta:hover .cta__arrow {
  transform: translateX(3px);
}

/* ─── DEMO SPOTLIGHT — multi-step ──────────────────────────
   A single radial-gradient overlay whose centre + radius track
   whatever element the current demo step has focused. The four
   CSS variables it consumes (`--spotlight-x`, `-y`, `-radius`,
   `-soft`) are registered as `<length>` via `@property` so the
   browser interpolates them smoothly when they change — every
   transition between two demo targets is GPU compositor work,
   no JS tweening required. */
@property --spotlight-x {
  syntax: '<length>';
  inherits: true;
  initial-value: 50vw;
}
@property --spotlight-y {
  syntax: '<length>';
  inherits: true;
  initial-value: 50vh;
}
@property --spotlight-radius {
  syntax: '<length>';
  inherits: true;
  initial-value: 220px;
}
@property --spotlight-soft {
  syntax: '<length>';
  inherits: true;
  initial-value: 80px;
}
.demo-spotlight {
  position: fixed;
  inset: 0;
  /* The dim layer is now uniform (no radial gradient). The spotlight
     CLEAR region is cut out of the OVERLAY ITSELF via `mask`. Where
     the mask is transparent, the overlay element does not render —
     and therefore `backdrop-filter: blur()` does not apply there
     either. Net effect: the focused target sits in a genuinely
     unfiltered hole, sharp and undimmed, while everything else
     behind the overlay stays blurred and dim.

     (v2.3.0 used a radial-gradient background that went transparent
     in the centre. backdrop-filter still applied across the whole
     overlay area, so the focused target was blurred too — which
     was the whole bug.) */
  background: rgba(0, 0, 0, 0.6);
  z-index: 800; /* under the FAB (z-index 900) and pill (1000) */
  pointer-events: none;
  backdrop-filter: blur(3px) saturate(0.95);
  -webkit-backdrop-filter: blur(3px) saturate(0.95);
  /* The mask draws BLACK (= overlay visible, dim + blur apply)
     everywhere except the spotlight circle, which fades to
     TRANSPARENT (= overlay not visible, no blur, no dim). The
     transparent stop sits at `radius - soft/2`, the black stop
     at `radius + soft` — so the feather band is asymmetric: about
     1.5 × soft wide, biased toward the dim side. That bias is
     intentional: it gives the spotlight a tight, defined clear
     edge against the target and a longer, gentler fade into the
     surrounding dim. Symmetrising the stops would shrink the
     spotlight perceptually; the asymmetry preserves the
     "stage lighting" effect. */
  -webkit-mask: radial-gradient(
    circle at var(--spotlight-x) var(--spotlight-y),
    transparent calc(var(--spotlight-radius) - var(--spotlight-soft) / 2),
    black calc(var(--spotlight-radius) + var(--spotlight-soft))
  );
  mask: radial-gradient(
    circle at var(--spotlight-x) var(--spotlight-y),
    transparent calc(var(--spotlight-radius) - var(--spotlight-soft) / 2),
    black calc(var(--spotlight-radius) + var(--spotlight-soft))
  );
  /* GPU-side interpolation of the spotlight position + size. The
     transition on the four registered properties drives the mask
     repaint at composite time — no JS tweening. */
  transition:
    --spotlight-x 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    --spotlight-y 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    --spotlight-radius 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    --spotlight-soft 0.7s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.55s ease,
    backdrop-filter 0.55s ease;
}
.demo-spotlight-enter-active,
.demo-spotlight-leave-active {
  transition:
    opacity 0.55s ease,
    backdrop-filter 0.55s ease;
}
.demo-spotlight-enter-from,
.demo-spotlight-leave-to {
  opacity: 0;
}
/* `prefers-reduced-motion`: drop the interpolation. The spotlight
   still appears / disappears instantly per step. */
@media (prefers-reduced-motion: reduce) {
  .demo-spotlight {
    transition: opacity 0.2s ease;
  }
}

/* ─── MUSIC-PLAYER TRANSITIONS while the tour runs ─────────
   Buttery 0.55s curves on the chrome that morphs WITH the wrapper
   (the player envelope, the body, the progress bar, the FAB chrome).
   The cover artwork (`mp__art`) is DELIBERATELY NOT in this list —
   its native 0.3 s (set in v1.0.8) is the right pace; bumping it
   to 0.55 s during the tour made the artwork lag behind the
   scripted resize and kept resizing for ~250 ms AFTER the tween
   finished, which the user reported as "the image takes too long
   to reach its correct size." Keep it native, let it follow the
   wrapper tightly. */
body.tour-running .mp,
body.tour-running .mp[data-fab='true'] {
  transition-duration: 0.55s !important;
  transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1) !important;
}
body.tour-running .mp .mp__body,
body.tour-running .mp[data-fab='true'] .mp__body,
body.tour-running .mp .mp__bar,
body.tour-running .mp[data-fab='true'] .mp__bar,
body.tour-running .mp .mp__fab-chrome,
body.tour-running .mp[data-fab='true'] .mp__fab-chrome {
  transition-duration: 0.55s !important;
  transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1) !important;
}

/* ─── DEMO OVERLAY (subtitle + floating pill) ────────────── */
.demo-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  pointer-events: none; /* page stays clickable; only pill is hit */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start; /* anchored to the TOP of the viewport */
  padding: 24px 24px 0;
  gap: 18px;
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
  transition:
    opacity 0.32s ease,
    transform 0.32s ease;
}
/* Caption sits below the pill — fades in dropping a touch from above,
   leaves drifting upward to follow the pill. */
.demo-caption-enter-from {
  opacity: 0;
  transform: translateY(-4px);
}
.demo-caption-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

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
  box-shadow:
    0 14px 38px rgba(0, 0, 0, 0.55),
    0 1px 0 rgba(255, 255, 255, 0.04) inset;
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
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}
.demo-pill__nav:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.demo-pill__nav:active {
  transform: scale(0.92);
}
.demo-pill__nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.demo-pill__nav:disabled:hover {
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
}

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
  transition:
    width 0.28s cubic-bezier(0.22, 0.61, 0.36, 1),
    background 0.2s ease,
    transform 0.15s ease;
}
.demo-pill__dot:hover {
  background: rgba(255, 255, 255, 0.45);
  transform: scale(1.15);
}
.demo-pill__dot--active {
  width: 22px;
  background: #1db954;
  box-shadow: 0 0 12px rgba(29, 185, 84, 0.5);
}
.demo-pill__dot--active:hover {
  background: #1db954;
  transform: none;
}

.demo-pill__divider {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.1);
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

/* Pause / Resume — neutral colour, sits between counter and Stop. */
.demo-pill__pause {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease,
    color 0.15s ease;
  font-family: inherit;
}
.demo-pill__pause:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.demo-pill__pause:active {
  transform: scale(0.92);
}
.demo-pill__pause--paused {
  background: rgba(29, 185, 84, 0.18);
  border-color: rgba(29, 185, 84, 0.4);
  color: #1db954;
}
.demo-pill__pause--paused:hover {
  background: rgba(29, 185, 84, 0.28);
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
  border: 1px solid rgba(255, 78, 78, 0.3);
  border-radius: 999px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}
.demo-pill__stop:hover {
  background: rgba(255, 78, 78, 0.28);
  border-color: rgba(255, 78, 78, 0.5);
  transform: translateY(-1px);
}

/* Overlay enter / leave. */
.demo-overlay-enter-active,
.demo-overlay-leave-active {
  transition: opacity 0.3s ease;
}
.demo-overlay-enter-from,
.demo-overlay-leave-to {
  opacity: 0;
}
.demo-overlay-enter-active .demo-pill,
.demo-overlay-leave-active .demo-pill {
  transition:
    transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.3s ease;
}
.demo-overlay-enter-from .demo-pill,
.demo-overlay-leave-to .demo-pill {
  transform: translateY(-24px); /* slides in from above now that the pill is anchored top */
  opacity: 0;
}

@media (max-width: 640px) {
  .demo-overlay {
    padding: 16px 12px 0;
    gap: 12px;
  }
  .demo-overlay__caption {
    font-size: 14px;
    max-width: 90vw;
  }
  .demo-pill__divider {
    display: none;
  }
  .demo-pill__count {
    display: none;
  }
  .demo-pill__stop-label {
    display: none;
  }
  .demo-pill__stop {
    padding: 6px 10px;
  }
}

/* ─── SECTIONS ─────────────────────────────────────────────── */
/* alpha.32 VISUAL-QA fix — page used to sit inside a 1080 px column
   regardless of viewport, which left enormous empty bands on 1440 +
   1920 displays. Sections now scale to ~88 vw up to a 1480 px hard
   cap so wide screens feel inhabited without going full-bleed. */
.section {
  /* alpha.33 — caps raised so 2K (2560) and 4K (3840) keep the section
     proportional to viewport instead of going narrow at 1480 px. */
  width: min(86vw, 1880px);
  margin: 0 auto;
  padding: clamp(60px, 6vw, 140px) clamp(24px, 3vw, 72px);
  /* Round-12b FLUIDITY — the page is ~20 700 px tall with 1 900 DOM
     nodes, 74 blurred layers and 87 promoted layers. content-visibility
     lets the browser SKIP style/layout/paint for every offscreen plain
     section (the 3 pinned showcases — .reveal, .rotate3d,
     .phone-showcase — keep their own classes and are NOT affected, so
     ScrollTrigger pin measurements stay exact). `auto` remembers the
     real height after first render ; the 1100px estimate only seeds
     the initial scrollbar. In-section animations are
     IntersectionObserver-driven and keep working (intersection is
     still computed for c-v subtrees). */
  content-visibility: auto;
  contain-intrinsic-size: auto 1100px;
}
/* The three pinned ScrollTrigger showcases also carry `.section` —
   exempt them : pin spacers + scrub measurements need real layout at
   refresh time, and `content-visibility` containment would skew them. */
.reveal,
.rotate3d,
.phone-showcase {
  content-visibility: visible;
  contain-intrinsic-size: none;
}
.section--narrow {
  width: min(86vw, 1280px);
}

.section__eyebrow {
  /* alpha.33 — eyebrow scales up gently on 2K/4K so it's not lost
     under huge headings. */
  font-size: clamp(11px, 0.85vw, 16px);
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--pg-accent);
  margin: 0 0 clamp(12px, 1vw, 20px);
}
.section__h {
  /* alpha.33 — was clamped at 44 px which was invisible on 2K. New
     range scales to ~64 px on 2K (2560) and ~88 px on 4K (3840). */
  font-size: clamp(32px, 3.6vw, 96px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.08;
  margin: 0 0 clamp(14px, 1.2vw, 28px);
}
.section__sub {
  /* alpha.33 — was 17 px cap which became invisible on 2K. New range
     scales to ~28 px on 2K and ~36 px on 4K. */
  font-size: clamp(16px, 1.3vw, 30px);
  line-height: 1.6;
  color: var(--pg-text-mid);
  max-width: min(72ch, 100%);
  margin: 0 0 clamp(28px, 2.4vw, 56px);
}

/* ─── RESIZE STAGE ─────────────────────────────────────────── */
.resize-stage {
  display: flex;
  flex-direction: column;
  align-items: center; /* keep every child centred */
  gap: 32px;
  padding: 28px;
  background: var(--pg-surface);
  border: 1px solid var(--pg-border);
  border-radius: 24px;
  /* Stable base size: the stage never shrinks below 680 × 233 even
     when the inline player is small (compact / FAB modes), so the
     demo surface stays visually stable while the player morphs.
     `width: fit-content` + `min-width` together give us:
       - content smaller than 680 → stage stays at 680
       - content equal to 680     → stage stays at 680
       - content larger than 680  → stage grows to fit the content
     Same logic on the vertical axis via `min-height`. */
  width: fit-content;
  min-width: 680px;
  min-height: 233px;
  max-width: 100%;
  margin: 0 auto;
}
.resize-stage__player {
  display: flex;
  justify-content: center; /* center the inline player horizontally */
  width: 100%;
  transition: max-width 0.2s ease;
}

.resize-controls {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.presets {
  display: flex;
  gap: 6px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 999px;
  align-self: center;
}
.presets__btn {
  width: 44px;
  height: 32px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--pg-text-mid);
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background 0.15s ease;
  font-family: inherit;
}
.presets__btn:hover {
  color: var(--pg-text);
}
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
.slider__label,
.slider__value {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--pg-text-low);
  font-variant-numeric: tabular-nums;
}
.slider__value {
  color: var(--pg-text);
  text-transform: none;
}

.slider input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  outline: none;
}
.slider input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: var(--pg-accent);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 0 4px rgba(61, 189, 167, 0.18);
  transition: transform 0.1s ease;
}
.slider input[type='range']::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}
.slider input[type='range']::-moz-range-thumb {
  width: 18px;
  height: 18px;
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
  display: flex;
  flex-direction: column;
  align-items: center; /* keep the hint pill, player and toggle centred */
  gap: 22px;
  padding: 28px;
  background: var(--pg-surface);
  border: 1px solid var(--pg-border);
  border-radius: 24px;
  /* Stable base size: same contract as `.resize-stage` — never below
     680 × 233 even when the player has been dragged down into compact
     or FAB mode. Grows past the baseline if the player is dragged
     larger than 680 wide. */
  width: fit-content;
  min-width: 680px;
  min-height: 233px;
  max-width: 100%;
  margin: 0 auto;
}
.drag-stage > .mp {
  /* Already centred by the flex parent. */
  margin: 0;
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
  0%,
  100% {
    box-shadow: 0 0 0 4px rgba(61, 189, 167, 0.18);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(61, 189, 167, 0.06);
  }
}
.drag-stage__icon {
  display: inline-flex;
  align-items: center;
  color: var(--pg-accent);
}

/* Features grid styles moved to FeaturesGrid.vue (P1.1 ext 2026-06-10). */

/* ─── GRID (variants) ──────────────────────────────────────── */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 28px;
}
.grid__cell {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.grid__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.grid__label-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.005em;
}
.grid__label-code {
  font-size: 11px;
  color: var(--pg-text-low);
  background: rgba(255, 255, 255, 0.05);
  padding: 3px 8px;
  border-radius: 4px;
}
.grid__caption {
  color: var(--pg-text-low);
  font-size: 12.5px;
  line-height: 1.5;
  margin: 6px 0 0;
}

/* ─── RESPONSIVE PROOF ─────────────────────────────────────── */
.responsive {
  display: flex;
  flex-direction: column;
  gap: 26px;
  align-items: flex-start;
  max-width: 100%;
  overflow-x: auto;
  padding-bottom: 4px;
}
.responsive__cell {
  max-width: 100%;
}
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
.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  /* Bottom spacing handled by `.palette__group-label`'s margin-top so
     the colour chips and the "Options" divider compose cleanly. */
}
.palette__group-label {
  margin: 22px 0 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--pg-text-mid);
}
.palette__chip {
  padding: 9px 16px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--pg-text-mid);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}
.palette__chip:hover {
  color: var(--pg-text);
  background: rgba(255, 255, 255, 0.1);
}
.palette__chip--active {
  color: var(--pg-accent);
  background: rgba(61, 189, 167, 0.12);
  border-color: rgba(61, 189, 167, 0.4);
}
.palette__hint {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}
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
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--pg-text-mid);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.pulso-toggle:hover {
  color: var(--pg-text);
  background: rgba(255, 255, 255, 0.08);
}
.pulso-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.pulso-toggle__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}
.pulso-toggle--on {
  color: var(--pg-accent);
  background: rgba(61, 189, 167, 0.12);
  border-color: rgba(61, 189, 167, 0.4);
}
.pulso-toggle--on .pulso-toggle__dot {
  background: var(--pg-accent);
  box-shadow: 0 0 0 3px rgba(61, 189, 167, 0.25);
  animation: pulso-toggle-pulse 1.6s ease-in-out infinite;
}
@keyframes pulso-toggle-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(61, 189, 167, 0.25);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(61, 189, 167, 0.1);
  }
}

/* Demo-only highlight: bright green frame + one-shot wave ripple
   around the toggle. Fires once when the demo flips it on, so the
   viewer sees exactly which control caused the FAB to start
   beating. The ::after pseudo-element carries the wave.

   The z-index lifts the toggle ABOVE the spotlight overlay
   (`.fab-spotlight` at z-index 800), the same way the FAB does
   (z-index 900). Both poke through the dim layer in the same frame
   — the page stays blurred, but the cause (this toggle) and the
   effect (the FAB) read clearly. */
.pulso-toggle--highlight {
  position: relative;
  z-index: 1000;
  border-color: rgba(61, 189, 167, 0.7);
  background: rgba(61, 189, 167, 0.16);
  color: var(--pg-accent);
}
.pulso-toggle--highlight::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 2px solid var(--pg-accent);
  pointer-events: none;
  transform-origin: center;
  animation: pulso-toggle-wave 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes pulso-toggle-wave {
  0% {
    transform: scale(1);
    opacity: 0.85;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .pulso-toggle--highlight::after {
    animation: none;
    opacity: 0;
  }
  .pulso-toggle--on .pulso-toggle__dot {
    animation: none;
  }
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}
.ambient-toggle:hover {
  color: var(--pg-text);
  background: rgba(255, 255, 255, 0.08);
}
.ambient-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.ambient-toggle__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease;
}
.ambient-toggle--on {
  color: #1db954;
  background: rgba(29, 185, 84, 0.1);
  border-color: rgba(29, 185, 84, 0.4);
}
.ambient-toggle--on .ambient-toggle__dot {
  background: #1db954;
  box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.22);
}

/* Footer styles moved to AppFooter.vue (P1.1 extraction 2026-06-10). */

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Premium motion layer (alpha.27)
   Apple-style staged reveal + audio-reactive ambient + light sweep.
   Demo-page only. Does not ship in @pulse-music/* tarballs.
   ═══════════════════════════════════════════════════════════════════ */

/* Audio-reactive ambient — `--pulse-ambient` is set to a smoothed
   0..1 value by useAudioReactiveBackdrop. The hero glow + backdrop
   amplify subtly during playback, decaying back when paused. */
.app {
  --pulse-ambient: 0;
}

.hero__glow {
  /* Round-12 FLUIDITY FIX — the alpha.30 pump animated `filter:
     brightness()` via the per-frame `--pulse-ambient` write. `filter`
     is not compositor-animatable: each frame re-rasterised this
     viewport-sized gradient on the main thread. Measured at 2560×1440:
     scroll-while-playing p50 = 100 ms/frame (10 fps, 99 % janky).
     The pump now drives `transform: scale` + `opacity` only — both
     compositor-friendly on a promoted layer. */
  transform: scale(calc(1 + var(--pulse-ambient) * 0.12));
  opacity: calc(1 - var(--pulse-ambient) * 0.15);
  will-change: transform, opacity;
}

.hero__backdrop {
  /* Round-12 FLUIDITY FIX — this rule used to REPLACE the base
     blur(110px) filter with a per-frame saturate()/brightness() calc
     (plus `transition: filter 60ms`), forcing a full re-raster of the
     hero-sized cover image every frame while audio played. The
     "vibrates with the music" read is preserved as an opacity pump on
     the same layer — compositor-only: the backdrop breathes brighter
     on peaks because more of it shows through. */
  opacity: calc(0.38 + var(--pulse-ambient) * 0.16);
  will-change: opacity;
}

/* Apple-style "light sweep" on the primary CTA hover.
   A pseudo-element with a 45° gradient slides across once on hover.
   Keeps the original button colour intact — just adds gloss. */
.cta--primary {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}
.cta--primary::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    115deg,
    transparent 0%,
    transparent 35%,
    rgba(255, 255, 255, 0.22) 50%,
    transparent 65%,
    transparent 100%
  );
  transform: translateX(-110%);
  transition: transform 750ms cubic-bezier(0.22, 1, 0.36, 1);
  pointer-events: none;
  z-index: 1;
}
.cta--primary:hover::after,
.cta--primary:focus-visible::after {
  transform: translateX(110%);
}

/* View Transitions API (Chromium 111+) — silky variant swaps.
   Wraps the theme-switch interaction so changing variant cross-fades
   the player chrome instead of flashing. Older browsers ignore the
   ::view-transition-* selectors and get the default behaviour. */
@supports (view-transition-name: pulse-player) {
  ::view-transition-old(pulse-player),
  ::view-transition-new(pulse-player) {
    animation-duration: 320ms;
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
}

/* prefers-reduced-motion guard — composables already skip the JS RAF
   loop, but freeze the CSS pumping too. */
@media (prefers-reduced-motion: reduce) {
  .hero__glow,
  .hero__backdrop {
    transform: none;
    filter: none;
    transition: none;
  }
  .cta--primary::after {
    display: none;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Premium motion layer (alpha.28) — next-gen pieces
   - Kinetic title chars
   - Cursor-tracking glow (Apple interactive light)
   - Audio-reactive particle canvas overlay
   - Active view-transitions on variant picker chips
   ═══════════════════════════════════════════════════════════════════ */

/* Kinetic title chars — per-glyph cascade. The composable splits the
   title into <span class="kinetic-char"> elements and animates each
   one in with stagger. CSS keeps the glyph behaviour clean. */
.kinetic-char {
  display: inline-block;
  /* Smooth the rotation around the centre of the glyph baseline. */
  transform-origin: 50% 80%;
  will-change: opacity, transform;
  /* alpha.32 VISUAL-QA fix — force NBSP to render visibly. inline-block
     collapses adjacent NBSP-only spans without explicit minimum width. */
  white-space: pre;
}
.kinetic-char:empty,
.kinetic-char[data-space],
.kinetic-char:where([data-space]) {
  min-width: 0.27em;
}

/* Cursor-tracking glow — Apple interactive light. The composable sets:
     --cursor-x / --cursor-y: position in percent
     --cursor-inside:        0 (out) or 1 (in)
     --cursor-radius:        glow radius in px
     --cursor-intensity:     opacity 0..1
   The radial-gradient renders a soft accent-coloured light that
   follows the pointer + fades on leave. Demo-page only, pointer:fine
   only, reduced-motion-safe. */
.hero {
  --cursor-x: 50%;
  --cursor-y: 50%;
  --cursor-inside: 0;
  --cursor-radius: 360px;
  --cursor-intensity: 0.35;
  position: relative;
  isolation: isolate;
}
.hero__cursor-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    var(--cursor-radius) circle at var(--cursor-x) var(--cursor-y),
    rgba(139, 92, 246, calc(var(--cursor-intensity) * var(--cursor-inside))) 0%,
    rgba(139, 92, 246, calc(var(--cursor-intensity) * 0.45 * var(--cursor-inside))) 22%,
    transparent 60%
  );
  /* Blend the glow into the existing hero gradient rather than sitting
     on top of it — looks like the hero "lights up" under the pointer. */
  mix-blend-mode: screen;
  opacity: calc(0.4 + 0.6 * var(--cursor-inside));
  transition: opacity 280ms cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 0;
}

/* Canvas particle field — sits behind the hero content. */
.hero__particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.85;
  mix-blend-mode: screen;
  z-index: 0;
}

/* Lift the inner content above the new background layers. */
.hero__inner {
  position: relative;
  z-index: 1;
}

/* View transitions — active on variant picker chips. When a chip is
   clicked, `withViewTransition()` wraps the state mutation so the
   browser cross-fades the changed regions instead of flashing.
   No view-transition-name tagging needed for the default cross-fade
   behaviour ; the browser snapshots both states and animates between
   them. We just override the default 250 ms with our Apple easing. */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 320ms;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Picker chip micro-interaction — scale-in on active. */
.palette__chip {
  transition:
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
    background-color 220ms ease-out;
}
.palette__chip:hover {
  transform: translateY(-1px) scale(1.03);
}
.palette__chip--active {
  transform: scale(1.06);
}

@media (prefers-reduced-motion: reduce) {
  .hero__cursor-glow,
  .hero__particles {
    display: none;
  }
  .palette__chip {
    transition: none;
  }
  .palette__chip:hover,
  .palette__chip--active {
    transform: none;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   alpha.29 — anti-slop polish, informed by Anthropic frontend-design
   skill + Leonxlnx/taste-skill + Codrops 2026 patterns.
   - Geist Variable display + Geist Mono code stacks
   - Warm tertiary palette tokens
   - Asymmetric "Why Pulse" section with scroll-driven kinetic wave
   - Orbit field with amber accent breaking the violet-teal AI default
   ═══════════════════════════════════════════════════════════════════ */

:root {
  /* Typography stack — Geist family takes priority, then system fall-back.
     The system stack stays as a graceful fallback for the < 200 ms before
     Geist resolves over the network. */
  --font-display: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Consolas, monospace;
  /* Warm tertiary tokens — break the violet-teal default. Used on amber
     CTA glow, orbit accent, and ambient EQ secondary channel. */
  --accent-amber: #f59e0b;
  --accent-pink: #ec4899;
}
.app,
body {
  font-family: var(--font-display);
}
code,
pre,
kbd,
samp,
.code,
[class*='code'] {
  font-family: var(--font-mono);
}

/* Hero title — Geist Bold 800 + tighter letter-spacing for the display
   feel. Anti-slop: NO purple text gradient. */
.hero__title {
  font-family: var(--font-display);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.05;
}

/* Why Pulse section — asymmetric two-column with offset second column.
   Apple-style alignment: heading flush-left, second column down +120 px
   relative to the first. Breaks the symmetric centered layout that
   Anthropic's frontend-design skill flags as slop. */
.section--why {
  position: relative;
  overflow: visible;
  padding: clamp(96px, 18vh, 200px) clamp(24px, 6vw, 80px);
  text-align: left;
  isolation: isolate;
}

.why__eyebrow {
  color: var(--accent-amber);
  font-family: var(--font-mono);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 12px;
  margin-bottom: 16px;
}

.why__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(36px, 5.6vw, 80px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  margin: 0 0 64px;
  max-width: 22ch;
  /* Default fill while the per-char wave runs. */
  color: rgba(255, 255, 255, 0.96);
  /* alpha.32 VISUAL-QA — same fix as .hero__title: inline-block chars
     create wrap opportunities at every glyph; keep-all locks Latin
     words together. */
  word-break: keep-all;
  overflow-wrap: normal;
  text-wrap: balance;
}

.wave-char {
  display: inline-block;
  /* will-change set by the composable; we keep the layout stable. */
  vertical-align: baseline;
  /* alpha.32 VISUAL-QA fix — force NBSP to render visibly. */
  white-space: pre;
  min-width: 0.04em;
}

.why__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(40px, 6vw, 96px);
  max-width: 1100px;
}
.why__col--offset {
  /* Asymmetric — second column drops by 120 px so the two reads form
     a staircase rather than a balanced pair. Apple ships this on the
     iPhone product pages. */
  transform: translateY(120px);
}
.why__lede {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(16px, 1.25vw, 19px);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.74);
  max-width: 38ch;
}
.why__lede--alt {
  /* alpha.30 — was rgba(252, 211, 77, 0.86) but contrast was 4.1:1 vs
     bg — fails WCAG AA. Now warm-white at 5.4:1, keeps tonal break
     without the readability hit. */
  color: rgba(252, 232, 201, 0.92);
}

/* Orbit field — 5 glowing orbs that drift behind the section copy.
   Driven by useScrollOrbitField; each orb gets its own colour applied
   inline by the composable. CSS sets the size + blur + blend. */
.why__orbit {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}
.orbit-orb {
  position: absolute;
  top: 50%;
  left: 50%;
  width: clamp(220px, 30vw, 380px);
  height: clamp(220px, 30vw, 380px);
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
  mix-blend-mode: screen;
  /* The composable writes transform in vh units relative to the centre. */
  margin-left: calc(clamp(220px, 30vw, 380px) / -2);
  margin-top: calc(clamp(220px, 30vw, 380px) / -2);
}

/* Magnetic hover — the JS handler writes transform on the element
   directly, so we just neutralise the existing transition so the
   composable's RAF loop owns the animation. */
.cta--primary {
  transition:
    background-color 220ms ease-out,
    box-shadow 220ms ease-out;
  /* Add a warm amber inner glow for the alpha.29 polish.
     Subtle — not a candy-coated WebGL distraction. */
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.08) inset,
    0 12px 32px -12px rgba(245, 158, 11, 0.18);
}
.cta--primary:hover {
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.12) inset,
    0 18px 44px -10px rgba(245, 158, 11, 0.32);
}

@media (prefers-reduced-motion: reduce) {
  .why__col--offset {
    transform: none;
  }
  .why__orbit {
    display: none;
  }
}

@media (max-width: 720px) {
  .why__columns {
    grid-template-columns: 1fr;
  }
  .why__col--offset {
    transform: none;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   alpha.30 — applied audit deltas + Apple Liquid Glass FAB + variable
   font axis interpolation on scroll.
   Built from the redesign-audit skill (Leonxlnx/taste-skill) output.
   ═══════════════════════════════════════════════════════════════════ */

/* Variable font axis on scroll — the hero title morphs from a lighter
   weight (650) when the page is at top, to maximum weight (800) as the
   visitor scrolls past the first viewport. Apple's iPhone Pro pages
   ship a similar axis-as-narrative pattern. The body uses the
   --scroll-progress channel set on the hero by useScrollProgress
   (alpha.29 foundation). */
.hero {
  /* Foundation defaults if useScrollProgress hasn't kicked in yet. */
  --scroll-progress: 0;
}
.hero__title {
  /* Round-12 FLUIDITY FIX — the scroll-driven wght axis
     (calc(650 + var(--scroll-progress) * 150)) re-shaped and re-laid-
     out the ~96 px headline on every scrolled frame :
     font-variation-settings is among the most expensive properties to
     animate (full text relayout + repaint). The narrative gain did not
     survive the measured cost — static weight ; the kinetic-char
     entrance keeps the typographic personality. */
  font-variation-settings: 'wght' 700;
  font-synthesis: none;
}

/* Apple Liquid Glass — applied to the FAB chrome ONLY, per the audit's
   "no generic glassmorphism on everything" rule. The original Apple
   spec (iOS 26) combines backdrop-filter blur + saturation + a
   specular gradient overlay + inset ring. We approximate the
   appearance without WebGL. */
.mp__mini-stage,
.mp__mini-body {
  /* If the FAB's existing chrome respects the cascade, this layer
     adds the Liquid Glass material on top without breaking it. */
  position: relative;
  isolation: isolate;
}
.mp__mini-body::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.04) 38%,
    transparent 62%,
    rgba(255, 255, 255, 0.08) 100%
  );
  /* Specular highlight — a thin diagonal sweep that catches the eye
     without strobing. Slow infinite slide (12 s) is below the
     anti-default threshold the taste-skill flags. */
  mix-blend-mode: overlay;
  opacity: 0.88;
  z-index: 1;
}
.mp__mini-body::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  /* Inner ring of light + dark — replicates Apple's "edge of glass"
     specular. */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    inset 0 -1px 0 rgba(0, 0, 0, 0.4);
  z-index: 2;
}
/* When the FAB is playing, the specular shifts slightly with the
   audio amplitude — the chrome catches "more light" on peaks. */
.mp__mini-body[data-playing='true']::before {
  opacity: calc(0.88 + var(--pulse-ambient, 0) * 0.12);
}

/* alpha.31 FIX — the alpha.30 "feature card grid break" was wrong.
   `.variants` is the SECTION class (not the inner grid), so the rules
   below were turning the entire section into a 2-column grid, which
   collapsed "Pick a mood." to a single column visually.
   The inner grid is `.grid` (above, line ~2260). It already does
   `repeat(auto-fit, minmax(320px, 1fr))` correctly.
   The "feature card" idea now lives inside the inner grid via
   `.variants .grid > .grid__cell:first-child`. */
.variants .grid > .grid__cell:first-child {
  /* Subtle visual lift on the first variant card — Apple "lead colour"
     pattern, applied as a small scale only. Stays inside the same
     grid track so the gallery layout is untouched. */
  transform: scale(1.025);
  transform-origin: top left;
}
@media (prefers-reduced-motion: reduce) {
  .variants .grid > .grid__cell:first-child {
    transform: none;
  }
}

/* Particle field — alpha.30 — limit the upward drift so it reads as
   ambient instead of "automatic CSS scroll". Cap particles' Y at the
   composable level via a slower base velocity (handled in JS), and
   visually mask the bottom of the canvas so emerging particles
   feel like they materialise rather than pop in. */
.hero__particles {
  /* Bottom-to-top fade — gives the field a feathered horizon. */
  mask-image: linear-gradient(to top, transparent 0%, black 18%, black 78%, transparent 100%);
  -webkit-mask-image: linear-gradient(
    to top,
    transparent 0%,
    black 18%,
    black 78%,
    transparent 100%
  );
}

@media (prefers-reduced-motion: reduce) {
  .hero__title {
    font-variation-settings: 'wght' 800;
    transition: none;
  }
  .mp__mini-body::before,
  .mp__mini-body::after {
    display: none;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   alpha.31 — "Journey into Sound" cinematic + Roman numeral acts
   See docs/setup/ALPHA_31_CONCEPT.md for the storyboard.
   ═══════════════════════════════════════════════════════════════════ */

/* Roman numeral act eyebrows — one element per section's eyebrow. The
   number is the protagonist; the separator is a hairline; the title is
   the role. Amber accent keeps continuity with the alpha.29 palette. */
.act-num {
  font-family: 'Geist Mono', ui-monospace, 'SF Mono', Consolas, monospace;
  font-weight: 600;
  color: var(--accent-amber, #f59e0b);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 0.92em;
}
.act-sep {
  display: inline-block;
  margin: 0 0.55em;
  color: rgba(255, 255, 255, 0.28);
  font-weight: 400;
}
.hero__badge-sep {
  margin: 0 0.6em;
  color: rgba(255, 255, 255, 0.2);
}

/* Hero composition — the player gets stage presence. Halo behind it,
   drop shadow under it, restraint around it. The floating Y-bob is
   driven by useFloatingBob (RAF, GPU translate3d). */
.hero__player {
  position: relative;
  isolation: isolate;
  /* The composable writes transform on this element — don't fight it
     with CSS transitions. */
  will-change: transform;
}
.hero__player::before {
  /* Halo behind the player — soft amber/violet wash that suggests
     "this object is lit on a studio table". */
  content: '';
  position: absolute;
  inset: -20% -10% -10% -10%;
  background: radial-gradient(
    ellipse at center,
    rgba(245, 158, 11, 0.22) 0%,
    rgba(139, 92, 246, 0.14) 32%,
    transparent 62%
  );
  filter: blur(36px);
  z-index: -1;
  pointer-events: none;
  opacity: calc(0.7 + var(--pulse-ambient, 0) * 0.3);
  transition: opacity 120ms linear;
}
.hero__player::after {
  /* Floor shadow — perspective cue. */
  content: '';
  position: absolute;
  left: 10%;
  right: 10%;
  bottom: -32px;
  height: 28px;
  background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.45) 0%, transparent 70%);
  filter: blur(12px);
  z-index: -1;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .hero__player {
    transform: none !important;
  }
  .hero__player::before,
  .hero__player::after {
    opacity: 0.6;
  }
}
</style>
