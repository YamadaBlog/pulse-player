<script setup lang="ts">
/**
 * ProductReveal — alpha.32 cinematic six-act sticky-pinned scene.
 *
 * Sources informing this implementation:
 *   - Codrops "Maxima Therapy" case study (April 2026) — useGSAP hook +
 *     ScrollTrigger pin/scrub workflow.
 *   - Olivier Larose tutorials — Perspective section transition + Sticky
 *     graphic pattern.
 *   - Apple AirPods Pro page (Awwwards SOTD) — image-sequence-like
 *     scrubbing of a centered product through six moments.
 *   - LottieFiles motion-design skill — "Premium" personality
 *     (350-600 ms, cubic-bezier(0.4, 0, 0.2, 1), 0% overshoot).
 *
 * Each of the six acts is one segment of the scroll. While the user is
 * inside the wrapper, the inner stage is pinned. GSAP ScrollTrigger
 * scrubs a master timeline tied to scroll progress. The Pulse Player
 * is rendered once at centre and reads its state from the parent's
 * useAudioStore (shared engine — no second instance).
 *
 * Reduced-motion: pin disabled, all six act states stacked statically.
 * Mobile (< 720 px): pin disabled, layout collapses; copy still shows.
 */

import { onBeforeUnmount, onMounted, ref } from 'vue'
import { MusicPlayer, type MusicPlayerVariant } from '../lib'

// Round-14 — the mobile swipe carousel (6 more full MusicPlayer
// instances) used to be MOUNTED on every viewport and merely hidden
// with CSS on desktop : 6 engines + blur layers in the tree for
// nothing. It now mounts only when the mobile media query matches
// (reactive, so a window resize across 720 px swaps correctly).
const isMobileViewport = ref(false)
let mq: MediaQueryList | null = null
const onMq = (e: MediaQueryListEvent | MediaQueryList) => {
  isMobileViewport.value = e.matches
}
onMounted(() => {
  mq = window.matchMedia('(max-width: 720px)')
  onMq(mq)
  mq.addEventListener('change', onMq)
})
onBeforeUnmount(() => mq?.removeEventListener('change', onMq))
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useResponsiveWidth } from '../composables/useResponsiveWidth'

// alpha.33 — responsive width for the stage player so it doesn't
// vanish on 2K/4K. multiplier 1.15 = the showcase player is slightly
// larger than the hero so the visitor feels they're "inside" the
// scene.
const revealPlayerWidth = useResponsiveWidth({
  multiplier: 1.05,
  min: 320,
  max: 1180,
  fractionOfViewport: 0.5,
})

gsap.registerPlugin(ScrollTrigger)

const wrapper = ref<HTMLElement | null>(null)
const stage = ref<HTMLElement | null>(null)
const product = ref<HTMLElement | null>(null)
// `supporting` reserved for a future per-act inner tween — kept as a
// ref now so the template binding stays stable.
const supporting = ref<HTMLElement | null>(null)
const flare = ref<HTMLElement | null>(null)
const bars = ref<HTMLElement | null>(null)

// Six acts → six "moods" of the same player. Variant + headline + copy
// are kept in arrays so the GSAP timeline only swaps the index.
const ACTS = [
  {
    eyebrow: 'I · Listen',
    title: 'A song you have not heard yet.',
    sub: 'Press play. The instrument wakes.',
    variant: 'midnight' as MusicPlayerVariant,
  },
  {
    eyebrow: 'II · The instrument',
    title: 'A drop-in audio object.',
    sub: 'One Pinia store. One <audio>. Sixty FFT frames a second.',
    variant: 'midnight' as MusicPlayerVariant,
  },
  {
    eyebrow: 'III · And then it plays',
    title: 'The chrome breathes.',
    sub: 'Glow swells. Saturation pumps. Particles drift faster on peaks.',
    variant: 'aurora' as MusicPlayerVariant,
  },
  {
    eyebrow: 'IV · Nine moods',
    title: 'The same object. Nine personalities.',
    sub: 'Recolour at runtime. Drop in a custom accent. Brand-aware.',
    variant: 'sunset' as MusicPlayerVariant,
  },
  {
    eyebrow: 'V · Touch',
    title: 'Drag the handle. The world resizes.',
    sub: 'Container-aware from 110 px to 720 px. No breakpoint.',
    variant: 'vinyl' as MusicPlayerVariant,
  },
  {
    eyebrow: 'VI · Anywhere',
    title: 'Vue, React, Svelte, Angular, RN, Web Components.',
    sub: 'Same engine. Same chrome. Same FFT. Shipped on npm.',
    variant: 'midnight' as MusicPlayerVariant,
  },
]

