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
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

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
        <MusicPlayer :variant="currentVariant" />
      </div>

      <!-- Copy block (right column) -->
      <div ref="supporting" class="reveal__copy">
        <p class="reveal__eyebrow">{{ currentEyebrow }}</p>
        <h2 class="reveal__title" :key="currentAct">{{ currentTitle }}</h2>
        <p class="reveal__sub" :key="`s-${currentAct}`">{{ currentSub }}</p>
      </div>
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
  grid-template-columns: 1fr minmax(420px, 0.95fr);
  align-items: center;
  gap: clamp(40px, 6vw, 96px);
  padding: clamp(40px, 8vh, 96px) clamp(24px, 6vw, 88px);
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 50%, rgba(245, 158, 11, 0.06) 0%, transparent 45%),
    radial-gradient(circle at 75% 60%, rgba(139, 92, 246, 0.08) 0%, transparent 50%);
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
  filter: blur(28px);
  z-index: -1;
}

/* Flare highlight — soft amber + violet wash mid-scene. */
.reveal__flare {
  position: absolute;
  inset: -10% -10%;
  background: radial-gradient(
    circle at 50% 45%,
    rgba(245, 158, 11, 0.22) 0%,
    rgba(139, 92, 246, 0.14) 30%,
    transparent 60%
  );
  mix-blend-mode: screen;
  pointer-events: none;
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
}
.reveal__product::before {
  content: '';
  position: absolute;
  inset: -8% -18% -22% -18%;
  background: radial-gradient(
    ellipse at center,
    rgba(245, 158, 11, 0.22) 0%,
    rgba(139, 92, 246, 0.12) 32%,
    transparent 62%
  );
  filter: blur(40px);
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
  .reveal__stage {
    position: relative;
    grid-template-columns: 1fr;
    min-height: auto;
    padding: clamp(40px, 8vh, 80px) clamp(20px, 5vw, 40px);
  }
  .reveal__rail {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    flex-direction: row;
    margin-bottom: 18px;
  }
  .reveal__bars,
  .reveal__flare {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal__title,
  .reveal__sub {
    animation: none;
  }
}
</style>
