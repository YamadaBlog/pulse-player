<!-- ═════════════════════════════════════════════════════════════════
     PhoneShowcase — alpha.37 premium phone mockup with Pulse Player.

     Mission : present Pulse Player inside a hand-crafted CSS iPhone
     frame as a real product, with a subtle scroll-driven tilt that
     never blocks the page.

     Design pillars (sourced from deep research before coding) :
     - **Conor Luddy "Anatomy of a CSS Phone Mockup"** (2026 article) :
       layered metallic bevel → matte body → clipped screen → dynamic
       island → ambient shadow → specular sheen. We follow each layer
       verbatim with CSS gradients + pseudo-elements.
     - **Luke Meyrick CodePen "iPhone 14 w/ Dynamic Island"** : the
       SVG squircle dimension ratios (180:30 island, 1.3:1 corner
       radius) for a believable iPhone 15 Pro proportion.
     - **Framer Fusion template behaviour** : phone shell stays anchored
       while the content inside (the Pulse Player) breathes ; the
       device tilts in space subtly as the user scrolls. We mirror
       that with a GSAP tilt that goes from rotateY(-12°) → 0° → +12°
       across the section's viewport residency. No pin = no blocking.
     - **CSS-Tricks AirPods Pro article** : "Apple-style" reveals work
       because the camera never sits still ; we use a 6° X tilt arc
       paired with a tiny scale breath so the device feels presented
       not pinned.

     Visibility :
     - Hidden on mobile (≤ 720 px) — the user IS holding a real phone,
       a CSS phone-in-a-phone is redundant and crowded.
     - Shown on tablet/laptop/desktop+. Scales fluid up to 2K/4K via
       clamp() so the frame stays proportional.

     Architecture :
     - Pure CSS for the chrome (no SVG asset, no PNG)
     - GSAP ScrollTrigger scrub (already loaded by ProductReveal /
       ProductRotate3D — zero extra runtime cost)
     - DOM-live Pulse Player inside the screen — audio + interactions
       all preserved
     - Vue v2.3.4 src/lib/ remains byte-identical (alpha.36 → alpha.37)

     Sources :
       - https://www.conor.fyi/writing/anatomy-of-a-css-phone-mockup
       - https://codepen.io/lukemeyrick/pen/poVyEdZ (Luke Meyrick)
       - https://gsap.com/scroll/ (ScrollTrigger best practices)
       - https://www.framer.com/blog/parallax-scrolling-examples (Fusion)
     ═════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import PlayerShell from './PlayerShell.vue'
import shellManifest from '../assets/shells/manifest.json'
import phoneShellSrc from '../assets/shells/phone-auto.webp'

// Round-14 — the in-phone widget is decorative : pre-rendered shell.
const phoneShellRatio = (shellManifest as Record<string, { ratio: number }>)['phone-auto']
  ?.ratio
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const sectionEl = ref<HTMLElement | null>(null)
const phoneEl = ref<HTMLElement | null>(null)
const screenInnerEl = ref<HTMLElement | null>(null)
const ambientEl = ref<HTMLElement | null>(null)
const reflectionEl = ref<HTMLElement | null>(null)

// The phone frame is sized in vw so it scales fluidly with the
// viewport. The MusicPlayer inside takes a fixed width equal to the
// inner screen width so the chrome inside matches the phone screen
// 1-to-1. Computed reactively so it updates on resize.
const phoneInnerWidth = ref<number>(320)

const recomputeInnerWidth = (): void => {
  if (!screenInnerEl.value) return
  // Reads back the CSS-computed width from the inner screen container.
  const w = screenInnerEl.value.getBoundingClientRect().width
  // The player gets ~92 % of the screen so the chrome floats inside
  // the screen with a subtle gutter — like a wallpaper widget.
  phoneInnerWidth.value = Math.max(220, Math.round(w * 0.92))
}

let trigger: ScrollTrigger | null = null
let timeline: gsap.core.Timeline | null = null
let resizeObs: ResizeObserver | null = null

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const isSmallViewport = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 720px)').matches
}