const currentAct = ref(0)
const currentTitle = ref(ACTS[0].title)
const currentSub = ref(ACTS[0].sub)
const currentEyebrow = ref(ACTS[0].eyebrow)
const currentVariant = ref<MusicPlayerVariant>(ACTS[0].variant)

let trigger: ScrollTrigger | null = null
let timeline: gsap.core.Timeline | null = null

const swapAct = (i: number) => {
  if (i === currentAct.value) return
  const next = ACTS[i]
  if (!next) return
  currentAct.value = i
  currentEyebrow.value = next.eyebrow
  currentTitle.value = next.title
  currentSub.value = next.sub
  currentVariant.value = next.variant
}

onMounted(() => {
  if (typeof window === 'undefined') return
  const w = wrapper.value
  const s = stage.value
  if (!w || !s) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const narrow = window.innerWidth < 720
  if (reduced || narrow) {
    // Pin disabled — set a static mid-act state.
    swapAct(2)
    return
  }

  // ── Premium motion personality (LottieFiles motion-design skill):
  //    duration 350-600 ms range, cubic-bezier(0.4, 0, 0.2, 1), 0%
  //    overshoot. We mirror it in a single tween config.
  const PREMIUM = {
    duration: 0.55,
    ease: 'power3.out', // ≈ cubic-bezier(0.4, 0, 0.2, 1)
  }

  // Six equal scroll bands → swap act at each onUpdate via thresholds.
  // We use scrub for the timeline so motion is tied 1:1 to scroll —
  // Apple AirPods scrubbing pattern.
  timeline = gsap.timeline({
    scrollTrigger: {
      trigger: w,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1, // tween catches up over 1 s — feels organic
      pin: s,
      pinSpacing: true,
      anticipatePin: 1,
      onUpdate: (st) => {
        // 6 segments → segment index from progress.
        const i = Math.min(5, Math.floor(st.progress * 6))
        swapAct(i)
      },
    },
  })

  // Headline + supporting transitions across the full timeline.
  // We don't tween them per act — Vue's `:key` swap handles it via
  // the v-if block; we tween the WRAPPER opacity on every act change.
  timeline.fromTo(
    product.value,
    { y: 28, scale: 0.96, opacity: 0.55 },
    {
      y: 0,
      scale: 1,
      opacity: 1,
      ease: PREMIUM.ease,
      duration: 1,
    },
    0,
  )

  // Cinematic scale lift across the whole scene — the product
  // rises and slightly leans forward as scenes progress.
  timeline.to(
    product.value,
    {
      scale: 1.04,
      duration: 5,
      ease: 'none',
    },
    1,
  )

  // Light bars sweeping from below at scene IV peak.
  if (bars.value) {
    timeline.fromTo(
      bars.value,
      { yPercent: 60, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1.5,
        ease: PREMIUM.ease,
      },
      2,
    )
  }

  // Flare highlight at act III (sound starts).
  if (flare.value) {
    timeline.fromTo(flare.value, { opacity: 0 }, { opacity: 0.65, duration: 0.8 }, 1.7)
    timeline.to(flare.value, { opacity: 0, duration: 1.2 }, 2.8)
  }

  trigger = timeline.scrollTrigger ?? null
})

onBeforeUnmount(() => {
  trigger?.kill()
  timeline?.kill()
})
</script>

