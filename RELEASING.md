# Release procedure

The release flow is intentionally small: every released version is
pinned to a git tag, surfaced as a GitHub Release, and published on
npm — in that order, every time.

## 0. Decide the version

We follow [SemVer](https://semver.org/spec/v2.0.0.html):

- **patch** — bug fix, no API change
- **minor** — new prop / new event / new exported helper, no breaking
  change
- **major** — anything that breaks an existing import, prop shape,
  payload, or runtime behaviour

If you're not sure, default to **minor** and call it out in the
release notes.

## 1. Land the changes on `main`

- All code under review on a branch, merged into `main` via PR.
- CI green on `main` (the matrix runs `npm run ci`).
- `CHANGELOG.md` updated: an entry under `## Unreleased` becomes the
  new release block (`## X.Y.Z — YYYY-MM-DD`). Move the highlights
  list into the table in the README.
- Bump `package.json` `version` to the new value.

## 2. Tag

```bash
git tag vX.Y.Z -m "vX.Y.Z — one-line summary"
git push origin vX.Y.Z
```

The tag must point at the exact commit that ships. Never re-tag after
push; ship a new patch instead.

## 3. GitHub Release

```bash
gh release create vX.Y.Z \
  --title "vX.Y.Z — one-line summary" \
  --notes-file .github/release-notes/vX.Y.Z.md
```

The release notes file lives under `.github/release-notes/` — see
the template below. The first release where this procedure was used
was [`vX.Y.Z`](https://github.com/YamadaBlog/pulse-player/releases/tag/vX.Y.Z)
— follow the same format.

## 4. npm

```bash
# Verifies the lib build + runs the full CI gate. If anything fails,
# publish is aborted before the registry sees the package.
npm run ci
npm run build:lib

# Dry-run shows EXACTLY what will be uploaded. Always look at the
# file list — `package.json#files` should be respected, no .env, no
# private notes, no node_modules.
npm publish --dry-run

# When the dry-run output is clean:
npm publish --access public
```

The published artefact must include:

- `src/lib/`, `README.md`, `LICENSE`, `NOTICE.md`, `docs/`, and the
  built library files under `dist/lib/` if you're shipping the bundle
  instead of source.

The published artefact must NOT include:

- `src/App.vue`, `src/composables/`, `tests/`, `examples/`, any
  `.env`, the `screenshots/` directory if it's > 2 MB.

## 5. Announce

The release notes are the single source of truth. If you announce
anywhere (Twitter, internal Slack, the demo site footer), link the
release URL directly; don't rewrite the notes.

## Release-notes template

Copy `.github/release-notes/_TEMPLATE.md` and rename to `vX.Y.Z.md`.

```markdown
## Summary

One paragraph — what this release is about, what it changes for the
integrator. No marketing copy.

## What's new

- Bullet, with the exact prop / event / file affected.
- Bullet.

## What's fixed

- Bullet — link the relevant audit item or issue number.

## Breaking changes

(If any. If none, write "None.")

- The exact import / prop / payload that changed, with a before / after
  snippet. Include the migration path.

## Quality gate

type-check → clean
lint → 0 errors, 0 warnings
format → pass
tests → N / N
build → <gzip size>
build:lib → <gzip size>
audit → 0 vulnerabilities

## Full diff

https://github.com/YamadaBlog/pulse-player/compare/vA.B.C...vX.Y.Z
```

## What to do when a release is broken

Releases are immutable. If `vX.Y.Z` is broken:

1. **Don't re-tag, don't force-push.** The tag and the npm version
   stay frozen.
2. Ship `vX.Y.(Z+1)` with the fix.
3. Mark `vX.Y.Z` deprecated on npm:
   ```bash
   npm deprecate pulse-player@X.Y.Z "Broken release — upgrade to X.Y.(Z+1)."
   ```
4. Add a `Known issues` note to the release page (`gh release edit`).

## Two-person quorum for breaking releases

Major versions (anything bumping the leftmost number) require
sign-off from a second maintainer on the PR. Soft rule, hard expectation.