// Player width prop. Reactive to inner-screen resize so the phone
// rescaling on viewport change drags the player along with it.
const playerWidthProp = computed(() => phoneInnerWidth.value)

onMounted(() => {
  if (!sectionEl.value || !phoneEl.value) return

  // Initial measurement + ResizeObserver so the player width tracks the
  // CSS-driven phone size at every viewport step.
  recomputeInnerWidth()
  if (typeof ResizeObserver !== 'undefined' && screenInnerEl.value) {
    resizeObs = new ResizeObserver(() => recomputeInnerWidth())
    resizeObs.observe(screenInnerEl.value)
  }

  // Reduced-motion or small viewport → static centred phone, no GSAP.
  if (prefersReducedMotion() || isSmallViewport()) {
    if (phoneEl.value) phoneEl.value.style.transform = 'none'
    return
  }

  // Scroll-driven tilt — no pin, no scroll-jacking. The phone tilts
  // from rotateY(-12°) when entering the viewport, through 0° at the
  // pivot, out to rotateY(+12°) as the section exits the top.
  timeline = gsap.timeline({
    scrollTrigger: {
      trigger: sectionEl.value,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.7,
      invalidateOnRefresh: true,
    },
    defaults: { ease: 'none' },
  })

  timeline.fromTo(
    phoneEl.value,
    { rotateY: -12, rotateX: 6, scale: 0.94, y: 24 },
    { rotateY: 12, rotateX: -4, scale: 1, y: 0, duration: 1 },
    0,
  )

  // Ambient halo behind the phone — brightens at the pivot, fades at
  // the edges. Same trick as the alpha.34 mood gradients : 1 timeline
  // drives the whole composition.
  if (ambientEl.value) {
    timeline
      .fromTo(
        ambientEl.value,
        { opacity: 0.32, scale: 0.85 },
        { opacity: 0.72, scale: 1.08, duration: 0.5 },
        0,
      )
      .to(ambientEl.value, { opacity: 0.32, scale: 0.85, duration: 0.5 }, 0.5)
  }

  // Specular sheen that sweeps across the bezel at the pivot point.
  if (reflectionEl.value) {
    timeline
      .fromTo(
        reflectionEl.value,
        { x: '-60%', opacity: 0 },
        { x: '60%', opacity: 0.7, duration: 0.5 },
        0,
      )
      .to(reflectionEl.value, { x: '120%', opacity: 0, duration: 0.5 }, 0.5)
  }

  trigger = timeline.scrollTrigger ?? null
})

onBeforeUnmount(() => {
  if (timeline) {
    timeline.kill()
    timeline = null
  }
  if (trigger) {
    trigger.kill()
    trigger = null
  }
  if (resizeObs) {
    resizeObs.disconnect()
    resizeObs = null
  }
})
</script>

