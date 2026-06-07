# Pulse — npm publish checklist (maintainer)

This document is the step-by-step procedure for the **first ever `npm publish`** of the `@pulse-music/*` packages. It assumes the maintainer is YamadaBlog and has 2FA enabled on the npm account (the modern requirement for any new publish).

## Prerequisites (one-time setup)

- [ ] npm account at https://npmjs.com (YamadaBlog).
- [ ] 2FA enabled on the account (TOTP via authenticator app — Google Authenticator / Authy / 1Password).
- [ ] The `@pulse` npm organisation created and the YamadaBlog account is its owner. Create via https://npmjs.com/org/create if it doesn't exist yet.
- [ ] Local `npm login` succeeded — confirm with `npm whoami` returning `yamadablog`.

## Step 0 — Pre-publish dry run

From the repo root:

```bash
bash scripts/publish-dry-run.sh
```

This runs the full CI gate (type-check + lint + format + tests + builds + audit + size-limit) and then validates each package's tarball + metadata. Any failure aborts. **Do not proceed if the script reports any red.**

## Step 1 — Decide the version

The current `package.json` files in `packages/*` carry `version: "0.0.0"` as a placeholder. For the first publish, pick **one** version that every package will share — same major+minor cohesion is the pattern (MUI X, shadcn, Radix all use this).

Recommended for the first publish: **`3.0.0-rc.0`** (release candidate matching the v3.0.0-alpha.\* lineage we've been shipping under tags).

If you'd rather start more conservatively, **`0.1.0`** is fine — it tells consumers "early stage, may break" and gives room to iterate before committing to a 1.0.0 stable API.

## Step 2 — Bump versions in every publishable package

```bash
# From repo root — bumps every @pulse-music/* package in one go
for pkg in types core tokens web-component react svelte; do
  cd "packages/$pkg"
  npm version 3.0.0-rc.0 --no-git-tag-version
  cd ../..
done
```

Workspace `*` dependencies (e.g. `@pulse-music/core: "*"` in `@pulse-music/web-component`) will be resolved at publish time to the actual version we're publishing. npm handles this automatically via the `workspaces` field — no manual edit needed.

## Step 3 — Publish in dependency order

The packages have a DAG: `types` has no dependencies, `core` and `tokens` depend only on `types`, `web-component` depends on `core` and `tokens`, `react` and `svelte` depend on `web-component`. Publish in topological order so each downstream `npm publish` finds its upstream already on the registry.

```bash
# 1. Types (no deps) — first
cd packages/types && npm publish --access=public && cd ../..

# 2. Core + tokens (only depend on types)
cd packages/core && npm publish --access=public && cd ../..
cd packages/tokens && npm publish --access=public && cd ../..

# 3. Web-component (depends on core + tokens)
cd packages/web-component && npm publish --access=public && cd ../..

# 4. React + Svelte (depend on web-component)
cd packages/react && npm publish --access=public && cd ../..
cd packages/svelte && npm publish --access=public && cd ../..
```

Each `npm publish` will prompt:

```
This operation requires a one-time password.
Enter OTP: __ __ __ __ __ __
```

Type the 6-digit code from your authenticator app. The code refreshes every 30 seconds — if it's about to roll over, wait for the next one.

Total time once you're at the keyboard: ~5 minutes, mostly typing OTPs.

## Step 4 — Verify publish landed

```bash
# Check each package is live + correct version
for pkg in types core tokens web-component react svelte; do
  echo "@pulse-music/$pkg latest:"
  npm view "@pulse-music/$pkg" version
done
```

Open the npm pages in a browser to spot-check the README rendered correctly:

- https://www.npmjs.com/package/@pulse-music/types
- https://www.npmjs.com/package/@pulse-music/core
- https://www.npmjs.com/package/@pulse-music/tokens
- https://www.npmjs.com/package/@pulse-music/web-component
- https://www.npmjs.com/package/@pulse-music/react
- https://www.npmjs.com/package/@pulse-music/svelte

## Step 5 — Tag the publish in git

```bash
git tag -a v3.0.0-rc.0 -m "First npm publish — @pulse-music/* at v3.0.0-rc.0"
git push origin v3.0.0-rc.0
```

The Pages workflow + Release Please will pick it up. CHANGELOG can be appended with a "Published to npm" entry.

## Step 6 — Update README + SANDBOXES.md

The README mentions npm packages but the sandbox links + install commands assume publication. After Step 4, sweep:

- `README.md` — change `# (coming soon — private repo, alpha.14)` to the real npm install lines.
- `docs/universal/SANDBOXES.md` — re-author each StackBlitz / CodeSandbox link to point at a real working sandbox using the published packages. The "(activate once published)" disclaimer can be removed.
- `docs/frameworks/*.md` — sweep for `(coming soon)` markers.

## Step 7 — Announce

The repo is public, the demo is at https://yamadablog.github.io/pulse-player/, the YouTube walkthrough is at https://youtu.be/q_FJ1GWaCc8. After Step 6 ships, share on whatever channels are relevant — Bluesky / Twitter / dev.to / Hacker News / Reddit r/vuejs / r/reactjs / r/sveltejs.

## What if a publish fails mid-way?

- **OTP expired:** retry with a fresh code. No state to roll back.
- **Package name taken:** the `@pulse` scope is yours; this shouldn't happen on the first publish. If it does, you're hitting an org-scope conflict — check `npm view @pulse-music/<name>` to see who owns it.
- **`npm ERR! 403`:** you don't have publish rights on the scope. Confirm `npm whoami` returns `yamadablog` and you're an owner of the `@pulse` org.
- **Half-published state (e.g. `types` published but `core` failed):** safe. Resume from the failing package — `npm publish` is idempotent at the (name, version) level, so if the same version was already pushed, it errors with "cannot publish over existing version". Bump the patch in the failing package only (`0.0.1`) and re-publish.

## Unpublish window

npm allows `npm unpublish @pulse-music/<name>@<version>` within **72 hours** of publish. After that, the version is permanent (you can deprecate it via `npm deprecate` but cannot remove it). Use the 72-hour window only if you discover a critical bug in the published tarball — otherwise let it stand and ship a patch release.

## Cost

- npm publish: **free** for public scoped packages with the `--access=public` flag.
- @pulse org on npm: **free** unless you want private packages too (private packages need a paid org plan).
- Total monetary cost of this entire procedure: **$0**.
