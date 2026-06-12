<!-- ═════════════════════════════════════════════════════════════════
     ProductRotate3D — alpha.36 product rotation 3D (non-blocking).

     Changelog vs alpha.35 :
     - REMOVED the `pin: stageEl` ScrollTrigger option that froze the
       page during 120 % of viewport scroll. The page now scrolls
       naturally ; the rotation plays as the section travels through
       the viewport (start: top bottom → end: bottom top).
     - ROTATION arc is now a FULL TURN (0° → 360°) so both faces are
       visible during the scroll. backface-visibility lets the back
       face hide while the front shows, and vice versa.
     - Added a SECOND face (rotateY(180deg)) rendering the same
       MusicPlayer in an ALTERNATIVE variant ("sunset" — the warm
       counterpart to the cover-derived "auto" front face). The user
       sees the chrome turning to reveal a different mood on the back
       — like flipping a physical record sleeve.
     - Mobile (≤ 720 px) : rotation completely disabled, layout becomes
       a static centred showcase with just the front face. No GSAP
       binding, no transform — no risk of horizontal overflow or
       janky scroll on small screens.
     - Section wrapper gets `overflow-x: clip` so the rotating chrome
       can never push the page wider than the viewport on any size.

     Architecture rationale (unchanged from alpha.35) :
     - CSS 3D transforms + GSAP ScrollTrigger scrub (no three.js)
     - The DOM widget stays live, accessible, audio-bound
     - Vue v2.3.4 src/lib/ remains byte-identical (alpha.35 → alpha.36)

     Sources (carried over from alpha.35 deep research) :
       - Codrops "3D Scroll-Driven Text Animations with CSS+GSAP"
       - MDN scroll-driven timelines + backface-visibility
       - GSAP ScrollTrigger docs (start/end without pin)
     ═════════════════════════════════════════════════════════════════ -->

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import PlayerShell from './PlayerShell.vue'
import shellManifest from '../assets/shells/manifest.json'

// Round-14 — both cube faces are decorative during the scroll-driven
// rotation : full instances replaced by pre-rendered shells.
const shellSrc = import.meta.glob('../assets/shells/face-*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>
const faceShell = (n: string) => shellSrc[`../assets/shells/face-${n}.webp`]
const faceRatio = (n: string) =>
  (shellManifest as Record<string, { ratio: number }>)[`face-${n}`]?.ratio
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useResponsiveWidth } from '../composables/useResponsiveWidth'

gsap.registerPlugin(ScrollTrigger)

const sectionEl = ref<HTMLElement | null>(null)
const sceneEl = ref<HTMLElement | null>(null)
const rotatorEl = ref<HTMLElement | null>(null)
const haloEl = ref<HTMLElement | null>(null)
const floorEl = ref<HTMLElement | null>(null)

// Player width — slightly larger than the resize stage for the
// "product moment" feel. fractionOfViewport cap at 0.84 so the player
// never kisses the bezel on small mobile widths.
const playerWidth = useResponsiveWidth({
  multiplier: 1.05,
  max: 1180,
  fractionOfViewport: 0.84,
})

let trigger: ScrollTrigger | null = null
let timeline: gsap.core.Timeline | null = null

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 720px)').matches
}

