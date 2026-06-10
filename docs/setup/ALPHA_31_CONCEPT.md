# alpha.31 — "Journey into Sound" creative direction

Built from the research: Apple AirPods Max ([Awwwards SOTD 2021](https://www.awwwards.com/sites/airpods-max)), three-act structure scrollytelling ([metabole.studio guide](https://metabole.studio/en/blog/scrollytelling)), `frontend-design` + `taste-skill v2` installed skills.

## Concept

Pulse is presented as a **hardware-grade software object** — a precision instrument for sound, not a UI widget. The visitor watches it appear, listens to it speak, sees it morph, and is invited to install it. Apple's "Journey into Sound" rhythm, scaled to a developer audience.

## Mood

- **Editorial premium** (not consumer-app cheerful, not enterprise-grey corporate)
- **Dark canvas with cinematic light** — `#05050A` ground, accent lighting through cursor / scroll / FFT
- **Restrained motion** — every animation has a stated purpose (no infinite micro-loops)
- **Hardware-product feel** — the player floats, casts shadow, has presence

## Three-act structure

| Act                    | Title shown              | Role                                                                                                                          | Section in App.vue                          |
| ---------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **0** (preamble)       | —                        | The cinematic intro: a brief dark canvas → the pulse logo waveform animates and the camera "pulls back" to reveal the hero    | NEW `<CinematicIntro>` overlay              |
| **I** (setup)          | **`I · The instrument`** | The hero: product centered, supporting copy below. Player audio plays muted-loop ambient pad. The visitor sees what Pulse is. | Existing `.hero` re-decorated               |
| **II** (confrontation) | **`II · In motion`**     | The "Why Pulse" section (already exists at alpha.29-30). Motion as a product feature.                                         | Existing `.section--why`                    |
| **III** (escalation)   | **`III · Made to grow`** | The Resize section. Live proof the product responds.                                                                          | Existing `#section-resize`                  |
| **IV** (escalation)    | **`IV · Nine moods`**    | The Variants gallery. The product worn in nine personalities.                                                                 | Existing `#section-variants` (re-decorated) |
| **V** (resolution)     | **`V · Drop it in`**     | The install / framework section. Code typed character by character.                                                           | Existing CTA + framework table              |

The eyebrow on every section uses **Roman numerals + Geist Mono** to signal a deliberate journey. Not "Story · 03" (audit alpha.30 flagged that). The Roman numerals are inherently filmic — they say "we wrote this in acts".

## Storyboard (3 frames per act)

### Act 0 — Cinematic intro (0.0 → 1.6 s)

| Frame | Visual                                                                                                 | Audio                              | Motion                                                     |
| ----- | ------------------------------------------------------------------------------------------------------ | ---------------------------------- | ---------------------------------------------------------- |
| 0.0 s | Black canvas + tiny centred waveform dot                                                               | Silent                             | Dot pulses once (heartbeat)                                |
| 0.6 s | Waveform expands into the Pulse logo at full size, centered                                            | Brief swell of the ambient pad     | Logo scale 0.2 → 1.0 with `cubic-bezier(0.22, 1, 0.36, 1)` |
| 1.6 s | The logo fades out as the hero behind it composes (player appears centered, text under it cascades in) | Pad fades to background loop level | Cross-fade overlay → hero in 400 ms                        |

### Act I — The instrument (hero)

| Frame          | Visual                                                                     | Motion                                                                             |
| -------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Top of page    | Player centered, large, with subtle drop shadow + ambient glow halo behind | Player gets a 12 s slow Y-bob (translateY 0 → -6 → 0) — the "floating object" feel |
| Mid hero       | Title + lede + CTA below the player                                        | Cascade in (already alpha.27)                                                      |
| Hover anywhere | Cursor light follows + magnetic CTA leans                                  | alpha.30 settings                                                                  |

### Act II — In motion ("Why Pulse")

- Already shipped alpha.29-30. Wave + orbit field stay.
- Roman numeral eyebrow: `II · In motion` instead of `In motion` (alpha.30 fix).

### Act III — Made to grow (resize)

- Adds Roman numeral eyebrow.
- Section title becomes Geist 700 + tighter tracking.
- Resize chips re-styled with a brand-specific shape (not generic webflow pills).

### Act IV — Nine moods (variants)

- Already in alpha.30 grid is broken (feature card + smaller).
- Roman numeral eyebrow added.
- The 9 variants get a `data-variant-name` attribute that surfaces on hover.

### Act V — Drop it in (install)

- The install code block becomes the visual hero of the final section.
- Roman numeral eyebrow.
- The block animates: each character types in sequence on intersect (~14 chars/sec).

## Treatment of audio

- The intro pad plays softly during Act 0 + Act I idle (muted-by-default → user clicks anywhere → unmutes). Browser autoplay policy compliant.
- The audio-reactive amplification is already strong (alpha.30 boost). No further work.
- The "user clicks Play" event triggers a one-off light flare across the whole page (1 frame opacity flash 0 → 0.3 → 0) — Apple iPhone Pro "screen lights up" cue.

## Animations principales (already shipped)

- Staged reveal (alpha.27)
- Cursor glow (alpha.28)
- Magnetic hover (alpha.29)
- Variable font axis on scroll (alpha.30)
- Apple Liquid Glass on FAB (alpha.30)
- Audio-reactive backdrop x2 (alpha.30 boost)

## Animations secondaires (NEW in alpha.31)

- **Cinematic intro overlay** with logo → hero transition
- **Floating Y-bob** on the hero player (12 s loop, 6 px amplitude)
- **Roman numeral act eyebrows** on every scene (Geist Mono uppercase, amber)
- **Install code type-on** character by character on intersect
- **One-shot light flare** on user "first play" event

## Moments wow

1. The 1.6 s cinematic intro from dot → logo → hero
2. The variable font weight axis morphing on scroll
3. The audio-reactive glow + saturation when track is playing (now strong enough to be felt)
4. The light sweep on the primary CTA hover
5. The cursor-tracking glow + magnetic CTA combo
6. The Apple Liquid Glass FAB chrome

## Contraintes responsive / performance

- Cinematic intro skipped on `prefers-reduced-motion`
- Cinematic intro skipped if user has visited before (sessionStorage flag)
- Cinematic intro skipped on `< 720 px` (mobile gets straight-to-hero)
- Floating Y-bob is GPU transform only
- Install code type-on uses `IntersectionObserver` + a single `setInterval` — not RAF
- Bundle budget alpha.31: +1.5 kB JS gzip, +1 kB CSS gzip vs alpha.30

## What we're explicitly NOT doing

- Three.js / WebGL — bundle cost not justified for this page
- Full 60-frame canvas image sequence — needs source PNG sequence we don't have
- Theatre.js studio — overkill for the 5 scenes we have
- GSAP / ScrollTrigger — Motion One + vanilla is enough for our deltas
- Lottie / Rive — needs source artwork
- Rewriting `src/lib/` — byte-identical promise intact (32 alphas)
- Rewriting any `@pulse-music/*` package — same

## Skills used in this concept

- **`frontend-design`** (Anthropic) — applied for typography axis, Liquid Glass FAB, asymmetric layout discipline
- **`design-taste-frontend`** (Leonxlnx taste-skill v2) — brief inference + 3-dials sizing + Roman-numeral act discipline
- **`redesign-audit`** (Leonxlnx) — alpha.30 audit step
- **`brand-guidelines`** (Anthropic) — palette discipline reference
- **`theme-factory`** (Anthropic) — 9-variants cohesion reference
- **`minimalist-aesthetic`** (Leonxlnx) — restraint pole for the intro (no maximalist explosion)
