# Security policy

## Supported versions

| Version                     | Security fixes                                      |
| --------------------------- | --------------------------------------------------- |
| 3.x (`@pulse-music/*`)      | ✅                                                  |
| 3.0 release candidates      | ❌ — upgrade to 3.x                                 |
| 2.x (Vue + Pinia `src/lib`) | ❌ — see the [migration guide](./docs/migration.md) |

## Reporting a vulnerability

**Please don't open a public issue.**

1. Preferred: open a private report from the repository's **Security → Advisories → Report a vulnerability** page.
2. Or email **yamadaablog@gmail.com** with the subject prefix `[pulse-player security]`.

Include the affected package and version, a minimal reproduction and your assessment of the impact. Reports are acknowledged within 72 hours; fixes for high-severity issues are released within 7 days, and disclosure is coordinated with you (90 days by default, shorter if the issue is actively exploited). Reporters are credited in the advisory unless they prefer otherwise.

## Scope

In scope:

- Script injection through element attributes or properties, playlist data (`Track` fields), labels or slotted content
- Style or URL injection through track covers or colours
- Data exposure through `localStorage` (the floating player's saved position)
- Vulnerable dependencies shipped in a published tarball

Out of scope (please open a regular issue): playback failures such as autoplay rejections, and vulnerabilities that only affect the development toolchain.

## How the project stays safe

- `npm audit` runs in CI and fails on high-severity advisories; Dependabot proposes updates weekly.
- CodeQL (`security-extended`) analyses the TypeScript sources and the GitHub workflows on every change.
- Workflows use least-privilege permissions and actions pinned to commit SHAs.
- Packages are published from CI through npm trusted publishing with provenance — no long-lived npm token exists.
- Rendering uses Lit templates (auto-escaped); the showcase's syntax highlighter escapes its input before adding markup.
