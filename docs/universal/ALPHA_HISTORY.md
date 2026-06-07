# Pulse v3 alpha series — condensed history

The v3.0.0-alpha.\* lineage spans 20 tags shipped over a focused 24-hour audit-driven cycle (2026-06-06 to 2026-06-07). Each alpha is a small, reviewable step against the published CTO audit critique loop. This page is the **one-paragraph-per-alpha** summary so a visitor doesn't have to scroll the full 1500-line CHANGELOG to get the narrative.

The full per-alpha breakdown stays in [`CHANGELOG.md`](../../CHANGELOG.md) for anyone who wants the granular log.

## TL;DR

- Vue v2.3.4 reference `src/lib/` is **bit-for-bit identical** across every alpha (verified each push).
- 20 alphas → 0 functional regressions on the validated Vue surface.
- 6 packages produced + tested (Vue, React, Svelte, Web Components, Angular, RN-types-only).
- 132 unit tests + 2 visual + 2 a11y CI all green by end of series.
- Repo went from PRIVATE → PUBLIC with a clean pre-public security audit.
- GitHub Pages live at https://yamadablog.github.io/pulse-player/
- YouTube walkthrough at https://youtu.be/q_FJ1GWaCc8

## One paragraph per alpha

### v3.0.0-alpha.0 — 2026-06-06

**Monorepo foundation.** npm workspaces + `packages/{types,core,tokens,web-component,react,svelte,angular,react-native,vue}` scaffolding. Universal docs structure laid out. Vue v2.3.4 declared the canonical reference; every alpha that follows preserves it byte-identical.

### alpha.1

**`@pulse/core` + `@pulse/tokens`.** Audio engine extracted from the Vue store as a plain TypeScript class (framework-agnostic). Variant gradients + base CSS extracted as `@pulse/tokens` — single source of truth consumed by Lit / Vue / React.

### alpha.2 - alpha.3

**`@pulse/web-component` (Lit) + `@pulse/react` + `@pulse/svelte`.** First runnable multi-framework wrappers. 9 Lit element tests prove the chrome renders identically across frameworks. README universal table introduced.

### alpha.4 - alpha.6

**Docs honesty + tsup builds + test-utils + useDomEvent DRY.** Removed 4 duplicated `setup.ts` files into shared `@pulse/test-utils`. 8 React `useEffect` blocks collapsed into one-liners via `useDomEvent` hook. CI matrix (Node 18 / 20 / 22) introduced. Tests reach 85 / 85.

### alpha.7 - alpha.9

**Chrome parity push.** `@pulse/web-component` gains 3 responsive states (220 / 130 / 110 px), ambient EQ, pulso heartbeat, data-fab morph, `mp__bg` blur backdrop, `mp__noise` overlay, drag-resize handle, FAB drag-to-reposition with localStorage. Visual regression CI (Playwright) introduced. `@pulse/angular` lands. `@pulse/vue` soft re-export ships. Tests reach 108 / 108.

### alpha.10 - alpha.11

**Real SVG icons + keybindings + tests for tokens / Angular / RN.** GitHub Octocat + generic streaming icon (trademark-safe per Spotify brand guidelines). Keyboard shortcuts Space / K / J / L / ← / →. `@pulse/tokens` gets 11 contract tests. `@pulse/angular` gets 5 smoke tests. `@pulse/react-native` gets 10 interface-only tests (renderer deferred to RN sprint). Tests reach 134 / 134. `docs/universal/API.md` + `FEATURE_MATRIX.md` ship.

### alpha.12

**Security hardening + MIT licensing + sandboxes + a11y CI + size-limit + menu nav.** SECURITY.md, Dependabot config (9 ecosystem groups), `.gitignore` expanded. `LICENSING.md` + `FUNDING.yml` (GitHub Sponsors). Stackblitz / CodeSandbox link templates. Axe-core CI workflow (informational). `.size-limit.json` budgets per package. WAI-ARIA Menu Button nav added to `<pulse-fab>` (Escape + Arrow Down/Up). `docs/README.md` index doc.

### alpha.13

**GitHub topics + multi-framework description + release-please + coverage + CC0 audio docs + WC icons split.** Repo description rewritten to reflect the multi-framework reality. 13 topics added. `release-please.yml` + `coverage.yml` workflows. `scripts/setup-demo-audio.sh` for one-command CC0 replacement of placeholders. `@pulse/web-component/src/icons.ts` extracted (PulsePlayer.ts went 480 → 462 LOC).