onMounted(() => {
  if (!sectionEl.value || !rotatorEl.value) return

  // Skip the rotation binding on reduced-motion AND on mobile. The
  // section still reads as a premium product showcase, just without
  // the cinematic rotation. No pin = page scrolls normally either way.
  if (prefersReducedMotion() || isMobileViewport()) {
    if (rotatorEl.value) rotatorEl.value.style.transform = 'none'
    return
  }

  // Trigger NATURALLY as the section enters the viewport — no pin, no
  // scroll-jacking. The full 360° rotation spans from "the top of this
  // section enters the bottom of the viewport" to "the bottom of this
  // section exits the top of the viewport".
  timeline = gsap.timeline({
    scrollTrigger: {
      trigger: sectionEl.value,
      start: 'top bottom', // begin rotation when section enters viewport
      end: 'bottom top', // finish when section fully scrolls past
      scrub: 0.6, // tiny lag → adds "weight" without jank
      invalidateOnRefresh: true,
    },
    defaults: { ease: 'none' },
  })

  // ── Full 360° rotation on Y axis ─────────────────────────────────
  // Single sweep from 0° to 360° so the user witnesses both faces of
  // the chrome turning around as they scroll. A subtle X tilt + scale
  // breath give it the "presented in a showroom" feel.
  timeline.fromTo(
    rotatorEl.value,
    { rotateY: 0, rotateX: -6, scale: 0.94 },
    { rotateY: 360, rotateX: 6, scale: 1.02, duration: 1 },
    0,
  )

  // ── Halo brightens at the rotation midpoint ─────────────────────
  if (haloEl.value) {
    timeline
      .fromTo(
        haloEl.value,
        { opacity: 0.35, scale: 0.85 },
        { opacity: 0.78, scale: 1.05, duration: 0.5 },
        0,
      )
      .to(haloEl.value, { opacity: 0.35, scale: 0.85, duration: 0.5 }, 0.5)
  }

  // ── Floor shadow squashes with the rotation ─────────────────────
  if (floorEl.value) {
    timeline
      .fromTo(
        floorEl.value,
        { scaleX: 0.7, opacity: 0.34 },
        { scaleX: 1, opacity: 0.55, duration: 0.5 },
        0,
      )
      .to(floorEl.value, { scaleX: 0.7, opacity: 0.34, duration: 0.5 }, 0.5)
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
})
</script>

<template>
  <section ref="sectionEl" class="rotate3d section" aria-label="Pulse Player in 3D">
    <div class="rotate3d__head">
      <p class="section__eyebrow">
        <span class="act-num">III·c</span><span class="act-sep">·</span>Hold it in your hand
      </p>
      <h2 class="section__h">A product, not a widget.</h2>
      <p class="section__sub">
        Same chrome. Now turned in the light, front and back. The face you scroll into is the live
        cover-derived <code>auto</code> mood ; the face you scroll out of is the warm
        <code>sunset</code> alternative — same DOM, same audio session, two skins. Pure CSS
        perspective bound to your scroll position. No pin, no blocking.
      </p>
    </div>

    <div ref="sceneEl" class="rotate3d__scene">
      <!-- Halo : soft coloured wash behind the rotator, brightens at
           the rotation midpoint via the GSAP timeline. -->
      <div ref="haloEl" class="rotate3d__halo" aria-hidden="true"></div>

      <!-- Floor : elliptical drop shadow that squashes when the player
           pitches forward, mimicking a real object on a desk. -->
      <div ref="floorEl" class="rotate3d__floor" aria-hidden="true"></div>

      <!-- Rotator : preserve-3d container holding both faces in space. -->
      <div ref="rotatorEl" class="rotate3d__rotator">
        <!-- Front face — variant="auto" (cover-derived blue/red mood). -->
        <div class="rotate3d__face rotate3d__face--front">
          <PlayerShell
            eager
            :src="faceShell('front-auto')"
            alt="Pulse Player — auto mood (front face)"
            :ratio="faceRatio('front-auto')"
            :style="{ width: playerWidth + 'px' }"
          />
        </div>

        <!-- Back face — variant="sunset" (warm orange/pink alternative).
             This is the mood the user has NOT selected ; revealing it on
             the back makes the rotation a real product flip, not a
             cosmetic spin around an empty card. -->
        <div class="rotate3d__face rotate3d__face--back" aria-hidden="true">
          <PlayerShell
            eager
            :src="faceShell('back-sunset')"
            alt="Pulse Player — sunset mood (back face)"
            :ratio="faceRatio('back-sunset')"
            :style="{ width: playerWidth + 'px' }"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── Section base ─────────────────────────────────────────────────
   Important: overflow-x: clip prevents the rotating chrome from ever
   pushing the page wider than the viewport on any breakpoint. No
   horizontal scroll on mobile/desktop, ever. */

.rotate3d {
  position: relative;
  isolation: isolate;
  overflow-x: clip;
  padding-block: clamp(64px, 8vw, 160px);
  padding-inline: clamp(16px, 4vw, 48px);
}

.rotate3d__head {
  text-align: center;
  max-width: min(72ch, 86vw);
  margin: 0 auto clamp(40px, 4vw, 96px);
}
.rotate3d__head .section__sub {
  margin-inline: auto;
}

/* ── The 3D scene ───────────────────────────────────────────────── */

.rotate3d__scene {
  position: relative;
  display: grid;
  place-items: center;
  perspective: 1400px;
  perspective-origin: 50% 50%;
  /* Reserve vertical space for the rotator + halo + floor so the
     section has a stable height even if a face is briefly empty. */
  min-height: clamp(360px, 38vw, 640px);
  padding-block: clamp(24px, 3vw, 64px);
}

/* Rotator wrapper — preserve-3d so both faces share the same 3D
   coordinate space. The two faces overlap in the same grid cell ;
   only `transform: rotateY()` separates them. */
.rotate3d__rotator {
  position: relative;
  z-index: 2;
  transform-style: preserve-3d;
  transform-origin: 50% 50%;
  /* Initial transform — overridden by GSAP on scroll. */
  transform: rotateY(0deg) rotateX(-6deg) scale(0.94);
  will-change: transform;
}

/* Both faces stack in the same place. The front sits at Z = 0, the
   back is rotateY(180deg). backface-visibility: hidden ensures only
   the face currently presenting to the camera is rendered, so the
   user never sees a mirrored ghost during rotation. */
.rotate3d__face {
  backface-visibility: hidden;
  transform-style: preserve-3d;
}
.rotate3d__face--front {
  position: relative;
  z-index: 1;
}
.rotate3d__face--back {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  transform: rotateY(180deg);
  z-index: 1;
}

/* Halo — coloured wash behind the rotator, tinted by the auto-mood
   cover. GSAP fades it in at mid-scroll. */
.rotate3d__halo {
  /* Round-22 user feedback ("je n'aime pas les gros effets en BG") -
     this wash, once its blur was gone, turned into a loud hard-edged
     colour disc. Removed outright rather than re-blurred : the section
     reads cleaner without it. */
  display: none;
  position: absolute;
  inset: 10% 15%;
  border-radius: 50%;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(255, 255, 255, 0.16) 0%,
    rgba(120, 180, 255, 0.2) 30%,
    rgba(255, 120, 90, 0.16) 60%,
    transparent 80%
  );
  /* Round-21 - blur removed : gradient-only decorative layer ; the
     radial fade is already soft and the filter forced a costly raster
     burst when the layer (re)entered the viewport (user-reported
     hitches at pin release + page ascent). */
  z-index: 1;
  opacity: 0.35;
  will-change: opacity, transform;
}

