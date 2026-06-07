# Protection — what MIT actually means, and what to do if you want more

Every CTO audit on Pulse since alpha.10 has flagged "Protection contre la copie: 5/10 (MIT par design)" as a permanent ceiling. This document explains why the ceiling is real, why **trying to fix it inside Pulse would be the wrong move**, and the few practical mitigations that do work.

## The honest baseline

A front-end component library distributed as JavaScript is **fundamentally copyable**. Once the bundle reaches a browser, every byte of the rendered chrome is visible in DevTools. Anyone can:

1. Right-click → View Source on the live demo.
2. `npm install` and read `node_modules/@pulse/*/dist/index.js`.
3. Clone the public MIT-licensed GitHub repo.
4. Copy any subset of the code into their own project and rename it.

None of these is preventable. The MIT licence ALLOWS most of them. Other permissive licences (BSD, ISC, Apache 2.0) allow the same. Even **source-available** licences (BSL, Polyform Strict, Elastic License 2.0) don't physically prevent copy — they just give the copyright holder a legal cause of action if someone uses the code commercially.

**Reality check:** the same is true for Tailwind UI ($299 paid kit, but the rendered HTML is in every site that uses it), MUI X Pro ($180/dev/year, but the JS bundle is on every dashboard), Headless UI, Radix, every premium component product that ships JavaScript. The fact that someone _could_ copy doesn't stop them from being commercially viable.

## What MIT actually allows

A consumer who installs `@pulse/react` MIT may:

- Use it in a commercial product ✅
- Modify the source freely ✅
- Re-publish a fork under a different name ✅
- Bundle it into a SaaS that they charge for ✅
- Strip the copyright notice ❌ (MIT requires it stays)
- Claim Pulse endorses their product ❌ (trademark / publicity rights)
- Claim _they wrote it_ ❌ (copyright fraud, separate from licence)

The mandatory copyright-notice clause is the lever. It's not strong, but it's not nothing — if someone publishes `@super-music-player/react` and the README is a copy-paste of Pulse's README with the YamadaBlog copyright stripped, you can file:

1. **GitHub DMCA takedown:** https://github.com/contact/dmca-takedown
2. **npm takedown:** https://docs.npmjs.com/policies/dmca
3. **Web host DMCA** (Cloudflare, Vercel, Netlify all process them).

Average DMCA process: 2-7 days, no lawyer needed for the first round.

## What MIT does NOT prevent

- A competitor copies the chrome design, rewrites it from scratch under their own copyright. **Legal under any licence.** The only protection is trademark on the name "Pulse" (file via USPTO ~$350 or EUIPO ~€850 if commercial scale justifies it) plus the brand recognition of the original.
- A SaaS embeds `@pulse/*` in their product and charges customers. **Allowed under MIT.** If you want to prevent this, switch to BSL (Business Source License) with a 4-year grant-of-rights horizon — but BSL also kills 90 % of contributor interest, so be sure the commercial revenue justifies the adoption hit.
- Someone bundles Pulse + their own branding into a paid Figma plugin or design-system kit. **Allowed.** Again, only trademark protects the name.

## Practical mitigations that don't compromise OSS adoption

These are the moves that actually work for an indie-maintained OSS component:

### 1. Brand the experience, not the code

The hardest thing to copy is the brand:

- The YouTube walkthrough (3 minutes of curated motion) is **YOUR** content. A copier can't re-record your screen capture without re-recording from scratch.
- The README's storytelling, the colour palette, the variant names — all subject to your taste. Copiers either copy them (and look like a cheap clone) or replace them (and lose the polish).
- The GitHub stars / contributors / issues history. Brand-new forks start at 0. Pulse already has 40 tags + a full alpha-cycle history.

### 2. Maintain an honest changelog + roadmap

A maintainer who ships v3.0.0-alpha.17 with a documented audit cycle and BLOCKERS.md tracking is harder to displace than a maintainer who ships v1.0 and walks away. Consumers know the difference. A fork can copy the code but not the future-cadence signal.

### 3. Build adjacent paid products

Most permissive-licensed UI products monetise via the **adjacent moat**, not the licence:

