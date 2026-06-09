# Upgrading Node to kill `CVE-2026-47429` (vitest CVSS 9.8)

**TL;DR** — the only thing standing between Pulse and `npm audit` reporting "0 critical" is a Node baseline bump from 20.11 to 22.6+ (or 24.x LTS).

## The chain

```
vitest 1.x → 3.x → 4.x
            ↑
            stuck here because vitest 4 uses node:util.styleText
            which is exposed only from Node 22.6+
```

- `vitest@4.x` ships the fix for `CVE-2026-47429` (UI-server arbitrary file read / RCE, CVSS 9.8) — [advisory](https://github.com/advisories/GHSA-5xrq-8626-4rwp).
- The CVE is **NOT runtime-exploitable for Pulse** (Pulse never invokes `vitest --ui` or `vitest --api`; the dev server never binds a port; `@pulse-music/*` tarballs never ship vitest to consumers). Documented in [`SECURITY.md`](../../SECURITY.md) §"Known dev-dependency CVE".
- But `npm audit` continues to surface it as long as `vitest@<4` is in the tree. Cosmetic but visible to anyone running an audit on the repo.

## Procedure (one-time, ~5 minutes)

### Option A — Volta (recommended on Windows / cross-platform, no Admin needed)

```bash
# 1. Install Volta (one-time)
#    Windows: https://docs.volta.sh/guide/getting-started
#    macOS / Linux: curl https://get.volta.sh | bash

# 2. From the repo root
volta install node@24
volta pin node@24

# 3. Verify
node --version           # → v24.x.x

# 4. Upgrade vitest + coverage-v8 to 4.x
npm install -D vitest@latest @vitest/coverage-v8@latest

# 5. Re-run the gate
npm test
npm run audit                 # prod-only — already 0
npm audit                      # full tree — should now show 0 critical
```

Volta pins the Node version per-project via the `volta` field in `package.json`, so contributors auto-pick the right version on `npm install` without thinking. Less error-prone than nvm switching.

### Option B — nvm-windows (Windows)

```bash
nvm install 24.0.0
nvm use 24.0.0
node --version                 # → v24.0.0

npm install -D vitest@latest @vitest/coverage-v8@latest
npm test
npm audit
```

### Option C — nvm (macOS / Linux)

```bash
nvm install --lts
nvm use --lts
node --version                 # → v24.x.x

npm install -D vitest@latest @vitest/coverage-v8@latest
npm test
npm audit
```

### Option D — fnm (macOS / Linux / Windows, Rust-based, fastest)

```bash
fnm install 24
fnm use 24
fnm default 24
node --version

npm install -D vitest@latest @vitest/coverage-v8@latest
npm test
npm audit
```

## What to verify

| Step                        | Expected                                                                  |
| --------------------------- | ------------------------------------------------------------------------- |
| `node --version`            | `v22.6.0` minimum (24 LTS recommended)                                    |
| `npm ls vitest`             | `vitest@4.x.x`                                                            |
| `npm test`                  | `Tests 33 passed` (or higher post-upgrade) on root                        |
| `npm run test:packages`     | All 7 package suites pass                                                 |
| `npm audit`                 | **0 critical** (12 moderate are dev-only esbuild/vite chain; non-runtime) |
| `npm run audit` (prod-only) | 0 vulnerabilities (unchanged)                                             |

## If vitest 4 breaks tests

Vitest 4 changed a few defaults (parallel mode, snapshot serialiser). If any test breaks post-upgrade:

1. Check the [vitest 4 migration guide](https://vitest.dev/guide/migration).
2. Common fixes:
   - `pool: 'threads'` → `pool: 'forks'` in `vitest.config.ts` for tests that mutate global state
   - Snapshot deltas: re-record via `vitest --update`
   - Mocks: `vi.mock` API stable, no changes expected for our suites

## Pinning the Node baseline in `package.json`

Once the upgrade lands, add to `package.json`:

```json
{
  "engines": {
    "node": ">=22.6.0"
  }
}
```

This produces a friendly `npm WARN EBADENGINE` for downstream consumers on older Node, without breaking the install. The `@pulse-music/*` packages themselves work on Node 18+ — only the dev tooling needs 22.6+.

## After upgrade

- Update [`SECURITY.md`](../../SECURITY.md) — remove the "Known dev-dependency CVE" §, replace with "Resolved 2026-XX-XX in alpha.XX".
- Update the maintainer's [`CONTRIBUTING.md`](../../CONTRIBUTING.md) onboarding line — mention `volta install node@24` once.
- Bump the alpha tag — this is a Node baseline change, worth its own commit.

## Why not do this in alpha.26 already

The maintainer's current Node baseline (20.11) is correct for everything else in the project. Bumping to 22.6+ is a maintainer-environment change, not a code change — the agent shouldn't bump the human's Node without asking. The CVE is documented as non-exploitable, so the cost of waiting is cosmetic only. Lands when the maintainer runs the 5-minute upgrade.
