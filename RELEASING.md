# Releasing

Releases are driven by [Changesets](https://github.com/changesets/changesets) and published from CI.

1. Contributors add changesets to their pull requests (`npm run changeset`).
2. When changesets land on `main`, the **Release** workflow opens (or updates) a _Version packages_ pull request that bumps versions and writes each package's `CHANGELOG.md`.
3. Merging that pull request publishes the new versions to npm, with provenance, and pushes the git tags.

The seven web packages are versioned together (`fixed` group), so a release always contains a consistent set.

## One-time setup: npm trusted publishing

The release workflow publishes through [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC) — there is no npm token to create, rotate or leak. For **each** `@pulse-music/*` package on npmjs.com:

**Settings → Trusted publishing → GitHub Actions**, with

- Organization or user: `YamadaBlog`
- Repository: `pulse-player`
- Workflow filename: `release.yml`

## Checks before merging a release PR

CI already runs everything, but it's worth a glance at:

- the _Package quality_ job (publint, are-the-types-wrong, size budgets, packed-tarball consumers);
- the generated changelogs, which are what users read.

## React Native

`@pulse-music/react-native` is not part of the workspace release and is published manually from `packages/react-native` (`npm publish --provenance`) after testing on a device.
