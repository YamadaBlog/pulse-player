# Pulse — Licensing strategy

## Current licence

**MIT** — see [`LICENSE`](../../LICENSE) at the repo root.

Copyright © 2026 YamadaBlog (pulse-player authors).

## Why MIT (and not a commercial or source-available licence)

The MIT licence is the dominant pattern for UI component libraries in 2025-2026, and for a strong reason: it removes every friction point a downstream consumer might hit before adopting your component. Pulse is a small drop-in audio player — adoption is the win condition. Restrictive licences ([Business Source License](https://mariadb.com/bsl11/), [Polyform](https://polyformproject.org/), [Elastic License](https://www.elastic.co/licensing/elastic-license)) protect against a specific failure mode (a hyperscaler reselling your work), which is not Pulse's threat model.

Reference points from the 2026 React component-library landscape:

- **[shadcn/ui](https://ui.shadcn.com/)** — MIT, 106 K+ GitHub stars, 250 K+ weekly npm downloads. The fastest-growing component library. Monetises via the author's broader brand (Vercel design role, consulting, courses).
- **[Radix UI](https://www.radix-ui.com/)** — MIT, used as the primitive under shadcn. Built and maintained by Modulz / Workos. Monetised via the parent company's product (not the library).
- **[Headless UI](https://headlessui.com/)** — MIT, built by Tailwind Labs. Monetises via Tailwind UI ($299 one-time, paid product kit BUILT on top of the OSS).
- **[Ant Design](https://ant.design/)** — MIT, ~94 K stars. Premium templates available separately.
- **[MUI X](https://mui.com/x/introduction/licensing/)** — open-core. Free MIT core + Pro ($180/dev/yr) + Premium ($588/dev/yr) for advanced features. Closest precedent for an indie commercialisation path.
- **[Lit](https://lit.dev/)** — BSD-3, used as Pulse's Web Component runtime. Maintained by Google's Open Web Platform team.

The MIT pattern wins on adoption every time. The only libraries that successfully monetise core components (MUI X) had years of free distribution + a dedicated team before introducing a paid tier.

## How Pulse monetises (if and when the maintainer chooses)

The MIT licence does NOT preclude commercial revenue. Common patterns, ordered by indie-developer friendliness:

### 1. GitHub Sponsors (no extra infrastructure)

A `.github/FUNDING.yml` file surfaces a **Sponsor** button on the repo home + every release page. Sponsors pay $1 — $1000/month for various tiers, GitHub takes 0 % from individual sponsorships. Documented and active in this repo (see [`.github/FUNDING.yml`](../../.github/FUNDING.yml)).

### 2. Premium themes / extensions sold separately

Pulse ships 9 base variants (`auto`, `transparent`, `solid`, `dark`, `light`, `sunset`, `midnight`, `aurora`, `vinyl`). A **Pulse Premium** add-on could ship 20 + additional curated variants, motion presets, and brand-customisation tools as a one-time purchase (Lemon Squeezy, Gumroad). The OSS core stays MIT, the premium pack is sold under a proprietary EULA.

### 3. Consulting / sponsored development

Companies that adopt Pulse can pay the maintainer to:

- Build a custom variant matching their brand
- Implement bespoke features (analytics integration, DRM playback, region-restricted streams)
- Provide enterprise-grade SLA support

This is the model MUI X used to bootstrap before introducing Pro tiers.

### 4. Hosted demo / playground (free tier + Pro)

A hosted Pulse playground (e.g. Stackblitz / CodeSandbox embed) could be a free OSS marketing surface; a Pro tier with persistent saved configs, brand-customised themes, and export-to-React/Vue/Svelte snippets could be sold via the same routes as above.

## What MIT does NOT protect against

Be honest about what MIT means for the consumer:

- **Anyone can fork the repo, rename it, and ship their own version.** This is allowed. The mitigation is brand recognition (commit history, documentation, tests, demo polish) — not licence text.
- **Anyone can publish a competing npm package using Pulse's source.** They must preserve the MIT copyright notice; if they strip it, they're in breach. The practical recourse is a DMCA takedown to npm + GitHub, which the maintainer can file.
- **A SaaS company can build a product on top of Pulse without paying.** This is allowed. It's also unlikely — Pulse is small enough that integrating it is cheaper than reselling it.

## When to revisit the licence

Switch to a non-MIT licence (Polyform Strict, BSL, EULA) **only if**:

1. A specific commercial use case (eg a SaaS hyperscaler reselling Pulse as a product feature) becomes a real revenue threat
2. Or the maintainer decides to go full-commercial with a dedicated team and Pro tier (closer to the MUI X path)

Both are revenue-side decisions that should be driven by actual signal, not preemptive paranoia. The default for now is **MIT + GitHub Sponsors + optional Premium themes**.

## Asset licensing (NOTICE.md)

Audio + cover assets ship as **demo placeholders** under explicit attribution in [`NOTICE.md`](../../NOTICE.md). Anyone redistributing Pulse must replace them. The MIT licence covers the source code, **not** the audio / images bundled under `public/`.

## Trademark notes

- **GitHub Octocat icon** — used in the `<pulse-player>` chrome (rendered when `github-url` is set). The silhouette is allowed for developer integrations per [GitHub's logo guidelines](https://github.com/logos). The icon renders only when a `github-url` link is provided.
- **Streaming-provider link** — the `spotify-url` prop activates a **generic music-note streaming icon**, NOT the Spotify mark, to avoid trademark exposure. Consumers can link to Spotify, Apple Music, YouTube Music, Tidal, Deezer, or any other provider via the same prop. See [`docs/universal/API.md`](./API.md) for the renaming history.

## Summary

| Aspect                | Decision                                                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Licence               | **MIT**                                                                                                                                                               |
| Revenue model         | Sponsorship (GitHub Sponsors) + optional Premium themes (future) + consulting                                                                                         |
| Asset licensing       | Demo placeholders documented in NOTICE.md, must be replaced before redistribution                                                                                     |
| Trademark exposure    | GitHub: allowed (per GitHub logos policy). Streaming: generic icon, no exposure.                                                                                      |
| Commercial use        | Allowed                                                                                                                                                               |
| Fork allowed          | Yes (MIT)                                                                                                                                                             |
| Trade name protection | The "pulse-player" name is not trademark-registered; the maintainer can do so via WIPO / EUIPO / USPTO if and when commercial scale justifies the ~$300 — $1000 cost. |