### alpha.14

**CI recovery.** The previous CTO audit caught what 3 prior audits missed: **CI was red** since alpha.12 because 15 docs files committed with CRLF line endings failed `prettier --check` on Linux CI runners. Fix: `npm run format` + `.gitattributes` (declares `* text=auto` plus explicit `eol=lf` for every text extension). 11 open Dependabot PRs triaged (2 merged, 9 majors closed with reasons). LICENSE made canonical MIT (was classified as 'Other' until the trailing NOTE: paragraph got moved to NOTICE.md). `pages.yml` switched to `workflow_dispatch` only (was failing on every push due to private-repo + Free plan combo).

### alpha.15

**YouTube hero + size-limit CI + CC0 audio script + GIF guide.** README hero replaced by the clickable [YouTube thumbnail](https://youtu.be/q_FJ1GWaCc8). Framework parity table corrected from "~30 %" (stale since alpha.4) to "~95 %". `size-limit` actually wired into CI as a step (was config-only since alpha.12). `scripts/setup-demo-audio.sh` documented as `npm run setup:demo-audio`. `docs/universal/GIF_GUIDE.md` for the case where a GIF beats YouTube (npm package READMEs).

### alpha.16

**Repo PUBLIC + GitHub Pages live + a11y strict attempted.** Pre-public security audit ran clean (0 secrets, 0 .env, 0 binaries in history). Repo flipped PRIVATE → PUBLIC. GitHub Pages activated on free tier at https://yamadablog.github.io/pulse-player/. Release-please PR #13 closed (proposed wrong-version bumps). A11y strict-mode promotion attempted, immediately reverted when CI revealed 2 real failures hidden by `continue-on-error` since alpha.12.

### alpha.17

**A11y triage closed.** Root cause of the 2 failures: `--pg-text-low: rgba(255, 255, 255, 0.45)` rendering at #767678 against #05050a gave contrast 4.48 (WCAG 2.1 AA needs 4.5). Bumped to 0.55 → contrast ~5.1. One-line CSS fix in `src/App.vue` (the demo, NOT the library — `src/lib/` stays byte-identical). A11y strict gate restored. `cross-env PULSE_A11Y=1` for Windows shell compatibility.

### alpha.18

**Plans for the 4 remaining external-blocked gaps.** `scripts/publish-dry-run.sh` + `PUBLISH_CHECKLIST.md` (5-min OTP procedure). `REACT_NATIVE_RUNTIME_SETUP.md` (1-week sprint playbook). `SCREEN_READER_TEST_PLAN.md` (6 OS × SR × browser combinations, 10 scenarios). `PROTECTION_NOTES.md` (reframes "5/10 protection vs copy" from "gap to fix" to "informed tradeoff per the OSS playbook").

### alpha.19

**Sellable repo prep.** `COMPARISON.md` honest table vs Plyr (~30 K stars) / Howler (~25 K) / WaveSurfer / Vidstack / react-player / vue-plyr. 5 production-framework integration snippets (`examples/integrations/{next-app-router,nuxt,sveltekit,astro,vanilla-cdn}.md`). `RENAMING_DECISION.md` (3 options for the naming question pre-publish). `VERSION_STRATEGY.md` (alpha → rc → stable cadence plan). README sweep with the new sections + 12-doc reference paragraph.

## What's next (post-alpha.19)

The series closes with this `ALPHA_HISTORY.md` entry. The next tag should be `v3.0.0-rc.0` paired with the first `npm publish @pulse/*` — see [`VERSION_STRATEGY.md`](./VERSION_STRATEGY.md) for the rc → stable cadence + [`PUBLISH_CHECKLIST.md`](./PUBLISH_CHECKLIST.md) for the 5-minute OTP procedure.

## Why this page exists

The brutal alpha.18 product audit flagged that **41 git tags in 24 hours signals churn, not maturity, to external visitors**. This page (introduced in alpha.20) turns that liability into an asset: a visitor lands here, gets the full narrative in 2 minutes, and sees an honest audit-driven cycle that ended in a publishable rc rather than another patch.

The alternative — squashing the tags + force-pushing — would have cost SEO + trust + the chronological auditability that makes the project's behaviour legible. Keeping the tags + writing this summary is the more professional move.
