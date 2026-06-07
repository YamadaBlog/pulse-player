<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

// Showcase mode starts on track 2 (white "a couple of good days" cover —
// gives the backdrop a warm cream palette that reads cleanly on README).
onMounted(() => {
  if (showcase.value) store.loadTrack(1)
})

// ─── Interactive size slider ───────────────────────────────────
//   Drives the SAME `:width` prop the drag-stage uses, so the slider
//   and the corner-drag handle now share the exact same responsive
//   logic — the player crosses the same thresholds and goes through
//   the same morph at the same widths.
const SLIDER_MIN = 160
const SLIDER_MAX = 720
const sliderWidth = ref(440) // mid-size default — comparable to the previous scale 1.0 visual
const SIZE_PRESETS = [
  { label: 'XS', value: 160 },
  { label: 'S', value: 240 },
  { label: 'M', value: 360 },
  { label: 'L', value: 540 },
  { label: 'XL', value: 720 },
] as const

function setPreset(v: number) {
  sliderWidth.value = v
}

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
  { id: 'auto', variant: 'auto', label: 'Auto', caption: 'Live cover art blur — signature look.' },
  {
    id: 'vinyl',
    variant: 'vinyl',
    label: 'Vinyl',
    caption: 'Warm analog · vinyl + leather.',
    accentColor: '#C8A97E',
  },
  {
    id: 'sunset',
    variant: 'sunset',
    label: 'Sunset',
    caption: 'Sepia · brown gradient.',
    accentColor: '#F59E0B',
  },
  {
    id: 'midnight',
    variant: 'midnight',
    label: 'Midnight',
    caption: 'Deep navy · violet.',
    accentColor: '#8B5CF6',
  },
  {
    id: 'aurora',
    variant: 'aurora',
    label: 'Aurora',
    caption: 'Teal · cyan night.',
    accentColor: '#06B6D4',
  },
  { id: 'dark', variant: 'dark', label: 'Dark', caption: 'Pure neutral dark.' },
  {
    id: 'light',
    variant: 'light',
    label: 'Light',
    caption: 'Light-mode inversion.',
    accentColor: '#6750A4',
  },
  {
    id: 'transparent',
    variant: 'transparent',
    label: 'Transparent',
    caption: 'Frameless — over your bg.',
  },
  {
    id: 'custom-brown',
    variant: 'custom',
    label: 'Custom',
    caption: 'Any CSS background.',
    customBackground: 'linear-gradient(135deg, #2c1610 0%, #4a2c1f 45%, #6b4226 100%)',
    accentColor: '#E8A87C',
  },
]

const responsiveWidths = [320, 480, 720] as const

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
// When true, a dim spotlight overlay dims the page so the FAB stands
// alone — used during the FAB-centric steps (7, 8, 9).
const fabFocused = ref(false)

