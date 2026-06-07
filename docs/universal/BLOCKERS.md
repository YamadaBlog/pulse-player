# Blockers — what's not done and why

Honest record of the items that cannot be closed in the current session and the reason each one is blocked. Updated through v3.0.0-alpha.7.

## 1. `@pulse/react-native` real implementation

**Status:** scaffold only (`private: true`, no peer deps, no source code).

**What's needed:**

- Expo SDK 51+ project setup (or a bare React Native 0.74+ template)
- `react-native-audio-api` (Swansion) install + iOS / Android native module linking
- New renderer using RN primitives (`View`, `Animated`, `react-native-svg`, `react-native-gesture-handler`)
- Feature-parity decisions documented up front (no `<Teleport>`, no `backdrop-filter`, no DOM resize handle — alternatives needed)
- iOS simulator + Android emulator to validate
- Separate test setup (jest + `@testing-library/react-native`)

**Why blocked here:**

- Out-of-scope for a Node monorepo session — needs a CocoaPods / Gradle build environment
- Estimated effort: 2-4 days of focused work, not a single-alpha increment
- The wrapper needs its OWN apps/demo-react-native/ which requires Expo Go on a device or simulator
- Adding `react-native` as a peer dep at the monorepo level pulls in Metro / Hermes transitively, which may conflict with the Web-side tooling

**Mitigation in place:**

- `@pulse/types` already shared, so when the RN renderer lands it consumes the same shapes
- `docs/frameworks/react-native.md` ships the feature parity matrix (web-only features marked ❌, RN-substituted features marked ⚠️)
- The roadmap pushes this to a dedicated alpha (not the v3.0.0 stable critical path)

**Path forward:** dedicated RN sprint in v3.X.0 (after v3.0.0 stable) with a separate worktree to keep the iOS / Android tooling isolated.

---

## 2. `npm publish @pulse/*` to the public registry

**Status:** package builds work locally (`npm run build:packages` produces `dist/{index.js,index.cjs,index.d.ts}` for every package). Nothing has been published.

**Why blocked here:**

- Requires interactive authentication: `npm login` followed by an OTP from the maintainer's 2FA device
- Cannot be automated from this session without leaking the maintainer's npm credentials
- A wrong tag (e.g. publishing 0.0.0 instead of 3.0.0-alpha.7) is irreversible once on the registry

**Mitigation in place:**

- Every publishable package's `package.json` has the correct `exports`, `main`, `module`, `types`, `files` fields and a `publishConfig.access: public`
- `prepublishOnly` script on the root runs the full CI gate (`npm run ci` + `npm run build:lib`) before any publish
- `RELEASING.md` documents the publish flow
- Scaffolds (`@pulse/angular`, `@pulse/react-native`) are explicitly `private: true` — they cannot be accidentally published

**Path forward:**

```bash
# Maintainer-only:
npm login
npm publish --workspace=@pulse/types
npm publish --workspace=@pulse/core
npm publish --workspace=@pulse/tokens
npm publish --workspace=@pulse/web-component
npm publish --workspace=@pulse/react
npm publish --workspace=@pulse/svelte
# (Skip @pulse/angular and @pulse/react-native until they go non-private.)
```

---

## 3. Vue migration `src/lib/` → `packages/vue/`

**Status:** the Vue v2.3.4 codebase remains at `src/lib/` with **zero files modified** since alpha.0. The placeholder `packages/vue/src/index.ts` does nothing.

**Why deferred (not strictly blocked):**

The migration requires:

1. **Visual regression baselines for every viewport / variant / state** — the alpha.7 Playwright setup ships 2 stable baselines (hero + home-fold). Two more (`resize-stage` and `variants gallery`) are flaky because the running ambient EQ + auto-tour rAF loop never converges to a stable frame. Without these, a Vue refactor cannot prove pixel parity.
2. **`@pulse/web-component` chrome at ≥95 % parity vs Vue v2.3.4** — alpha.7 sits at ~70 % (added mp__bg, mp__noise, prev/next, social icons, eyebrow, 3 responsive states, data-fab, drag-to-resize handle, FAB drag, ambient EQ, pulso, --pulse-scale). Still missing: FAB radial menu (palette + Pulso/Resizable/Hide toggles), fullscreen FAB, the guided demo tour wiring.
3. **The Vue layer (`MusicPlayer.vue`, `MiniPlayer.vue`, `useAudioStore.ts`) refactored to wrap `<pulse-player>` / `<pulse-fab>`** while still exporting the same component-level API consumers depend on. This is a delicate operation — every prop binding, slot, and emit must map onto the underlying Custom Element without drift.

