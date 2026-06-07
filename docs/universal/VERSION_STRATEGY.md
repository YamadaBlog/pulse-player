# Pulse — versioning strategy from alpha to stable

The brutal v3.0.0-alpha.18 product audit flagged a real concern: **41 git tags in 24 hours signals churn, not maturity, to external visitors**. A visitor lands on the repo, sees `v3.0.0-alpha.18` plus 41 sibling tags, and reads "this isn't ready". The technical work is solid; the cadence storytelling is broken.

This doc proposes the concrete path from where we are now (alpha.19, post-public + post-Pages) to a stable v3.0.0 + first npm publish, with explicit gates between each milestone.

## Current state (alpha.19, 2026-06-07)

- **41 git tags** (v1.0.0 through v3.0.0-alpha.19).
- **Public repo + live demo** (yamadablog.github.io/pulse-player/).
- **MIT linguist + 5 / 5 CI workflows green** including strict Axe-core a11y.
- **132 unit tests + 2 visual + 2 a11y CI strict**.
- **0 npm publishes** — the alpha tags live only in git.
- **Vue v2.3.4 byte-identical** across the entire alpha series.

The work since alpha.0 has produced a publishable artifact. We just haven't published it.

## Proposed timeline

### Step 1 — close the alpha series with v3.0.0-rc.0

**Trigger:** maintainer has 5 minutes + OTP to publish.

**Action:**

1. Run `bash scripts/publish-dry-run.sh` — verify all checks green.
2. Bump every `packages/*/package.json` from `0.0.0` to `3.0.0-rc.0` (single sed sweep).
3. Publish each `@pulse-music/*` package to npm with `npm publish --access=public`.
4. Tag the commit `v3.0.0-rc.0` and push.

**Gate:** `npm view @pulse-music/react version` returns `3.0.0-rc.0`.

**Why rc.0, not 1.0.0:** v1.0.0 implies an API freeze. We want a release candidate that signals "we believe this is stable, please use it, but we'll iterate on feedback before locking the API". This is the standard cadence (Vue 3 did rc.1 → rc.13 before 3.0.0 stable).

### Step 2 — collect early-adopter feedback (~4 weeks)

**Trigger:** Step 1 lands.

**Action:**

- Open a GitHub Discussion thread "rc.0 feedback wanted".
- Cross-post on r/vuejs, r/reactjs, r/sveltejs with the comparison table from [`COMPARISON.md`](./COMPARISON.md) prominent.
- Bluesky / dev.to launch with the YouTube demo link.
- React to every issue / PR within 48 h.

**Gate:** ≥ 5 external contributors (issues, PRs, or comments) AND ≥ 100 GitHub stars.

**Why 4 weeks:** that's the standard early-adopter window for a Show HN / Reddit launch to play out. Fewer than 5 external touches in 4 weeks would be a real signal — back off the cadence and let the product breathe.

### Step 3 — ship v3.0.0-rc.X patches as feedback warrants

**Trigger:** feedback identifies fixable bugs OR API improvements.

**Action:**

- Each patch ships as a fresh `v3.0.0-rc.X` tag + a fresh npm publish.
- Conservative cadence: **no more than one rc.X per week**. Encourages users to actually integrate before the next version drops.
- CHANGELOG entries become user-facing notes ("now you can…"), not maintainer-debug logs.

**Gate:** zero open critical bugs AND no API churn in 2 consecutive weeks → ready to cut stable.

### Step 4 — cut v3.0.0 stable

**Trigger:** Step 3 gate clears.

**Action:**

1. Rename `v3.0.0-rc.X` → `v3.0.0` in the npm tarball metadata.
2. Tag `v3.0.0` on the commit.
3. Bump `pulse-player` root package (Vue v2.3.4 reference) version to `3.0.0` as well, so the Vue lib becomes "pulse-player 3.0.0" alongside `@pulse-music/*`.
4. Publish a "v3.0.0 is out" blog post / dev.to article / YouTube announcement.
5. README "v3 is in alpha" banner removed.

**Gate:** at least one production consumer site uses Pulse and is willing to be named in a "Used by" section.

### Step 5 — minor + patch cadence after stable

**Standard SemVer.** No more daily alphas:

- **Patch** (3.0.X) — bug fixes only. Auto-publish via release-please as soon as a Conventional Commit `fix:` lands on main.
- **Minor** (3.X.0) — new features. Batched into monthly releases.
- **Major** (4.0.0) — breaking changes. Announced 8 weeks ahead, ships with a migration guide.

## What to do RIGHT NOW with the 41 alpha tags

Two honest options:

### Option ALPHA — keep them, frame the story

The 41 tags become part of the project's transparency story. They show the full alpha cycle from idea to publishable. Like Vue's 2014-2019 RC archive.

Action: add a `docs/universal/ALPHA_HISTORY.md` that lists every alpha tag with a one-line summary. The narrative becomes "Pulse went through 41 honest alphas across 24 hours of focused work — every CI gate, every fix, every retraction is in the open."

This is the recommended choice. It turns the cadence from a liability ("churn") into an asset ("transparency").

### Option BETA — squash + force-push to a clean history

Cosmetic clean. Not recommended:

- Costs SEO (every alpha tag's deep link breaks).
- Costs trust (force-pushing to a public repo's history is a red flag).
- Costs the chronological narrative that makes the project's audit cycle legible.

The maintainer is the only one who can authorise this if they really want it. **Default to Option ALPHA + the history doc.**

## The big anti-pattern to avoid

**Do not ship v3.0.0-alpha.N for N > 25 without a publish in between.** Every alpha after the first publish-ready commit just adds churn signal without adding visible value. As of alpha.19, we should be in publish prep, not in alpha development.

Concretely: the next git tag after this one should be `v3.0.0-rc.0` paired with the first `npm publish`. **Not** `v3.0.0-alpha.20`.

## Open questions for the maintainer

1. **When can you sit down with the npm OTP for 5 minutes?** That's the trigger for Step 1.
2. **Are you OK with rc.0 → rc.X → stable cadence, or do you prefer alpha.20 → alpha.30 → stable?** The rc path is more standard; the alpha path is more conservative.
3. **Are you OK with Option ALPHA for the existing tags, or do you want them squashed?** Recommended: keep them.

Once those three answer, this doc gets the answers stamped on it and the version strategy is closed.
