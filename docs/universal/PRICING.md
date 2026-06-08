# Pulse — pricing & business model decision

**Status:** locked at v3.0.0-rc.0 as **MIT core + future optional Pro pack**. This file documents the decision so any future contributor (or the maintainer's future self) knows what's open vs settled.

## TL;DR

| Tier                                                                                         | Price                              | Status today            | When                                     |
| -------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------- | ---------------------------------------- |
| **Pulse Core** (all 7 `@pulse-music/*` packages + `pulse-player` Vue reference)              | **Free** under MIT                 | ✅ Shipped on npm       | Now                                      |
| **Pulse Premium Themes Pack** (10-20 additional curated variants + brand-customisation tool) | **$49 one-time** via Lemon Squeezy | 🚫 Not built            | Phase 2 — gated on adoption metrics      |
| **Pulse Studio** (hosted theme builder SaaS)                                                 | **$9-19 / month**                  | 🚫 Not built            | Phase 3 — only if Phase 2 signals demand |
| **Consulting** (custom variants, brand integration, analytics wiring)                        | **$1 000-5 000 per engagement**    | ✅ Available on request | Opportunistic, post-adoption             |

## Why this model

The 2026 component-library landscape gives 5 reference points (sources verified during the alpha.18 audit + alpha.24 brutal product audit):

- **[shadcn/ui](https://ui.shadcn.com/)** — MIT, ~104 000 stars, copy-paste model. Monetises via the author's broader brand / consulting / courses. No paid tier in the library itself.
- **[Radix UI](https://www.radix-ui.com/)** — MIT. Parent company Workos monetises via their identity product.
- **[Headless UI](https://headlessui.com/)** — MIT, built by Tailwind Labs. Monetises via Tailwind UI ($299 one-time) — a separate paid product built ON TOP of the MIT primitives.
- **[MUI X](https://mui.com/x/introduction/licensing/)** — open-core: free MIT core + $180/dev/yr Pro tier + $588/dev/yr Premium tier. The closest precedent for an indie commercialisation path.
- **[Vidstack Player](https://github.com/vidstack/player)** — closest direct competitor architecturally (multi-framework wrappers + shared engine). 22 800 npm dl/week. NOT YET monetised after 4+ years.

Pulse is currently at **0 stars / 0 weekly downloads / 0 production users** — a 2-day-old project. Switching to a more restrictive licence preemptively (BSL, proprietary, paid-only) kills the adoption phase that creates the future paying customer pool. The model above mirrors Tailwind / MUI / shadcn at the right scale for Pulse's actual stage.

## Phase 1 (now — until 1 000+ stars / 5 000+ npm dl per week)

- **Licence:** MIT, no restriction.
- **Distribution:** 7 `@pulse-music/*` packages publicly on the npm registry. Repo public on GitHub. Live demo on GitHub Pages. YouTube walkthrough.
- **Revenue:** none expected. [GitHub Sponsors](https://github.com/sponsors/YamadaBlog) accepts donations — typical indie OSS sponsorship signal ranges from $50 to $300/month for a project at this scale. Configured in [`.github/FUNDING.yml`](../../.github/FUNDING.yml).
- **Goal:** adoption + early-adopter feedback to inform the v3.0.0 stable cut.

## Phase 2 (post 1 000 stars + 5 000 dl/week — ~6 to 12 months)

Triggered only when the metrics in [`METRICS_TRACKING.md`](./METRICS_TRACKING.md) clear the Day-90 target.

- **Pulse Premium Themes Pack:** 10-20 additional curated variants beyond the 9 free baseline + a brand-customisation tool that emits the matching CSS variable overrides + a JSON theme config a consumer can import. Sold via [Lemon Squeezy](https://www.lemonsqueezy.com/) (5 % + $0.50 per transaction; handles VAT compliance globally) for **$49 one-time, lifetime updates** within the major version. Mirrors the [Tailwind UI](https://tailwindcss.com/plus) pricing posture.
- **Consulting:** B2B engagements for custom brand-aligned variants, analytics integration, DRM playback workflows. **$1 000 — $5 000 per engagement**, billed half upfront / half on delivery. Marketing: "Used by" section on the README + a short page on the maintainer's personal site.
- **Revenue projection:** if 100 packs/year × $49 = $4 900/year + 2-4 consulting engagements/year = $2 000-20 000/year. Realistic for an indie maintainer; not life-changing but proof of demand.

## Phase 3 (only if Phase 2 metrics signal demand — ~12 to 24 months)

- **Pulse Studio:** hosted theme builder web app. Customer tunes a variant interactively, gets the CSS variable overrides + JSON config back, can save up to N themes per account. **$9 / month (single user)** or **$19 / month (team of 5)** via Lemon Squeezy subscriptions. Mirrors small SaaS indie pricing posture (see [Lemon Squeezy customer index](https://lemonsqueezy.com/customer-stories)).
- **Triggers needed:** ≥ $5 000/year from Phase 2 (proof of payment willingness), ≥ 5 000 stars (proof of brand recognition), maintainer has bandwidth to build + support a SaaS product.

## What is NOT for sale

- The core `@pulse-music/*` packages — they stay free under MIT, no time bomb, no licence change planned.
- The Vue v2.3.4 reference (`pulse-player`) — same.
- The documentation in `docs/` — same.
- The source code — same.

## What we won't do (with reasons)

- **Switch to a [Business Source License (BSL)](https://mariadb.com/bsl11/)** — kills the contributor / adoption signal that creates the future customer pool. Only justified if a specific SaaS competitor were re-selling Pulse at scale (the [HashiCorp / Terraform vs OpenTofu](https://opentofu.org/) scenario), which doesn't apply to a 2-day-old indie project.
- **Repo-private + paid-license** — guarantees 0 adoption. No customer can evaluate before buying.
- **Subscription-only on the core** — the indie OSS playbook (shadcn / Headless UI) shows the core has to be free to seed Phase 2 / Phase 3 demand.
- **Crypto / NFT / Web3 tie-ins** — the maintainer's stance.
- **Closed-source forks via private npm scope** — would split the audience without justification.

## Refund policy (for future Phase 2 paid products)

- **Premium Themes Pack:** 14-day no-questions-asked refund. The pack is digital + delivered immediately; the refund is a trust signal, not a business cost.
- **Consulting engagements:** governed by the individual contract; default = pay-on-delivery for the second half, so unhappy customers can simply not accept delivery without paying the back half.

## Trademark posture

Pulse / pulse-player are NOT registered trademarks yet. Filing via [USPTO](https://www.uspto.gov/trademarks) ($250-$350 per class) or [EUIPO](https://euipo.europa.eu) (~€850) becomes worth the cost once Phase 2 revenue justifies it (~$3 000+ in pack sales). Until then, brand protection is by recognition + GitHub history.

## Decision log

- **2026-06-08 (alpha.25)** — locked Phase 1 = MIT + Sponsors. Phase 2 = gated on adoption per `METRICS_TRACKING.md`. Phase 3 = gated on Phase 2 revenue. The maintainer can revisit if the brutal audit verdict changes (currently 0 stars / 0 dl ⇒ no commercial case).