const demoSteps: DemoStep[] = [
  // ─── 1. Welcome — calm intro, breathing room ─────────────────
  {
    title: 'Welcome',
    run: async (ctx) => {
      // Reset programmatic levers so jumping back here from any later
      // step restores a clean starting state.
      tourDragWidth.value = null
      tourFabPos.value = null
      fabFocused.value = false
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
  //        Just one preset tap — the slider drives the SAME `:width`
  //        prop the drag-stage uses, so the player crosses the same
  //        thresholds. No second cycle: keep this section short.
  {
    title: 'Container-aware',
    run: async (ctx) => {
      await ctx.scrollTo('.resize-stage')
      await ctx.delay(900)
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
      await ctx.scrollTo('.drag-stage', { speed: 'slow' })
      await ctx.delay(1100)
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

      // Flip the prop — the FAB starts beating, and the green wave
      // pulse on the toggle visualises the activation. Both elements
      // are above the spotlight; the rest of the page stays blurred.
      fabPulso.value = true
      ctx.setMessage('Activated — watch the heartbeat ripple around the FAB.')
      await ctx.delay(4500)

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
      <!-- FAB spotlight — dims the page when the demo brings the FAB into
         focus, isolating it visually so no text bleeds through behind. -->
      <Transition name="fab-spotlight">
        <div v-if="fabFocused" class="fab-spotlight" aria-hidden="true"></div>
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
      <section class="hero" :style="hero">
        <div class="hero__backdrop" aria-hidden="true"></div>
        <div class="hero__glow" aria-hidden="true"></div>

        <div class="hero__inner">
          <div class="hero__badge">v0.11 · Vue 3 · MIT · ~47 kB gzip</div>
          <h1 class="hero__title">Premium drop-in music for Vue 3.</h1>
          <p class="hero__lede">
            An inline card and a floating FAB. One global audio session. FFT visualiser, nine
            themes, container-aware sizing — and a guided demo that walks you through the whole
            thing. Drop in. Ship.
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
         INTERACTIVE — Resize the component live
         ═══════════════════════════════════════════════════════════════ -->
      <section class="section section--narrow">
        <p class="section__eyebrow">Live · Interactive</p>
        <h2 class="section__h">Resize it. Everything follows.</h2>
        <p class="section__sub">
          One <code>--pulse-scale</code> variable drives the artwork, title, icons, buttons,
          padding, radius, shadows, EQ bars, progress and gaps. Move the slider — there is no
          breakpoint trick.
        </p>

        <div class="resize-stage">
          <div class="resize-stage__player">
            <MusicPlayer
              :width="sliderWidth"
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
                :class="{ 'presets__btn--active': sliderWidth === p.value }"
                @click="setPreset(p.value)"
              >
                {{ p.label }}
              </button>
            </div>
            <label class="slider">
              <span class="slider__label">Width</span>
              <input
                type="range"
                :min="SLIDER_MIN"
                :max="SLIDER_MAX"
                step="1"
                v-model.number="sliderWidth"
                aria-label="Component width in pixels"
              />
              <span class="slider__value">{{ sliderWidth }} px</span>
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
          Pass <code>resizable</code> to the inline player and a diagonal handle appears in the
          bottom-right corner. Mouse, finger or stylus — same code path (pointer events +
          <code>setPointerCapture</code>). Pull it small enough and it collapses to compact mode
          automatically.
        </p>

        <div class="drag-stage">
          <div class="drag-stage__hint">
            <span class="drag-stage__dot"></span>
            Grab the
            <span class="drag-stage__icon" aria-hidden="true">
              <svg viewBox="0 0 14 14" width="14" height="14">
                <path
                  d="M1 13 L13 1 M5 13 L13 5 M9 13 L13 9"
                  stroke="currentColor"
                  stroke-width="1.5"
                  fill="none"
                  stroke-linecap="round"
                />
              </svg>
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
              One CSS variable scales every dimension at once. Artwork, type, chrome and shadows all
              breathe together.
            </p>
          </article>
          <article class="feature">
            <div class="feature__chip">02</div>
            <h3 class="feature__h">Container-aware</h3>
            <p class="feature__p">
              Sizes itself off the container, not the viewport. Sidebar, hero, modal — it always
              looks intentional.
            </p>
          </article>
          <article class="feature">
            <div class="feature__chip">03</div>
            <h3 class="feature__h">Persistent session</h3>
            <p class="feature__p">
              One Pinia store, one audio element. Mount the FAB at the root and playback survives
              every route change.
            </p>
          </article>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════════════════
         VARIANTS — gallery (Library · 9 presets / Pick a mood)
         ═══════════════════════════════════════════════════════════════ -->
      <section class="section variants" id="variants">
        <p class="section__eyebrow">Library · 9 presets</p>
        <h2 class="section__h">Pick a mood.</h2>
        <p class="section__sub">
          Nine curated background presets, including the new <code>vinyl</code> warm analog look.
          <code>accentColor</code> retunes the EQ + progress.
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
          At 320 px the artwork is compact, the title sits tight. At 720 px the same component fills
          its space — bigger artwork, larger type, deeper chrome — not because there is a media
          query, but because every dimension is a function of <code>--pulse-scale</code>.
        </p>

        <div class="responsive">
          <div v-for="w in responsiveWidths" :key="w" class="responsive__cell">
            <div class="responsive__rule">{{ w }} px</div>
            <div class="responsive__frame" :style="{ width: w + 'px' }">
              <MusicPlayer
                variant="midnight"
                accent-color="#8B5CF6"
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
          Mount once at the root. Drag to move, swipe down/right to dismiss, long-press for the
          radial menu. The ring around it tracks progress.
        </p>

        <div class="palette" role="group" aria-label="Mini-player variant">
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
        <p class="palette__group-label">Options</p>
        <div class="palette__hint">
          <button class="cta cta--ghost cta--sm" @click="store.open" :disabled="store.isVisible">
            Show FAB
          </button>
          <button class="cta cta--ghost cta--sm" @click="store.close">Hide FAB</button>
          <label
            class="pulso-toggle"
            :class="{
              'pulso-toggle--on': fabPulso,
              'pulso-toggle--highlight': tourPulsoHighlight,
            }"
          >
            <input type="checkbox" v-model="fabPulso" />
            <span class="pulso-toggle__dot"></span>
            <span class="pulso-toggle__label">Pulso</span>
          </label>
        </div>
        <p class="palette__note">
          <code>pulso</code> &nbsp;adds a subtle audio-wave ripple around the FAB. Try it once the
          FAB is visible.
        </p>
      </section>

      <!-- ═══════════════════════════════════════════════════════════════
         FOOTER
         ═══════════════════════════════════════════════════════════════ -->
      <footer class="footer">
        <div class="footer__inner">
          <div class="footer__brand">pulse-player</div>
          <div class="footer__meta">Floating + inline music for Vue 3</div>
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

    <!-- Persistent FAB — global, survives navigation (hidden in showcase mode) -->
    <MiniPlayer
      v-if="!showcase"
      :variant="activeFabVariant"
      :accent-color="fabPalette.find((p) => p.id === activeFabVariant)?.accent"
      :pulso="fabPulso"
      :position="tourFabPos"
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
  --pg-text-low: rgba(255, 255, 255, 0.45);
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
  background-image: var(--hero-cover);
  background-size: cover;
  background-position: center;
  filter: blur(80px) saturate(1.35);
  opacity: 0.55;
  z-index: -2;
  transform: scale(1.1);
  transition:
    background-image 0.6s ease,
    opacity 0.6s ease;
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
.hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 4px;
}

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

/* ─── FAB SPOTLIGHT ───────────────────────────────────────
   Dims the page so the floating FAB stands clear of any text. */
.fab-spotlight {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.8) 70%);
  z-index: 800; /* under the FAB (z-index 900) and pill (1000) */
  pointer-events: none;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.fab-spotlight-enter-active,
.fab-spotlight-leave-active {
  transition:
    opacity 0.6s ease,
    backdrop-filter 0.6s ease;
}
.fab-spotlight-enter-from,
.fab-spotlight-leave-to {
  opacity: 0;
}

/* ─── MUSIC-PLAYER TRANSITIONS while the tour runs ─────────
   Buttery 0.55s curves replace the default 0.40s so the morph
   between every size feels continuous, not stepped. */
body.tour-running .mp,
body.tour-running .mp[data-fab='true'] {
  transition-duration: 0.55s !important;
  transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1) !important;
}
body.tour-running .mp .mp__body,
body.tour-running .mp[data-fab='true'] .mp__body,
body.tour-running .mp .mp__bar,
body.tour-running .mp[data-fab='true'] .mp__bar,
body.tour-running .mp .mp__art,
body.tour-running .mp[data-fab='true'] .mp__art,
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
.section {
  max-width: 1080px;
  margin: 0 auto;
  padding: clamp(60px, 8vw, 100px) 24px;
}
.section--narrow {
  max-width: 760px;
}

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

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
