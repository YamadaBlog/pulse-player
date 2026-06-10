# Pulse Player — premium-demo workflow

Tooling chain installed in `.claude/skills/` and exercised in alpha.30.

## Installed skills (from real sources)

| Skill | Source | Used for |
| --- | --- | --- |
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Anthropic official) | Anti-slop guardrails for every visual decision |
| `brand-guidelines` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/brand-guidelines) | Reference for the brand-token discipline (palette / typography pairing) |
| `theme-factory` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/theme-factory) | Reference for theme cohesion when iterating Pulse's 9 variants |
| `design-taste-frontend` (= taste-skill v2) | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Brief inference + three-dial sizing + anti-default discipline |
| `redesign-audit` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill/tree/main/skills/redesign-skill) | Step-by-step audit protocol for the alpha.29 demo before changing it |
| `minimalist-aesthetic` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill/tree/main/skills/minimalist-skill) | Restraint pole reference (offset to `frontend-design`'s maximalist pole) |

## The applied workflow

### Step 1 — Brief inference (taste-skill 0.A)

> **Design Read:** Pulse is a **component-library product showcase** for **developers + design-engineers**, with an **editorial / restrained-premium** language, leaning toward **dark canvas + Geist Variable + warm tertiary accents + audio-reactive ambient motion**. Audience expects Linear-clean + Awwwards-experimental in equal measure. NOT a SaaS dashboard, NOT a consumer landing.

### Step 2 — Three dials (taste-skill 1)

| Dial | Value | Implication |
| --- | --- | --- |
| AESTHETIC_INTENSITY | **6/10** — restrained-premium | No maximalist chaos. No brutalist raw. Editorial polish. |
| MOTION_INTENSITY | **7/10** — choreographed | Every motion has a stated reason. No infinite-loop micro-animations. |
| DENSITY | **4/10** — generous white-space | Apple-page rhythm, not Bento-grid maximalism. |

### Step 3 — Anti-slop checks (frontend-design)

Run **before** any new code lands:

- [x] No Inter / Roboto / system-only stacks → Geist Variable + Geist Mono ✅ (since alpha.29)
- [x] No `#8B5CF6 → #3DBDA7` AI-purple-teal gradient as the only accent → amber + pink + cyan tertiaries ✅
- [x] No centered hero on dark mesh → asymmetric staircase "Why Pulse" + flush-left ✅
- [ ] **PENDING alpha.30**: No three equal feature cards → break the "Why Pulse" cols
- [ ] **PENDING alpha.30**: No generic glassmorphism on everything → apply Apple Liquid Glass only on the floating FAB context
- [ ] **PENDING alpha.30**: No infinite micro-loops → audit the existing particle field + orbit field

### Step 4 — Redesign-audit (taste-skill redesign-skill)

> Audit alpha.29 before touching it. Identify what works, what doesn't, what to keep. See `docs/setup/ALPHA_30_AUDIT.md` for the per-section verdict.

### Step 5 — Implementation

Apply the deltas the audit named. Validate via build / lint / type-check / 139 tests / size budget.

### Step 6 — Post-flight check

Re-run anti-slop checklist. Diff bundle size. Verify `src/lib/` byte-identical. Verify `@pulse-music/*` tarballs unchanged.

## Why these skills and not others

- **No `frontend-design` competing skills** — Anthropic's official is the gold standard; everything else either copies it or adds rules that conflict with the existing design system.
- **`taste-skill` was picked over `UI-UX-Pro-Max-Skill`** ($paid, generic 67-style catalogue) because Leon's taste-skill is open-source + free + auditable + the only one with a **brief-inference-first** discipline.
- **`canvas-design` and `algorithmic-art` skills** are installed in `/tmp/anthropic-skills/skills/` but NOT copied to `.claude/skills/` because their scope is poster / static artwork, not product demos.
- **AI design-to-code tools** (v0.dev, Lovable, Bolt, Stitch) are deliberately NOT used because Pulse is Vue 3 — these tools generate React + Tailwind + shadcn only. The `frontend-design` skill IS framework-agnostic — that's the better fit.

## What the workflow forbids

- "Just add a motion library" without a stated purpose
- "Just install another skill" without checking what it actually says
- "Just make it look like Apple" without three-dial-sized restraint
- "Just ship the alpha" without the post-flight checklist
