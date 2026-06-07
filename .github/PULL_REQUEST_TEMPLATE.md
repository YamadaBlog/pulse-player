<!-- Thanks for the PR. Pulse holds a strict quality bar — please tick every box below before requesting review. -->

## Summary

<!-- One paragraph. What does this PR do, and why? Link the issue if any (`Closes #123`). -->

## Type

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (please justify in detail)
- [ ] Docs / chore / refactor

## Quality gate

The CI runs `npm run ci`, which is the same gate you should run locally:

- [ ] `npm run type-check` — clean
- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run format:check` — clean
- [ ] `npm run test` — 100 % suites passing
- [ ] `npm run build` — clean
- [ ] `npm run audit` — 0 vulnerabilities

## Accessibility

- [ ] Any animation honours `prefers-reduced-motion`
- [ ] Any new interactive element has an accessible name (`aria-label`, button text, etc.)
- [ ] Keyboard works the same as mouse / touch
- [ ] Focus is visible

## Performance

- [ ] Any per-frame work uses `transform` / `opacity` (no `height` / `width` / `top` / `left`)
- [ ] No new `will-change` on a high-count selector
- [ ] Bundle size budget respected (gzip total ~ 54 kB)

## Privacy

- [ ] No new network call in the default code path
- [ ] No new identifier read off `navigator` / `screen` / etc.

## Docs

- [ ] If this changes the public API, `docs/API.md` updated
- [ ] If this changes the visual identity, `docs/CUSTOMIZATION.md` examples updated
- [ ] If this is user-facing, README highlights updated
- [ ] CHANGELOG.md entry added under `Unreleased`

## Test plan

<!-- How a reviewer reproduces the change. Steps, expected behaviour, screenshots / screen recordings for visual changes. -->
