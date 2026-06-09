# alpha.29 — research sources and applied principles

The previous alphas (.27 + .28) were informed by web searches focused on **libraries** (Motion.dev, Lenis, Three.js). The user correctly called that out — the real direction lives in the **AI skills / agents / tools** ecosystem that has emerged in 2026. This doc traces the alpha.29 work back to that second-round research.

## Sources consulted (alpha.29 round)

### Anthropic official skills

- **[`anthropic/skills/frontend-design`](https://github.com/anthropics/skills/tree/main/frontend-design)** — last updated Feb 2026. The skill's internal instructions explicitly fight "generic AI slop aesthetics" with rules against:
  - fonts overused by AI (Inter, system stacks)
  - **generic purple gradients** (`#8B5CF6` → cool teal)
  - symmetric centered layouts
  - decorative animations without purpose
- **[Claude Code Skills marketplace](https://code.claude.com/docs/en/skills)** — discoverable via `claudemarketplaces.com` and `mcpmarket.com/tools/skills`. Listed for future installation when the maintainer is ready.

### Community skills

- **[`Leonxlnx/taste-skill`](https://github.com/leonxlnx/taste-skill)** v2 — "stops the AI from generating boring, generic slop". 11 specialised variants + 3-parameter equaliser. The naming convention alone is the philosophy. Adopted: every effect in `useAdvancedMotion.ts` has a stated purpose beyond "ooh, motion".
- **[UI UX Pro Max Skill](https://ui-ux-pro-max-skill.com/)** — 67 styles, 161 palettes, 57 font pairings. Paid; principles used freely.
- **[`travisvn/awesome-claude-skills`](https://github.com/travisvn/awesome-claude-skills)** 7.5K stars — discovery index, not directly installable here.

### AI design-to-code tools (positioning)

- **[v0.dev (Vercel)](https://v0.app/)** — React + Tailwind + shadcn only. Excellent for a future Pulse landing-page experiment, NOT for the Vue v2.3.4 reference (byte-identical pin).
- **[Lovable](https://lovable.dev/)** — high-end "lovable products" angle, Framer Motion focus. Discounted: Pulse is component library, not full-app product.
- **[Bolt.new](https://bolt.new/)** — multi-agent full-app generation. Same reason as Lovable.
- **[Google Stitch (ex-Galileo)](https://stitch.withgoogle.com/)** — visual exploration upstream of any code tool. Useful for the next round of theme palette ideation.
- **[Magic Patterns](https://magicpatterns.com/)** — multi-direction canvas for comparison. Bookmarked for the Phase 2 Premium Themes Pack ideation.

### Codrops 2026 patterns

- **[Codrops Jan 2026 — Scroll-driven dual-wave text](https://tympanus.net/codrops/2026/01/15/building-a-scroll-driven-dual-wave-text-animation-with-gsap/)** — implemented as `useScrollKineticWave` (pure vanilla port, no GSAP dependency added).
- **[Codrops May 2026 — Infinite scroll Lenis](https://tympanus.net/codrops/2026/05/28/the-never-ending-story-building-a-seamless-infinite-scroll-experience-with-gsap-lenis/)** — bookmarked for a future "every framework wrapper" infinite carousel section.
- **[Codrops June 2025 — 3D Audio Visualiser](https://tympanus.net/codrops/2025/06/18/coding-a-3d-audio-visualizer-with-three-js-gsap-web-audio-api/)** — already informed alpha.27 + alpha.28 ambient layer.

### Apple-style scroll-driven patterns

- **[Awwwards — Apple AirPods Pro scroll-triggered animation](https://www.awwwards.com/inspiration/product-scroll-triggered-animation-apple-airpods-pro)** — the canonical canvas image-sequence pattern. Simplified for Pulse as `useScrollProgress` (the 0..1 channel that drives `--scroll-progress` CSS custom property). The full 60-frame canvas flip is deferred to the dedicated landing page (would not maintainably live in the marketing demo).
- **[basementstudio/scrollytelling](https://github.com/basementstudio/scrollytelling)** — React + GSAP library. Inspired the "pinned sections" pattern; the alpha.29 implementation is vanilla Vue + IntersectionObserver.

## Anti-slop self-audit findings

Run on the alpha.28 codebase before alpha.29 changes:

| Anti-slop rule                            | Found in alpha.28                                       | Fixed in alpha.29                                                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Generic AI purple gradients overused**  | 8 occurrences (`#8B5CF6` + `rgba(139, 92, 246, …)`)     | Introduced `--accent-amber: #f59e0b` + `--accent-pink: #ec4899` palette tokens. Particle field switched from violet to amber. Orbit field uses 5-colour palette with warm tertiaries. |
| **System stack fonts only**               | All fonts `-apple-system / system-ui / sans-serif`      | Imported **Geist Variable** (display) + **Geist Mono** (code) from Google Fonts. Hero title uses Geist 800 with `letter-spacing: -0.025em`.                                           |
| **Symmetric centered layouts**            | 9 `justify-content: center` + 9 `text-align: center`    | New `.section--why` is `text-align: left` with `flush-left` heading + **asymmetric two-column staircase** (second column drops 120 px).                                               |
| **Decorative animations without purpose** | Particle field worked, but motivation was "more motion" | Each new composable in `useAdvancedMotion.ts` carries a one-line `Anti-slop note` JSDoc stating its purpose vs. pure motion.                                                          |

## New composables shipped in alpha.29

| Composable                                                   | Source                                                                  | Purpose                                                                                                                                                          |
| ------------------------------------------------------------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useScrollProgress(target)`                                  | Apple AirPods Pro pattern (simplified)                                  | Writes `--scroll-progress: 0..1` on target as CSS custom property. Foundation primitive other consumers compose on top of.                                       |
| `useScrollKineticWave(target, { amplitude, period })`        | Codrops Jan 2026 dual-wave pattern                                      | Splits text into chars, applies per-char `translateY` from sine + cosine combined waves driven by scroll progress.                                               |
| `useScrollOrbitField(target, { count, maxRadius, colours })` | Inspired by Codrops Solar Storm + composed for scroll-driven decoration | Renders N orbiting glowing orbs as decoration, radius + speed driven by scroll progress. Palette includes warm tertiaries (amber, pink) to break the AI default. |
| `useMagneticHover(target, { strength, damping })`            | Apple-style microinteraction (basementstudio pattern)                   | Element subtly leans toward the cursor within bounded zone. Max 8 px displacement (anti-toy discipline).                                                         |

## New section "Why Pulse"

A new `section.section--why` between the hero and the resize section:

- **Eyebrow** — Geist Mono 12 px amber `Story · 03`
- **Title** — Geist 700, `clamp(36px, 5.6vw, 80px)` flush-left, max 18 ch
- **Wave** — split per-char + kinetic dual-wave on scroll
- **Two columns** — staircase asymmetry (`why__col--offset translateY(120px)`)
- **Background** — orbit field of 5 coloured glowing orbs that drift in elliptical paths

## Quality gate

- Geist webfont loaded via Google Fonts with `display=swap` — FOUT acceptable
- All new composables `prefers-reduced-motion` guarded + `pointer: fine` where applicable
- Asymmetric two-column collapses to single column at < 720 px
- `@pulse-music/*` tarballs unchanged
- `src/lib/` byte-identical maintained

## Notable NON-actions

- **No GSAP added** — Codrops Jan 2026 wave port was achievable in vanilla. Motion One + Lenis already loaded.
- **No Theatre.js, no Rive, no Lottie** — would add weight without a discrete payoff for this section.
- **No Three.js** — saved for the future dedicated landing page (where the bundle cost is fine because that page has its own concern).
- **No v0.dev / Bolt / Lovable** — these are React-only or full-app generators. Pulse's Vue lib is not a fit.
- **No paid skills installed** — UI UX Pro Max + similar deferred until the maintainer wants to invest. Principles applied freely.
