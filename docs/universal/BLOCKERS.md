# Blockers — what's not done and why

Honest record of the items that cannot be closed in the current session and the reason each one is blocked. Updated through v3.0.0-alpha.16.

## 0. ~~GitHub Pages activation~~ ✅ RESOLVED (v3.0.0-alpha.16)

The repo was switched to **public visibility** in v3.0.0-alpha.16 (after a clean pre-public security audit — 0 secrets, 0 .env, 0 binaries, 0 private keys in history). GitHub Pages activated on the free tier:

```
$ gh api -X POST repos/YamadaBlog/pulse-player/pages -f build_type=workflow
{ "html_url": "https://yamadablog.github.io/pulse-player/", "build_type": "workflow", "public": true }
```

Live demo URL: **https://yamadablog.github.io/pulse-player/**. The `.github/workflows/pages.yml` push trigger was re-enabled (it had been switched to `workflow_dispatch` only in alpha.14 to silence the failing-on-every-push noise). The Vite `BASE_PATH=/pulse-player/` env var is read by `vite.config.ts` so asset URLs resolve correctly under the sub-path.

---

## 1. ~~`@pulse-music/react-native` real implementation~~ ✅ FIRST ITERATION SHIPPED (v3.0.0-alpha.22)

The real renderer is no longer a scaffold. v3.0.0-alpha.22 (preparing for `@pulse-music/react-native@3.0.0-rc.1` on npm) ships:

- **Audio playback** via `expo-av` `Audio.Sound`.
- **9 theme variants** mirroring `@pulse-music/tokens` via a `variants.ts` table.
- **Ambient EQ** — 12 bars animated via `react-native-reanimated` `withRepeat`, off the UI thread.
- **Pulso heartbeat** — concentric rings with `withSequence` + `withDelay`.
- **Basic FAB** — tap-to-toggle + cover art + pulso overlay.
- **`usePulseAudioRN()` hook** with the same shape as the web `usePulseAudio`.
- **`PulseEngineRN` class** + singleton helpers (`getSharedEngineRN`, `setSharedEngineRN`).

**Demo app:** `apps/demo-react-native/` is an Expo SDK 56 scaffold. Boot with `npm run dev --workspace=@pulse-music/demo-react-native` (then `a` for Android, `w` for Web). Tested boot path: Android emulator (Pixel_8a AVD) via Expo CLI; iOS deferred until macOS / Xcode access.

**Known limitations in rc.1** (deliberately deferred to subsequent patches):

- FFT visualisation uses a pseudo-bar synth, not real audio FFT. Real FFT lands when `react-native-audio-api` (Swansion) reaches stable iOS support.
- Backdrop blur not yet ported. `expo-blur` integration in the next patch.
- FAB drag-to-reposition deferred. `PanGestureHandler` integration in the next patch.
- `prefers-reduced-motion` wiring deferred. `AccessibilityInfo` listener next patch.

**Intentionally absent (platform constraints):** drag-to-resize, fullscreen API, guided demo tour.

**Path forward:** the next 2-3 RN patches (rc.2, rc.3) close the deferred items in order of impact (FFT first, blur second, FAB drag third).

---

## 2. `npm publish @pulse-music/*` to the public registry

**Status:** package builds work locally (`npm run build:packages` produces `dist/{index.js,index.cjs,index.d.ts}` for every package). Nothing has been published.

**Why blocked here:**

- Requires interactive authentication: `npm login` followed by an OTP from the maintainer's 2FA device
- Cannot be automated from this session without leaking the maintainer's npm credentials
- A wrong tag (e.g. publishing 0.0.0 instead of 3.0.0-alpha.7) is irreversible once on the registry

**Mitigation in place:**

- Every publishable package's `package.json` has the correct `exports`, `main`, `module`, `types`, `files` fields and a `publishConfig.access: public`
- `prepublishOnly` script on the root runs the full CI gate (`npm run ci` + `npm run build:lib`) before any publish
- `RELEASING.md` documents the publish flow
- Scaffolds (`@pulse-music/angular`, `@pulse-music/react-native`) are explicitly `private: true` — they cannot be accidentally published

**Path forward:**

```bash
# Maintainer-only:
npm login
npm publish --workspace=@pulse-music/types
npm publish --workspace=@pulse-music/core
npm publish --workspace=@pulse-music/tokens
npm publish --workspace=@pulse-music/web-component
npm publish --workspace=@pulse-music/react
npm publish --workspace=@pulse-music/svelte
# (Skip @pulse-music/angular and @pulse-music/react-native until they go non-private.)
```

---

## 3. Vue migration `src/lib/` → `packages/vue/`

**Status:** the Vue v2.3.4 codebase remains at `src/lib/` with **zero files modified** since alpha.0. The placeholder `packages/vue/src/index.ts` does nothing.

**Why deferred (not strictly blocked):**

The migration requires:

1. **Visual regression baselines for every viewport / variant / state** — the alpha.7 Playwright setup ships 2 stable baselines (hero + home-fold). Two more (`resize-stage` and `variants gallery`) are flaky because the running ambient EQ + auto-tour rAF loop never converges to a stable frame. Without these, a Vue refactor cannot prove pixel parity.
2. **`@pulse-music/web-component` chrome at ≥95 % parity vs Vue v2.3.4** — alpha.7 sits at ~70 % (added mp**bg, mp**noise, prev/next, social icons, eyebrow, 3 responsive states, data-fab, drag-to-resize handle, FAB drag, ambient EQ, pulso, --pulse-scale). Still missing: FAB radial menu (palette + Pulso/Resizable/Hide toggles), fullscreen FAB, the guided demo tour wiring.
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

**Why deferred:** time-bounded session. The features that landed in alpha.7 (mp**bg, mp**noise, drag-to-resize, FAB drag, data-fab, 3 responsive states, prev/next, social icons, NOW PLAYING eyebrow) collectively moved chrome parity from 60 % → 70 % and are higher-leverage for the typical consumer than the radial menu.

**Path forward:** v3.0.0-alpha.8 sprint with the fullscreen FAB and the radial menu together.

---

## Summary table

| Item                                   | Severity                   | Real blocker?                      | Path forward                        |
| -------------------------------------- | -------------------------- | ---------------------------------- | ----------------------------------- |
| `@pulse-music/react-native` real impl  | High (vs roadmap)          | Yes — needs RN tooling environment | v3.X.0 dedicated sprint             |
| `npm publish @pulse-music/*`           | Critical (vs distribution) | Yes — needs maintainer OTP         | Maintainer runs locally             |
| Vue migration                          | Medium (vs architecture)   | No — deferred for safety           | v3.0.0-alpha.9, gated by Playwright |
| Playwright `resize-stage` + `variants` | Low (vs alpha.9 gate)      | No — animation tuning              | v3.0.0-alpha.8                      |
| FAB radial menu                        | Medium (vs Vue parity)     | No — time-bounded                  | v3.0.0-alpha.8                      |