**Why not done in this session:**

- The Playwright animation-stability issue (`resize-stage` / `variants gallery` won't snapshot) is a real research task, not a quick fix. Workarounds (explicit demo-pause hook, fullPage with high tolerance) require touching the v2.3.4 demo code — which we've sworn not to do.
- The chrome gap is too large to close in one alpha without rushing. FAB radial menu alone is ~200 lines of pointer-event logic + CSS.
- Refactoring `MusicPlayer.vue` is high-risk: every consumer of the npm package today expects bit-for-bit identical rendering. Catching a regression after the merge would force a `v3.0.1` patch.

**Path forward:**

- v3.0.0-alpha.8 → close the Playwright gap (add `window.__pulsePauseDemo` hook in App.vue OR widen captures to `fullPage` with > 5 % tolerance, ship 4-6 more baselines)
- v3.0.0-alpha.8 → ship the remaining chrome (FAB radial menu, fullscreen)
- v3.0.0-alpha.9 → execute the Vue migration with Playwright running on every commit. Pixel diff > 0.5 % = revert.

---

## 4. `resize-stage` + `variants gallery` Playwright captures

**Status:** 2 of 4 attempted baselines fail to capture (Playwright stability heuristic times out).

**Why:**

- The Vue demo's ambient EQ runs CSS keyframes 1.6 s loop, the FAB pulso runs 5 s loop. Both never converge on a static frame.
- `prefers-reduced-motion` emulation works for the `.hero` capture but the demo's `App.vue` has additional animations triggered on scroll-into-view (e.g. the auto-tour fades in the variant gallery title)

**Mitigation:**

- The 2 captures that DID work (`hero` + `home-fold`) cover the highest-visibility surface — they're enough to gate the alpha.9 Vue migration's most critical visual surface
- The `BLOCKERS.md` entry above (Vue migration) explicitly lists "close the Playwright gap" as a v3.0.0-alpha.8 prerequisite

---

## 5. FAB radial menu (palette + Pulso/Resizable/Hide toggles)

**Status:** not implemented in `<pulse-fab>`.

**Why:**

- ~200 lines of pointer-event logic (radial layout, keyboard nav, focus management) plus CSS
- The current `<pulse-fab>` doesn't have a notion of "second-level UI"
- Vue's `MiniPlayer.vue` ships this via a `<Teleport to="body">` + a separate menu component (`FabMenu.vue`); the Lit element would need an equivalent in Shadow DOM

**Why deferred:** time-bounded session. The features that landed in alpha.7 (mp__bg, mp__noise, drag-to-resize, FAB drag, data-fab, 3 responsive states, prev/next, social icons, NOW PLAYING eyebrow) collectively moved chrome parity from 60 % → 70 % and are higher-leverage for the typical consumer than the radial menu.

**Path forward:** v3.0.0-alpha.8 sprint with the fullscreen FAB and the radial menu together.

---

## Summary table

| Item | Severity | Real blocker? | Path forward |
| --- | --- | --- | --- |
| `@pulse/react-native` real impl | High (vs roadmap) | Yes — needs RN tooling environment | v3.X.0 dedicated sprint |
| `npm publish @pulse/*` | Critical (vs distribution) | Yes — needs maintainer OTP | Maintainer runs locally |
| Vue migration | Medium (vs architecture) | No — deferred for safety | v3.0.0-alpha.9, gated by Playwright |
| Playwright `resize-stage` + `variants` | Low (vs alpha.9 gate) | No — animation tuning | v3.0.0-alpha.8 |
| FAB radial menu | Medium (vs Vue parity) | No — time-bounded | v3.0.0-alpha.8 |
