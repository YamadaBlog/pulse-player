# Security policy

## Supported versions

| Version line                       | Status            | Security fixes                  |
| ---------------------------------- | ----------------- | ------------------------------- |
| `v2.3.x` (Vue 3, current stable)   | ✅ Active         | Yes                             |
| `v3.0.0-alpha.*` (multi-framework) | 🛠 In development | Yes — patched in the next alpha |
| `< v2.3.0`                         | ❌ Unsupported    | No                              |

Patch releases land within 7 days for high-severity reports, 14 days for moderate, 30 days for low.

## Known dev-dependency CVE (residual, NOT runtime-exploitable)

### `CVE-2026-47429` — vitest UI server arbitrary file read / RCE (CVSS 9.8)

- **Source:** [GitHub Advisory GHSA-5xrq-8626-4rwp](https://github.com/advisories/GHSA-5xrq-8626-4rwp)
- **Affected:** `vitest <= 3.x`. Fix shipped in `vitest@4.x`.
- **Why we're still on `vitest@3.x`:** vitest 4 imports `node:util.styleText`, available only from Node 22.6+. The maintainer's current Node baseline is 20.11. Upgrading the Node baseline is a separate decision; downgrading vitest below 1.x is not viable (test API breakage). The middle ground keeps vitest 3.x and documents the residual.
- **Why this is NOT runtime-exploitable:**
  - The CVE requires the vitest API server to be bound (`--ui` or `--api` flag). Pulse's test scripts in `package.json` invoke `vitest run` only — no `--ui`, no `--api`, no port binding.
  - The vitest dev server never runs in production (it's a dev-only dependency). Consumers installing `@pulse-music/*` from npm never receive vitest.
  - CI runners (`.github/workflows/ci.yml`) invoke `npm test` which is `vitest run` — same shape, no server.
- **What we do anyway:**
  - `npm run audit` (the script consumers and CI use) runs `npm audit --omit=dev` and returns 0 vulnerabilities — the CVE only surfaces in the broader `npm audit` view.
  - This entry documents the residual so a security reviewer sees we know, not so we hide it.
  - The `package.json` `overrides` field pins the vitest tree to a unified version to avoid duplicate-installation amplification.
- **When this gets fixed:** the next time the maintainer upgrades Node to 22.6+ baseline (or 24.x LTS), `npm install -D vitest@latest @vitest/coverage-v8@latest` lands `vitest@4.x` automatically.

### Other moderate-severity dev-dependency CVEs

`npm audit` lists ~12 moderate-severity CVEs in the dev tree (esbuild < 0.24.2 dev-server XSS; vite ranges depending on transient resolution; @expo/_ tooling under apps/demo-react-native). None affect the runtime artefacts shipped to npm — every published `@pulse-music/_`package's tarball contains only its own`src/` + type declarations + README, never the dev tree. Tracked via Dependabot weekly.

## Reporting a vulnerability

**Do not open a public GitHub issue for security reports.** They are publicly indexed and visible to anyone monitoring the repo.

### Preferred: GitHub Security Advisories

1. Go to the repo's **Security** tab → **Advisories** → **New draft advisory**
2. Fill in the form (impacted versions, vector, severity, reproduction steps)
3. Submit — the maintainers are notified privately

This is the fastest path and lets us patch + publish a coordinated disclosure together.

### Fallback: email

Send the report to **`yamadaablog@gmail.com`** with subject prefix `[pulse-player security]`. The maintainer's email is already public in the commit history; using it directly avoids a placeholder forward.

Include:

- A clear description of the vulnerability
- The version(s) you tested against
- A proof of concept (script, repo, or HTTP request — whatever's smallest)
- Your assessment of the severity (CVSS 3.1 if you have it; otherwise prose is fine)
- Whether you've already disclosed elsewhere

We acknowledge every report within **72 hours** (often within a working day).

## What we treat as a security issue

- Code execution from a crafted prop / attribute / playlist entry
- Cross-site scripting via the `tracks` / `accentColor` / `githubUrl` / `spotifyUrl` props (including via template-string injection in Lit / Vue render)
- Cross-package import paths that leak data outside the consumer's app boundary
- Local storage payloads that could be hijacked by another tab on the same origin
- Bypass of the `prefers-reduced-motion` / `prefers-color-scheme` accessibility opt-outs in a way that could harm a user (eg seizure-inducing animation)
- Vulnerable transitive dependency that ships in a tarball (`npm pack`)

## What we don't treat as a security issue (file a regular issue instead)

- Audio playback failures (autoplay rejection, DRM-protected URL refused) — these are runtime errors, not security
- A demo asset (`public/audio/*.webm`) being takedown-bait — these are placeholders documented in [`NOTICE.md`](./NOTICE.md); replace them in your fork
- A consumer not setting `rel="noopener noreferrer"` on a link they wrote themselves — that's their app's concern, not the library's

## Coordinated disclosure window

Default: **90 days from acknowledgement** to public disclosure. We typically ship a patch within the first 14 days; the remaining 76 days give downstream consumers time to update before the advisory goes public.

If a vulnerability is being actively exploited, we shorten this window and may ship an emergency patch + advisory the same day.

## Credit

Researchers who follow the process above get:

- A named credit in the published advisory (or anonymity if preferred)
- A line in [`CHANGELOG.md`](./CHANGELOG.md) for the release that ships the fix
- Right-of-refusal on the disclosure timing

We don't run a bug bounty programme (yet), but if Pulse moves to a commercial license we'd add one alongside.