<template>
  <section ref="sectionEl" class="phone-showcase section" aria-label="Pulse Player inside a phone">
    <div class="phone-showcase__head">
      <p class="section__eyebrow">
        <span class="act-num">III·d</span><span class="act-sep">·</span>Native feel
      </p>
      <h2 class="section__h">Looks like the home screen it lives on.</h2>
      <p class="section__sub">
        The chrome is designed to feel at home wherever a music app would. Drop it on a phone hero,
        in a launcher widget, on a desktop card — the proportions, the chrome, the breathing FFT all
        follow.
      </p>
    </div>

    <!-- The stage : ambient wash + phone + reflection sweep. -->
    <div class="phone-showcase__stage">
      <!-- Ambient coloured wash behind the phone — picks up the cover
           accent automatically via the auto variant inside. -->
      <div ref="ambientEl" class="phone-showcase__ambient" aria-hidden="true"></div>

      <!-- The phone itself : metallic bevel → matte body → clipped
           screen → dynamic island → ambient ring. Pure CSS. -->
      <div ref="phoneEl" class="phone">
        <!-- Layer 1 — outer bevel (brushed-aluminium gradient).
             A 1 px padded outer div with a 135° linear gradient creates
             the "catching light from above" feel of polished metal. -->
        <div class="phone__body">
          <!-- Layer 2 — matte black inner body (the actual chassis).
               Inset ring shadow gives the screen depth. -->
          <div class="phone__inner">
            <!-- Hardware details : antenna lines, side buttons, mute. -->
            <span class="phone__btn phone__btn--mute" aria-hidden="true"></span>
            <span class="phone__btn phone__btn--vol-up" aria-hidden="true"></span>
            <span class="phone__btn phone__btn--vol-down" aria-hidden="true"></span>
            <span class="phone__btn phone__btn--power" aria-hidden="true"></span>

            <!-- Layer 3 — the screen. Clipped corners + slight inset
                 so the bezel looks 1.5 px thick (an iPhone 15 cue). -->
            <div class="phone__screen">
              <!-- Status bar : time + cellular/wifi/battery glyphs. -->
              <div class="phone__statusbar" aria-hidden="true">
                <span class="phone__time">9:41</span>
                <span class="phone__status-icons">
                  <span class="phone__status-icon phone__status-icon--cell"></span>
                  <span class="phone__status-icon phone__status-icon--wifi"></span>
                  <span class="phone__status-icon phone__status-icon--battery"></span>
                </span>
              </div>

              <!-- Dynamic Island — sits under the status bar, pill
                   shape with a sharp inner glint that catches light. -->
              <div class="phone__island" aria-hidden="true">
                <span class="phone__island-camera"></span>
              </div>

              <!-- Inner screen content — where the Pulse Player lives.
                   ref'd so we can read its computed width back to the
                   player so it fills the screen precisely. -->
              <div ref="screenInnerEl" class="phone__screen-inner">
                <div class="phone__widget">
                  <PlayerShell
                    :src="phoneShellSrc"
                    alt="Pulse Player widget inside a phone screen"
                    :ratio="phoneShellRatio"
                    :style="{ width: playerWidthProp + 'px' }"
                  />
                </div>
                <p class="phone__caption">Drop-in widget · Pulse Player v0.11</p>
              </div>

              <!-- Home indicator at the bottom — narrow pill. -->
              <div class="phone__home-indicator" aria-hidden="true"></div>
            </div>
          </div>
        </div>

        <!-- Layer 4 — specular sheen swept across the bezel during the
             rotation midpoint, giving a "fresh out of the box" glance. -->
        <div ref="reflectionEl" class="phone__reflection" aria-hidden="true"></div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── Section base ─────────────────────────────────────────────── */

.phone-showcase {
  position: relative;
  isolation: isolate;
  overflow-x: clip;
  padding-block: clamp(64px, 8vw, 160px);
  padding-inline: clamp(16px, 4vw, 48px);
}

.phone-showcase__head {
  text-align: center;
  max-width: min(72ch, 86vw);
  margin: 0 auto clamp(40px, 4vw, 96px);
}
.phone-showcase__head .section__sub {
  margin-inline: auto;
}

.phone-showcase__stage {
  position: relative;
  display: grid;
  place-items: center;
  perspective: 1600px;
  perspective-origin: 50% 40%;
  min-height: clamp(560px, 60vw, 960px);
}

/* Ambient coloured wash behind the phone. */
.phone-showcase__ambient {
  position: absolute;
  inset: 6% 18%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.16) 0%,
    rgba(80, 160, 255, 0.22) 30%,
    rgba(245, 90, 200, 0.16) 60%,
    transparent 80%
  );
  filter: blur(80px);
  z-index: 1;
  opacity: 0.45;
  will-change: opacity, transform;
}

/* ── The phone ─────────────────────────────────────────────────
   Sized in clamp() so it stays proportional at every viewport.
   3:6.5 aspect ratio mirrors iPhone 15 Pro. */