<template>
  <section ref="wrapper" class="reveal" aria-label="Pulse — six-act product presentation">
    <!-- DESKTOP/TABLET stage : sticky-pin scrub (≥ 720 px).
         On mobile it collapses to the horizontal swipe slider below. -->
    <div ref="stage" class="reveal__stage">
      <!-- Decorative layers -->
      <div ref="bars" class="reveal__bars" aria-hidden="true"></div>
      <div ref="flare" class="reveal__flare" aria-hidden="true"></div>

      <!-- Act indicator rail -->
      <div class="reveal__rail" aria-hidden="true">
        <div
          v-for="(act, i) in ACTS"
          :key="i"
          class="reveal__rail-dot"
          :class="{ 'reveal__rail-dot--active': currentAct === i }"
        ></div>
      </div>

      <!-- Centered product object -->
      <div ref="product" class="reveal__product">
        <MusicPlayer :variant="currentVariant" :width="revealPlayerWidth" />
      </div>

      <!-- Copy block (right column) -->
      <div ref="supporting" class="reveal__copy">
        <p class="reveal__eyebrow">{{ currentEyebrow }}</p>
        <h2 class="reveal__title" :key="currentAct">{{ currentTitle }}</h2>
        <p class="reveal__sub" :key="`s-${currentAct}`">{{ currentSub }}</p>
      </div>
    </div>

    <!-- MOBILE swipe carousel (≤ 720 px).
         alpha.37 — user feedback : the pin-on-vertical-scroll feels
         heavy on mobile. Replace with a native horizontal scroll-snap
         carousel : one slide per act, swipe left/right to advance.
         All 6 acts render simultaneously ; no GSAP, no pin, no scroll
         hijack. Hidden on ≥ 721 px (desktop keeps the pin scrub). -->
    <div
      v-if="isMobileViewport"
      class="reveal__mobile-track"
      aria-label="Pulse — swipe through the six acts"
    >
      <article v-for="(act, i) in ACTS" :key="i" class="reveal__mobile-slide">
        <div class="reveal__mobile-copy">
          <p class="reveal__eyebrow">{{ act.eyebrow }}</p>
          <h2 class="reveal__title">{{ act.title }}</h2>
          <p class="reveal__sub">{{ act.sub }}</p>
        </div>
        <div class="reveal__mobile-product">
          <MusicPlayer :variant="act.variant" :width="revealPlayerWidth" />
        </div>
      </article>
    </div>
    <!-- Swipe hint dot row mirrors the desktop rail. -->
    <div class="reveal__mobile-dots" aria-hidden="true">
      <span v-for="(act, i) in ACTS" :key="`d-${i}`" class="reveal__mobile-dot"></span>
    </div>
  </section>
</template>

<style scoped>
.reveal {
  /* Six acts × ~95 vh each → 570 vh total. Apple AirPods Pro page is
     roughly 6 × screen-height of pinned content. */
  height: 570vh;
  position: relative;
  isolation: isolate;
}
.reveal__stage {
  position: sticky;
  top: 0;
  min-height: 100vh;
  display: grid;
  /* alpha.32 VISUAL-QA fix — was 1fr minmax(420, 0.95fr) which gave
     the product cell roughly 50/50 ratio with the copy block ; on a
     1920 viewport the player stayed visually small. New ratio
     1.5fr / 1fr puts the player at ~60 % of the row width, giving
     it stage presence Apple-style. */
  grid-template-columns: minmax(0, 1.5fr) minmax(360px, 1fr);
  align-items: center;
  gap: clamp(40px, 6vw, 120px);
  /* alpha.37 FULL-BLEED fix — was `max-width: 1760px; margin: 0 auto;
     padding-inline: clamp(32px, 6vw, 120px)` which capped the stage at
     1760 px so on a 2K (2560) viewport the background gradients stopped
     before the bezel, exposing the page bg as a hard vertical seam left
     and right. New approach :
       - stage spans 100 % of the viewport (no max-width)
       - inline padding uses `max(clamp(...), calc((100% - 1760px) / 2))`
         which auto-grows on >1760 viewports so the inner CONTENT still
         centres in a 1760 px column — the background fills viewport,
         the grid stays readable.
     Vertical padding stays as before. */
  padding-block: clamp(40px, 8vh, 96px);
  padding-inline: max(clamp(32px, 6vw, 120px), calc((100% - 1760px) / 2));
  overflow: hidden;
  width: 100%;
  background:
    /* alpha.37 halo feathering fix — was `transparent 45%/50%` which
       drew a visible hard ring on wide screens once the gradient ran
       out. Pushed to 100 % so the wash bleeds all the way to the bezel,
       and added a 3rd centred amber pool for vertical balance. */
    radial-gradient(ellipse 80% 60% at 30% 45%, rgba(245, 158, 11, 0.08) 0%, transparent 100%),
    radial-gradient(ellipse 70% 55% at 75% 60%, rgba(139, 92, 246, 0.1) 0%, transparent 100%),
    radial-gradient(ellipse 100% 70% at 50% 50%, rgba(245, 158, 11, 0.04) 0%, transparent 100%);
}

