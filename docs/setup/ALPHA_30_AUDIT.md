# Alpha.30 audit — applying the redesign-audit skill protocol

Run the [Leonxlnx/taste-skill redesign protocol](https://github.com/Leonxlnx/taste-skill/tree/main/skills/redesign-skill) on the alpha.29 live demo at `http://localhost:5186/`. Audit is brutal and honest — the agent did the previous alphas, so it has every incentive to overrate them.

## Section-by-section verdict

### 1. Hero

| What works                                                             | What doesn't                                                                                                                                                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geist 800 title with negative tracking — looks designed, not defaulted | The title still cascades letter-by-letter on EVERY load — **the kinetic-type effect overstays its welcome** once the user re-loads to test something                            |
| Cursor-tracking glow follows pointer naturally                         | The glow is **mostly invisible against the dark backdrop** until the user moves near it — there's no resting state showing the effect exists                                    |
| Light-sweep on CTA primary is genuinely Apple-like                     | Magnetic hover is on, but **strength=6px is too subtle** to be felt — the user reads it as "is it broken?"                                                                      |
| Audio-reactive amplification of glow + backdrop                        | The amplification is **too subtle** — at smoothed mean 0.3 the user doesn't see the chrome respond                                                                              |
| Staged reveal on first load                                            | The order (badge → title → lede → player → CTA) is correct **but the player itself appears late** — by the time it cascades in, the visitor has read the lede and lost interest |
| Particle field amber                                                   | Particles drift upward at constant velocity — **looks like CSS auto-scroll** not music-driven                                                                                   |

**Verdict:** the hero is the WEAKEST section relative to its ambition. The motion is correct but most of it reads as "AI agent showing off" rather than "Apple page presenting product". The fixes are subtraction, not addition.

### 2. Why Pulse (NEW alpha.29)

| What works                                        | What doesn't                                                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Asymmetric staircase two-column layout            | Title kinetic dual-wave is **GAUDY** — every char wiggling as you scroll reads as drunk text, not design                            |
| Eyebrow amber Geist Mono "Story · 03"             | "Story · 03" implies there's a Story · 01 and Story · 02 — **the visitor wonders if they missed something**                         |
| Lede tones: white → warm amber for the second col | The amber lede is **less readable** than the white one (contrast 4.1 vs 6.2 on bg)                                                  |
| Orbit field 5-orb decoration                      | Orbs are **blurry coloured smudges** without context — the section is "Why Pulse" but the orbs don't read as related to the product |

**Verdict:** the section is too on-the-nose self-referential — it talks about motion as a product feature **while doing motion to itself**. Apple pages don't usually justify their own motion in the motion section; they just demonstrate it.

### 3. Resize section

| What works                                            | What doesn't                                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Live slider drives the component — pure product proof | The section header `Resize it. Everything follows.` is still in the previous typography (default system, NOT Geist) |
| Three preset chips work                               | The chips look **generic** — same shape as the variant picker chips. Lost the visual hierarchy                      |

**Verdict:** this section is the BEST in the page — it's the only one that shows the product doing something real instead of decorating itself. Almost untouched needed.

### 4. Variants gallery

| What works                                         | What doesn't                                                                                             |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 9 variants displayed side by side at the same size | The grid is symmetric / balanced — exactly what `frontend-design` skill flags as AI-default              |
| View Transition cross-fade on click                | Most browsers don't actually trigger it because the chips are inside the FAB picker (a different region) |

**Verdict:** grid layout needs breaking. Apple iPhone Pro page does NOT show 5 colour variants in a 5-up grid — they sit on a curve or in a featured-and-quieter pair.

### 5. FAB demonstration

| What works                               | What doesn't                                                                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistent floating FAB on every section | The FAB is **too small relative to the new hero typography** — the original 88-px FAB worked when the hero h1 was 40px Geist Variable. Now the title is 80px and the FAB feels like an afterthought. |
| Picker chips for variants                | Chip transitions are scale-1.03 hover, scale-1.06 active — generic webflow micro-interaction. No surprise.                                                                                           |

**Verdict:** the FAB needs more presence on this redesigned page. Glassmorphism would help (Apple's Liquid Glass spec).

## Anti-default discipline check (taste-skill 0.D)

| Anti-default flag                         | alpha.29 status                                                                         |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| AI-purple gradients                       | FIXED in alpha.29 ✅                                                                    |
| Centered hero over dark mesh              | PARTIAL — hero is centered but inner content has its own asymmetric tendency ⚠️         |
| Three equal feature cards                 | PARTIAL — "Why Pulse" is 2 cols not 3, but they're equal mass ⚠️                        |
| Generic glassmorphism on everything       | NOT YET — no glass at all in alpha.29. **Apple Liquid Glass on FAB only** in alpha.30.  |
| Infinite-loop micro-animations everywhere | TRUE — particle field + orbit field both loop forever. **Audit and prune in alpha.30.** |
| Inter + slate-900                         | FIXED via Geist ✅                                                                      |

## Action items for alpha.30 (sized by impact)

| #   | Action                                                                                                                                      | Skill source                                              | Impact                    |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------- |
| 1   | **Subtle the cursor glow's resting state** — paint a subtle pre-existing glow centered so the user understands the effect exists            | `frontend-design` § Visual Details                        | High                      |
| 2   | **Strengthen magnetic hover from 6px → 10px** so it's actually felt                                                                         | `frontend-design` § Motion                                | Medium                    |
| 3   | **Subtle the dual-wave kinetic title** — drop amplitude from 20 to 8, period from 7 to 11                                                   | `taste-skill` § Anti-Default                              | High (kills "drunk text") |
| 4   | **Rename "Story · 03"** to something that doesn't imply missing 01-02                                                                       | `taste-skill` § Brief inference                           | Quick win                 |
| 5   | **Recolour the "alt" lede** from amber to higher-contrast warm-white                                                                        | `frontend-design` § Color                                 | Quick win                 |
| 6   | **Apple Liquid Glass on FAB chrome** — frosted/translucent surface with specular highlight                                                  | `frontend-design` § Backgrounds + Apple Liquid Glass spec | High                      |
| 7   | **Strengthen audio-reactive amplification** — change scale from 1.06→1.12, brightness from 1.15→1.30, smoothing 0.18→0.12 (snappier)        | `frontend-design` § Motion                                | High                      |
| 8   | **Hero player reveal first, hero text second** — invert the cascade order so the PRODUCT lands first                                        | `taste-skill` § Hero discipline                           | High                      |
| 9   | **Geist Variable font-weight animation on scroll** — title morphs 400→800 weight as user scrolls (variable-axis interpolation = peak Apple) | `frontend-design` § Typography                            | Premium signature         |
| 10  | **Variants gallery break the grid** — featured 1 large + 4 small                                                                            | `taste-skill` § Layout                                    | Medium                    |

## What we will NOT do in alpha.30

- Add Three.js / WebGL — not justified by the per-page motion gain
- Add Theatre.js — same
- Add GSAP — Motion One + vanilla is enough for the deltas above
- Add Lottie / Rive — needs source artwork we don't have
- Rebuild the FAB chrome from scratch — the byte-identical promise applies

## Bundle budget for alpha.30

Hard cap: `+2 kB JS gzip` over alpha.29 (78.96 kB → 80.96 kB).
Hard cap: `+1 kB CSS gzip` over alpha.29 (9.18 → 10.18 kB).
Webfont CDN allowance: 0 (we already pay it; self-hosting is optional optimisation).