- **Tailwind:** core MIT, monetisation via Tailwind UI (paid component kits + templates).
- **MUI:** core MIT, monetisation via MUI X Pro / Premium (advanced data grid, etc.).
- **Radix:** core MIT, parent company monetises via Workos identity product.
- **shadcn:** core MIT, monetisation via the author's broader brand + design consulting.

For Pulse, the parallels would be:

- **Pulse Premium themes** — pack of 20 new variants + brand-customisation tooling, sold as a one-time purchase via Gumroad / Lemon Squeezy.
- **Pulse Studio** — hosted brand-the-player web app: customers tune a variant in-browser, get the CSS variable overrides + JSON config back, pay a one-time fee. Backed by the same `@pulse/tokens` API.
- **White-glove integration consulting** — companies that adopt Pulse pay you to build their custom variant + analytics integration + DRM playback. This is how MUI X bootstrapped before introducing paid tiers.

Each of these is YOUR proprietary product, not MIT. The core stays free, the value-add tier is closed-source.

### 4. Register the trademark on "Pulse" / "pulse-player"

If commercial-scale revenue is on the table:

- **USPTO trademark application:** ~$250-$350 per class, online filing at https://www.uspto.gov/trademarks. Class 9 (software) is the standard.
- **EUIPO trademark:** ~€850 for the EU bloc, online at https://euipo.europa.eu.
- **WIPO Madrid System:** lets you file once and propagate to multiple countries.

The trademark prevents someone publishing `@pulse-better/*` or `pulse-pro` on npm. Doesn't prevent copying the code, but prevents brand confusion.

### 5. Watermark the demo asset, NOT the library code

If you ship demo audio + cover art with Pulse, **watermark those** (e.g., faint metadata tag in the WebM container, or an EXIF comment in the WebP). Then if someone redistributes the demo wholesale, the watermark proves origin in the DMCA filing. This is invisible to legitimate users (who'd replace the placeholders via `npm run setup:demo-audio` anyway, see [NOTICE.md](../../NOTICE.md) §3).

Don't watermark the library JavaScript itself — that's user-hostile (consumers running diff on the bundle would see the noise) and easily removed.

### 6. Track usage if and when you can

OSS analytics ethics are real — don't ship phone-home telemetry without an opt-in. But you can:

- Watch npm download counts via https://npmjs.com/package/@pulse/react (public).
- Watch GitHub clone / view counts via repo Insights tab (maintainer-only).
- Use https://npmtrends.com/ to compare against competitors.

These don't tell you _who_ is using Pulse, but they tell you _how much_. Enough signal to know when to raise prices on the paid tier.

## Decision matrix — which path to pick

| Goal                                                    | Licence choice                                       | Mitigation focus                                                              |
| ------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| Maximise adoption + reputation, monetise via consulting | **MIT** (status quo)                                 | Brand recognition + open changelog + adjacent paid products                   |
| Prevent SaaS resellers from cannibalising you           | **BSL** with 4-year MIT grant                        | Switch when you have signal of actual SaaS cannibalisation, not preemptively  |
| Run a Pulse Pro tier with paid features                 | **MIT core + proprietary Pro tier in separate repo** | Like MUI X Pro — keep both repos public, Pro repo gated behind a paid licence |
| Sell ONE-time enterprise licences                       | **MIT core + paid Enterprise EULA**                  | EULA covers support + SLA + private bug fixes, code stays MIT                 |
| Truly closed-source                                     | **Proprietary EULA, private repo, no public source** | Smallest reach but maximal control                                            |

For Pulse today, the recommendation is **stay MIT, build adjacent paid products when usage signals justify it**. Switching to a more restrictive licence preemptively kills the adoption phase that creates the customer pool for the paid products.

## Bottom line

**5/10 on the protection-vs-copy axis is the right ceiling for an MIT-licensed front-end component.** Trying to push that to 10/10 means trading away the adoption that makes OSS components viable. The audit grade of 5/10 isn't a problem to fix — it's a tradeoff accepted on purpose.

The note in CHANGELOG / future audits should read: "Protection: 5/10 — by design, see PROTECTION_NOTES.md". That makes it an informed choice instead of a gap.