/* ── alpha.37 EDGE FADE — top + bottom of the pinned stage fade into
   the page background instead of stopping in a hard horizontal seam.

   We tried pseudo-elements (::before / ::after) first but they sit
   ABOVE the content layer and would have required `position: relative;
   z-index: N` on every focal element (product/copy/rail) to keep them
   visible. mask-image solves the same problem with one declaration :
   it acts as an alpha channel on the WHOLE rendered stage (background
   gradients + content + halos), so the fade is uniform and the
   content's natural stacking is preserved.

   Compatibility : modern syntax `mask` + `-webkit-mask` covers Safari
   14+, Chrome 120+, Firefox 53+. The pinned sticky behaviour is fully
   compatible — mask travels with the element through scroll.

   The gradient cuts a 6 % alpha-zero region at top and bottom so the
   stage edges literally fade to transparency, revealing the #05050a
   page bg behind. The middle 88 % stays fully opaque so the content is
   never washed out. On wide viewports the fade region grows with vh
   thanks to the unitless percentage stops. */
.reveal__stage {
  --reveal-edge-fade: 6%;
  -webkit-mask-image: linear-gradient(
    180deg,
    transparent 0%,
    black var(--reveal-edge-fade),
    black calc(100% - var(--reveal-edge-fade)),
    transparent 100%
  );
  mask-image: linear-gradient(
    180deg,
    transparent 0%,
    black var(--reveal-edge-fade),
    black calc(100% - var(--reveal-edge-fade)),
    transparent 100%
  );
}

/* Audio-bars decoration — full-width gradient bars rising from below
   at act IV peak, driven by the GSAP timeline. */
.reveal__bars {
  position: absolute;
  inset: auto 0 0 0;
  height: 38vh;
  background: linear-gradient(
    to top,
    rgba(245, 158, 11, 0.32) 0%,
    rgba(236, 72, 153, 0.18) 30%,
    transparent 80%
  );
  mix-blend-mode: screen;
  pointer-events: none;
  /* Round-17 — blur(28px) removed : a linear gradient is already soft,
     and this full-width layer is tweened (yPercent/opacity) per scrub
     frame — the live filter forced a re-raster of ~2560×550 px on the
     way through the pin. Visually indistinguishable without it. */
  z-index: -1;
}

/* Flare highlight — soft amber + violet wash mid-scene.
   alpha.37 — was `inset -10%` + `transparent 60%` which traced a hard
   ring on wide screens. Pushed to `inset -30%` + `transparent 100%`
   so the wash extends well past the section and fades smoothly into
   the page background instead of drawing a circular edge. */
