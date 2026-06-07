# Manual screen-reader test plan

Axe-core covers the **automated** WCAG 2.1 AA layer (colour contrast, ARIA hierarchy, missing labels, focus order). It can't verify the **lived** screen-reader experience — does the announce sound right, does the player make sense if you can't see it, does the cover art's role match what a blind user expects.

This document is the manual test plan for that lived experience. Once a maintainer (or contributor) runs through it on each platform, the results land in `docs/universal/SCREEN_READER_REPORT.md` and the Pulse claim "screen-reader ready" earns its keep.

## Scope

Test the **Vue v2.3.4 reference** demo at `http://localhost:5174/` (or the live demo at `https://yamadablog.github.io/pulse-player/`). That's the version with the full chrome surface. The framework wrappers inherit the Web Component chrome, which is ~95 % the same.

Test on these screen-reader / browser combinations (industry-standard matrix):

| OS      | Screen reader        | Browser             | Status |
| ------- | -------------------- | ------------------- | ------ |
| Windows | NVDA 2024.4+         | Firefox (preferred) | TODO   |
| Windows | NVDA 2024.4+         | Chrome              | TODO   |
| macOS   | VoiceOver (built-in) | Safari (preferred)  | TODO   |
| macOS   | VoiceOver            | Chrome              | TODO   |
| iOS     | VoiceOver            | Safari              | TODO   |
| Android | TalkBack             | Chrome              | TODO   |

NVDA download: [https://www.nvaccess.org/download/](https://www.nvaccess.org/download/) (free, open source).
VoiceOver: `Cmd+F5` on macOS, Settings → Accessibility → VoiceOver on iOS.
TalkBack: Settings → Accessibility → TalkBack on Android.

## Test scenarios

For each row above, run these 10 scenarios. Each gets a pass / fail / partial verdict + a one-sentence note.

### Scenario 1 — Landing on the demo

1. Open the demo URL with the screen reader running.
2. Press `Tab` once.

**Expected:** the SR announces something like "pulse-player music player, button group" (or whatever maps to the host element + the first focusable child). The announcement should make it clear there's an audio player on the page.

**Fail conditions:** SR says "graphic" or "unidentified region" (missing landmark / role).

### Scenario 2 — Reading the now-playing label

1. With focus on the player, navigate via SR commands (NVDA `Insert+Down`, VoiceOver `VO+→`).

**Expected:** SR reads the track title, then the artist, then the current time, in that order.

**Fail conditions:** Time is read as raw seconds (e.g. "138.234567") instead of a formatted "2:18", or the order is jumbled.

### Scenario 3 — Activating play / pause

1. Focus the play button (`Tab` to it).
2. Press `Space` or `Enter`.

**Expected:** Audio starts. SR announces "playing" or "paused" depending on transition. The button's `aria-pressed` reflects the new state.

**Fail conditions:** SR doesn't announce the state change. User must guess if play succeeded.

### Scenario 4 — Skipping tracks

1. With focus anywhere on the player, press `J` (or `←`).

**Expected:** SR announces the new track title.

**Fail conditions:** No announcement. User doesn't know the track changed.

### Scenario 5 — Volume / progress slider

1. Tab to the progress bar.
2. Use arrow keys to seek.

**Expected:** SR announces the new position as a percentage ("seeking to 50 percent") or time ("seeking to 1 minute 19 seconds"). The slider has a proper `role="slider"` with min / max / value.

**Fail conditions:** Slider is unlabeled, or arrow keys don't change position, or the new position isn't announced.

### Scenario 6 — Variant / theme change

1. Open the FAB radial menu (chevron toggle).
2. Tab through the variant chips.

**Expected:** Each chip announces its variant name ("midnight", "sunset", "vinyl"…). The active variant has `aria-pressed=true` or `aria-checked=true`.

**Fail conditions:** Chips are unlabeled (announce as "button button button" with no distinction).

### Scenario 7 — Fullscreen toggle

1. Open the FAB radial menu.
2. Tab to the Fullscreen item.
3. Press `Enter`.

**Expected:** Browser enters fullscreen. SR announces the state change ("fullscreen on"). `Esc` exits fullscreen, SR announces "fullscreen off".

**Fail conditions:** Fullscreen activates silently. User doesn't know they entered fullscreen.

### Scenario 8 — Reduced motion respect

1. Enable "Reduce motion" in the OS accessibility settings.
2. Reload the demo.

**Expected:** Ambient EQ + pulso animations are static (visible but not animating). The auto-demo tour stops auto-progressing — manual click-to-advance only.

**Fail conditions:** Animations still run despite reduced-motion preference. Tour auto-advances.

### Scenario 9 — Resize without mouse

1. Tab to the resize handle (if focusable).
2. Use arrow keys to resize.

**Expected:** Either (a) the handle has keyboard support with arrow-key resize + SR announce of new dimensions, OR (b) the handle is explicitly excluded from the tab order with a documented note that resize is a pointer-only affordance.

**Fail conditions:** Handle is focusable but arrow keys do nothing (broken keyboard equivalent).

### Scenario 10 — FAB drag-to-reposition

Same as Scenario 9 but for the FAB drag. Either keyboard-equivalent or explicitly excluded with documentation.

## Reporting template

Copy this into `docs/universal/SCREEN_READER_REPORT.md` and fill it in:

```markdown
# Screen-reader manual test report — vX.Y.Z

Tested by: NAME · Date: YYYY-MM-DD · Demo URL: …

## Matrix results

| OS         | SR          | Browser     | Pass | Fail | Partial | Notes                        |
| ---------- | ----------- | ----------- | ---- | ---- | ------- | ---------------------------- |
| Windows    | NVDA 2024.4 | Firefox 134 | 8    | 1    | 1       | (link to per-scenario notes) |
| macOS 14.4 | VoiceOver   | Safari 17.4 | 9    | 1    | 0       | ...                          |
| ...        |             |             |      |      |         |                              |

## Detailed failures per scenario

### Scenario 5 — Volume / progress slider — FAIL on NVDA / Firefox

The slider's `role="slider"` is correct but the announce template reads "slider, 138.234567" instead of "slider, 2 minutes 18 seconds". Need an `aria-valuetext` attribute on the progress element.

Fix: add `aria-valuetext={engine.fmt(currentTime)}` to the progress role.

…

## Triage outcome

- 3 fixes shipped in vX.Y.Z+1 → re-run plan, confirm all green.
- 1 scenario (resize handle keyboard) accepted as known-allowed → noted in CHANGELOG.
```

## When this matters

For an MIT OSS component, "we passed Axe-core" is the bar consumers usually accept. For a **commercial** Pulse offering (premium themes, support contracts), the manual SR report is what enterprise customers ask for in their procurement checklist. The work pays for itself once the first enterprise customer signs.

Timeline estimate: **2-3 hours** for one OS × one SR × one browser combination, including writing up the report. Six combinations = a full day. Done once per major version, then incrementally for each chrome change.