/* Floor — elliptical drop that squashes when the player pitches. */
.rotate3d__floor {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: min(820px, 60%);
  height: 56px;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.2) 40%,
    transparent 75%
  );
  /* Round-21 - blur removed : gradient-only decorative layer ; the
     radial fade is already soft and the filter forced a costly raster
     burst when the layer (re)entered the viewport (user-reported
     hitches at pin release + page ascent). */
  z-index: 0;
  opacity: 0.4;
  will-change: opacity, transform;
}

/* Mobile (alpha.37 RESTORE — user feedback "l'autre composant à
   l'arrière n'apparaît plus" + "halo coupé par les containers") :
     - the rotation 3D pin/scrub is still disabled (mobile JS path),
       BUT the back face is RE-INTRODUCED as a STACKED sibling below
       the front face. Visitor sees both variants flat, with a divider
       label "Same player · warm sunset alternative" between them,
       which is the entire promise of the section.
     - the halo is no longer caged by `inset: 20% 20%` — it now expands
       via VIEWPORT-anchored negative inset (-30vw side / -10vh block),
       so the wash genuinely overflows the section into the page bg.
     - `.rotate3d` keeps `overflow-x: clip` so the negative inset wash
       never causes a horizontal scrollbar ; the .app/#app upstream clip
       is the final safety. */
@media (max-width: 720px) {
  .rotate3d__scene {
    min-height: auto;
    perspective: none;
    padding-block: clamp(8px, 2vw, 24px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(20px, 5vw, 36px);
  }
  .rotate3d__rotator {
    transform: none;
    transform-style: flat;
    display: contents;
  }
  .rotate3d__face--front {
    position: relative;
    z-index: 2;
  }
  /* RESTORE the back face on mobile, stacked below the front. */
  .rotate3d__face--back {
    display: grid;
    position: relative;
    inset: auto;
    place-items: center;
    transform: none;
    z-index: 2;
  }
  /* Divider label between the two faces — explains the concept of
     swapping moods without scrolling. */
  .rotate3d__face--back::before {
    content: 'same player · warm sunset mood';
    position: absolute;
    top: calc(clamp(20px, 5vw, 36px) * -0.5);
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    background: rgba(10, 10, 15, 0.95);
    padding: 6px 14px;
    border-radius: 999px;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 3;
  }
  /* Halo : full-bleed wash, not a centred disc. */
  .rotate3d__halo {
    opacity: 0.42;
    inset: -10vh -30vw !important;
    border-radius: 0;
    background:
      radial-gradient(
        ellipse 60% 50% at 30% 35%,
        rgba(120, 180, 255, 0.32) 0%,
        rgba(139, 92, 246, 0.18) 40%,
        transparent 100%
      ),
      radial-gradient(
        ellipse 65% 55% at 70% 70%,
        rgba(255, 120, 90, 0.28) 0%,
        rgba(236, 72, 153, 0.16) 40%,
        transparent 100%
      );
    /* Round-21 - blur removed : gradient-only decorative layer ; the
     radial fade is already soft and the filter forced a costly raster
     burst when the layer (re)entered the viewport (user-reported
     hitches at pin release + page ascent). */
    mix-blend-mode: screen;
  }
  .rotate3d__floor {
    width: 70%;
    bottom: 4%;
  }
}

/* Reduced motion : static front face, no rotation, no GSAP binding.
   Matches the JS-level skip in onMounted. */
@media (prefers-reduced-motion: reduce) {
  .rotate3d__rotator {
    transform: none;
  }
  .rotate3d__face--back {
    display: none;
  }
  .rotate3d__halo {
    opacity: 0.35;
  }
  .rotate3d__floor {
    opacity: 0.4;
    transform: translateX(-50%);
  }
}
</style>