.reveal__flare {
  position: absolute;
  inset: -30%;
  background: radial-gradient(
    ellipse 65% 55% at 50% 45%,
    rgba(245, 158, 11, 0.22) 0%,
    rgba(139, 92, 246, 0.14) 28%,
    rgba(139, 92, 246, 0.04) 55%,
    transparent 100%
  );
  mix-blend-mode: screen;
  pointer-events: none;
  /* Round-17 — blur(20px) removed : the radial fades to transparent
     100% already ; the filter doubled the raster cost of a layer
     bigger than the viewport (inset -30%). */
  z-index: -1;
}

/* Side rail with the six dots — Apple "you are here" cue. */
.reveal__rail {
  position: absolute;
  top: 50%;
  left: clamp(16px, 2.5vw, 36px);
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 2;
}
.reveal__rail-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  transition:
    background-color 360ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 360ms cubic-bezier(0.4, 0, 0.2, 1);
}
.reveal__rail-dot--active {
  background: var(--accent-amber, #f59e0b);
  transform: scale(1.7);
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.6);
}

/* The pinned product object — centred, with a halo + drop shadow. */
.reveal__product {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 26px 60px rgba(245, 158, 11, 0.18));
  /* alpha.32 VISUAL-QA fix — scale the INNER MusicPlayer (not this
     wrapper, which GSAP also transforms) so the player has real stage
     presence on wide screens. Natural width ~440 px; at 1920 we want
     ~720-820 px visually. */
}
/* --pulse-scale was tried to make the player larger on wide screens
   but any value > 1.0 breaks the MusicPlayer's internal icon ratio.
   Keep natural size; rely on the halo + drop-shadow + grid balance
   to give it stage presence instead. */
.reveal__product::before {
  content: '';
  position: absolute;
  /* alpha.37 halo "hard ring" fix — was `inset -8% -18% -22% -18%`
     + `transparent 62%` which produced the most visible "halo cuts
     in a straight line" bug the user reported. Pushed both the inset
     and the gradient stops so the wash fades all the way out without
     leaving a circular edge — the chrome now sits in a soft, organic
     glow instead of inside a ring. */
  inset: -60% -50% -70% -50%;
  background: radial-gradient(
    ellipse 70% 60% at center,
    rgba(245, 158, 11, 0.26) 0%,
    rgba(245, 158, 11, 0.14) 22%,
    rgba(139, 92, 246, 0.12) 45%,
    rgba(139, 92, 246, 0.04) 70%,
    transparent 100%
  );
  /* Round-17 — blur(60px) removed : this halo MOVES with the product
     (y/scale tweened every scrub frame), so the filter re-composited a
     ~1500×900 blurred+blended layer per scrolled frame — the single
     hottest layer of the measured reveal-flick jank (45%). The radial
     stops below already end at transparent 100% ; widening the inner
     stop compensates the lost softness. */
  z-index: -1;
  pointer-events: none;
}

/* Copy block. The Vue `:key` swap on title + sub triggers a soft
   cross-fade via CSS. Premium duration (LottieFiles skill). */
.reveal__copy {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 36ch;
}
.reveal__eyebrow {
  font-family: 'Geist Mono', ui-monospace, 'SF Mono', Consolas, monospace;
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent-amber, #f59e0b);
  margin: 0;
}
.reveal__title {
  font-family:
    'Geist',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 700;
  font-size: clamp(36px, 5.2vw, 72px);
  line-height: 1.04;
  letter-spacing: -0.025em;
  color: rgba(255, 255, 255, 0.96);
  margin: 0;
  /* Soft cross-fade on key swap. */
  animation: revealIn 520ms cubic-bezier(0.4, 0, 0.2, 1);
}
.reveal__sub {
  font-family:
    'Geist',
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  font-weight: 400;
  font-size: clamp(15px, 1.2vw, 18px);
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.72);
  margin: 0;
  max-width: 38ch;
  animation: revealIn 600ms cubic-bezier(0.4, 0, 0.2, 1);
  animation-delay: 80ms;
  animation-fill-mode: both;
}