.phone {
  position: relative;
  z-index: 2;
  width: clamp(280px, 30vw, 420px);
  aspect-ratio: 9 / 19.5;
  transform-style: preserve-3d;
  transform: rotateY(-12deg) rotateX(6deg) scale(0.94);
  transform-origin: 50% 50%;
  will-change: transform;
}

/* Layer 1 : metallic bevel — 135° aluminium gradient. */
.phone__body {
  position: absolute;
  inset: 0;
  border-radius: clamp(36px, 4vw, 56px);
  background: linear-gradient(
    135deg,
    #5a5a64 0%,
    #2a2a30 25%,
    #1a1a1f 50%,
    #2a2a30 75%,
    #4a4a55 100%
  );
  padding: 2px;
  box-shadow:
    /* Soft drop shadow — the phone "sits in the room". */
    0 30px 60px -20px rgba(0, 0, 0, 0.6),
    0 12px 28px -8px rgba(0, 0, 0, 0.5),
    /* Inner highlight on top edge — catches studio light. */ inset 0 1px 0
      rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(0, 0, 0, 0.4);
}

/* Layer 2 : matte black chassis. */
.phone__inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background:
    radial-gradient(ellipse at 30% 0%, rgba(60, 60, 70, 0.4) 0%, transparent 50%),
    linear-gradient(180deg, #0d0d12 0%, #08080c 100%);
  padding: clamp(6px, 0.7vw, 10px);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

/* Hardware buttons. */
.phone__btn {
  position: absolute;
  background: linear-gradient(180deg, rgba(50, 50, 56, 1) 0%, rgba(28, 28, 32, 1) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.4);
}
.phone__btn--mute {
  left: -2px;
  top: 14%;
  width: 3px;
  height: 28px;
  border-radius: 2px 0 0 2px;
}
.phone__btn--vol-up {
  left: -2px;
  top: 22%;
  width: 3px;
  height: 44px;
  border-radius: 2px 0 0 2px;
}
.phone__btn--vol-down {
  left: -2px;
  top: 30%;
  width: 3px;
  height: 44px;
  border-radius: 2px 0 0 2px;
}
.phone__btn--power {
  right: -2px;
  top: 24%;
  width: 3px;
  height: 64px;
  border-radius: 0 2px 2px 0;
}

/* Layer 3 : the screen — clipped corners + 6 % corner radius. */
.phone__screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: clamp(28px, 3.2vw, 48px);
  overflow: hidden;
  background: linear-gradient(180deg, #06080f 0%, #0a0d1a 100%);
  display: flex;
  flex-direction: column;
}

/* Status bar — minimal mock so it reads as a real wallpaper. */
.phone__statusbar {
  position: relative;
  z-index: 4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(6px, 0.8vw, 12px) clamp(16px, 1.6vw, 26px) 0;
  font-size: clamp(9px, 0.8vw, 13px);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  letter-spacing: 0.01em;
}
.phone__time {
  /* Use a SF-Pro-like fallback : system-ui on most engines. */
  font-family:
    system-ui,
    -apple-system,
    'SF Pro Display',
    sans-serif;
  font-variant-numeric: tabular-nums;
}
.phone__status-icons {
  display: flex;
  gap: 5px;
  align-items: center;
}
.phone__status-icon {
  display: inline-block;
  background: rgba(255, 255, 255, 0.9);
}
.phone__status-icon--cell {
  width: 12px;
  height: 8px;
  -webkit-mask: linear-gradient(180deg, transparent 50%, #000 50%, #000 100%) 0 100% / 3px 100%
    repeat-x;
  mask: linear-gradient(180deg, transparent 50%, #000 50%, #000 100%) 0 100% / 3px 100% repeat-x;
}
.phone__status-icon--wifi {
  width: 12px;
  height: 9px;
  clip-path: polygon(50% 0, 100% 50%, 80% 80%, 50% 50%, 20% 80%, 0 50%);
  background: rgba(255, 255, 255, 0.85);
}
.phone__status-icon--battery {
  width: 22px;
  height: 10px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 3px;
  background: transparent;
  position: relative;
}
.phone__status-icon--battery::after {
  content: '';
  position: absolute;
  inset: 1.5px;
  width: 70%;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 1.5px;
}

/* Dynamic Island — pill with subtle glint. */
.phone__island {
  position: absolute;
  top: clamp(8px, 0.9vw, 14px);
  left: 50%;
  transform: translateX(-50%);
  width: clamp(76px, 8.5vw, 122px);
  height: clamp(22px, 2.4vw, 32px);
  border-radius: 999px;
  background: radial-gradient(
    ellipse 60% 80% at 30% 40%,
    rgba(40, 40, 48, 1) 0%,
    rgba(8, 8, 12, 1) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.6),
    0 1px 4px rgba(0, 0, 0, 0.5);
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: clamp(8px, 0.7vw, 12px);
}
.phone__island-camera {
  width: clamp(8px, 0.7vw, 12px);
  height: clamp(8px, 0.7vw, 12px);
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 35%,
    rgba(80, 80, 120, 1) 0%,
    rgba(20, 20, 35, 1) 60%,
    rgba(2, 2, 5, 1) 100%
  );
  box-shadow:
    inset 0 -1px 0 rgba(255, 255, 255, 0.1),
    0 0 2px rgba(60, 60, 100, 0.5);
}

/* Inner screen content — where the Pulse Player widget lives. */
.phone__screen-inner {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(8px, 1vw, 18px);
  padding: clamp(40px, 5vw, 72px) clamp(8px, 1vw, 18px) clamp(28px, 3vw, 48px);
  background:
    /* Atmospheric wash behind the widget — picks up the cover blur
       from the actual MusicPlayer's variant="auto". */
    radial-gradient(ellipse 90% 60% at 50% 35%, rgba(80, 60, 180, 0.35) 0%, transparent 60%),
    radial-gradient(ellipse 100% 70% at 50% 100%, rgba(180, 60, 90, 0.28) 0%, transparent 60%),
    linear-gradient(180deg, #06080f 0%, #0c0e1c 100%);
}

.phone__widget {
  width: 100%;
  display: flex;
  justify-content: center;
  filter: drop-shadow(0 16px 40px rgba(0, 0, 0, 0.5));
}

.phone__caption {
  font-size: clamp(8px, 0.7vw, 12px);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
  margin: 0;
  text-align: center;
}

/* Home indicator pill at the bottom. */
.phone__home-indicator {
  position: absolute;
  bottom: clamp(6px, 0.8vw, 12px);
  left: 50%;
  transform: translateX(-50%);
  width: clamp(80px, 8.5vw, 120px);
  height: clamp(3px, 0.32vw, 5px);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  z-index: 5;
}

/* Layer 4 : specular sheen across the bezel — GSAP sweeps it. */
.phone__reflection {
  position: absolute;
  inset: 0;
  border-radius: clamp(36px, 4vw, 56px);
  background: linear-gradient(
    115deg,
    transparent 0%,
    rgba(255, 255, 255, 0.18) 45%,
    rgba(255, 255, 255, 0.32) 50%,
    rgba(255, 255, 255, 0.18) 55%,
    transparent 100%
  );
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 3;
  opacity: 0;
}

/* Mobile : hide the entire phone-showcase. The user is already on a
   phone — a CSS phone-in-a-phone is redundant and consumes precious
   vertical space. The native Pick a mood gallery already plays the
   "see the chrome in context" role. */
@media (max-width: 720px) {
  .phone-showcase {
    display: none;
  }
}

/* Reduced motion : static phone at the pivot pose, no GSAP timeline. */
@media (prefers-reduced-motion: reduce) {
  .phone {
    transform: rotateY(0deg) rotateX(0deg) scale(1);
  }
  .phone-showcase__ambient {
    opacity: 0.5;
  }
  .phone__reflection {
    display: none;
  }
}
</style>