@keyframes revealIn {
  0% {
    opacity: 0;
    transform: translate3d(0, 10px, 0);
  }
  100% {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@media (max-width: 720px) {
  .reveal {
    height: auto;
  }
  /* alpha.37 — DESKTOP pinned stage is hidden on mobile. The horizontal
     swipe carousel below takes over the six-act story. */
  .reveal__stage {
    display: none;
  }
  .reveal__rail {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    flex-direction: row;
    margin-bottom: 18px;
  }
  /* alpha.37 — was `display: none` which removed every glow on mobile
     and made the section read as a flat dark slab. We now KEEP the
     halos but soften their intensity (mix-blend stays screen, opacity
     ramps down) and extend them to the full viewport width via
     negative inset so they bleed bezel-to-bezel like on desktop. */
  .reveal__bars {
    /* full-width amber/pink rise from the bottom, intensity halved */
    inset: auto -10vw 0 -10vw;
    height: 28vh;
    opacity: 0.6;
    /* Round-17 — blur removed (gradient-only layer, see desktop note) */
  }
  .reveal__flare {
    /* extend past the viewport so the wash never shows a circular cut */
    inset: -40vw -30vw -30vw -30vw;
    opacity: 0.7;
  }
  .reveal__product::before {
    /* Halo behind the centred player — extend full-bleed for the same
       no-hard-ring reason as desktop, just at mobile proportions. */
    inset: -40% -40% -50% -40%;
  }
  .reveal__stage {
    /* Spread the stage background gradients out so they cover the
       narrow viewport without bunching toward the centre. */
    background:
      radial-gradient(ellipse 120% 80% at 50% 30%, rgba(245, 158, 11, 0.08) 0%, transparent 100%),
      radial-gradient(ellipse 120% 80% at 50% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal__title,
  .reveal__sub {
    animation: none;
  }
}

/* ── alpha.37 mobile horizontal swipe carousel ──────────────────
   Hidden on desktop (the `.reveal__stage` pin owns the story there) ;
   revealed on mobile only as a swipe-left/right native scroll-snap
   track. Each slide is a full-viewport-width card so swipes feel
   discrete (one act at a time). */

.reveal__mobile-track,
.reveal__mobile-dots {
  display: none;
}

@media (max-width: 720px) {
  .reveal__mobile-track {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    /* Subtle scrollbar — Apple-style hidden by default. */
    scrollbar-width: none;
    padding: clamp(28px, 6vw, 48px) 0;
    gap: 0;
  }
  .reveal__mobile-track::-webkit-scrollbar {
    display: none;
  }
  .reveal__mobile-slide {
    flex: 0 0 100%;
    width: 100%;
    scroll-snap-align: center;
    scroll-snap-stop: always;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(20px, 4vw, 36px);
    padding: 0 clamp(20px, 5vw, 40px);
    box-sizing: border-box;
  }
  .reveal__mobile-copy {
    text-align: center;
    max-width: 90%;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .reveal__mobile-copy .reveal__title {
    font-size: clamp(28px, 8vw, 44px);
    line-height: 1.06;
  }
  .reveal__mobile-copy .reveal__sub {
    font-size: clamp(14px, 3.8vw, 17px);
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.72);
  }
  .reveal__mobile-product {
    display: flex;
    justify-content: center;
    width: 100%;
    /* Per-slide halo so the swipe feels premium — soft amber+violet
       wash behind the chrome, no hard ring at any size. */
    position: relative;
    isolation: isolate;
  }
  .reveal__mobile-product::before {
    content: '';
    position: absolute;
    inset: -30% -10% -40% -10%;
    background: radial-gradient(
      ellipse 80% 60% at center,
      rgba(245, 158, 11, 0.18) 0%,
      rgba(139, 92, 246, 0.12) 40%,
      transparent 100%
    );
    /* Round-17 — blur removed (gradient-only, mobile slide halo) */
    z-index: -1;
    pointer-events: none;
  }
  /* Visual dots under the track — non-interactive, hint that there
     are six acts. The scroll-snap drives the actual navigation. */
  .reveal__mobile-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 4px 0 28px;
  }
  .reveal__mobile-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.22);
  }
}
</style>
