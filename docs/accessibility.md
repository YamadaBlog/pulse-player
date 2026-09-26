# Accessibility

Pulse aims for WCAG 2.2 AA out of the box. The showcase and every theme × width combination of the player are scanned with axe-core in CI.

## What you get

- **Real controls.** Native `<button>`s with labels that follow the state ("Play" / "Pause"), a `role="slider"` seek bar with a spoken value ("1:02 of 3:12"), and a group label naming the track ("Music player: Projector Screen, HoliznaCC0").
- **Keyboard.** Every action is reachable with <kbd>Tab</kbd>; media shortcuts (<kbd>K</kbd>, <kbd>J</kbd>/<kbd>L</kbd>, <kbd>M</kbd>, <kbd>Shift</kbd>+<kbd>N</kbd>/<kbd>P</kbd>) work while focus is inside a player. The floating player's menu follows the menu-button pattern (arrows, <kbd>Home</kbd>/<kbd>End</kbd>, <kbd>Esc</kbd> returns focus). Full map in the [reference](./reference/elements.md#keyboard).
- **Alternatives to dragging.** Seeking, resizing and the FAB menu all work without a pointer drag (WCAG 2.5.7).
- **Target size.** Interactive targets are at least 24 × 24 px (WCAG 2.5.8), the seek bar included.
- **Status messages.** Playback errors are announced through a polite live region.
- **OS integration.** Media Session support means hardware media keys, headsets, the lock screen and the notification shade control playback and show the track.
- **Motion.** `prefers-reduced-motion: reduce` disables every animation and stops the visualiser loop (not just hides it). Changes to the preference apply live.
- **Forced colours.** Windows High Contrast keeps borders, focus rings and the progress fill visible.
- **Localisation.** Every string is overridable through `labels`; nothing is hard-coded.

## Your responsibilities

- Provide meaningful `title` and `artist` values — they become the accessible names.
- Keep autoplay user-initiated (browsers enforce it anyway).
- If you hide the built-in controls with `::part()`, provide equivalent ones.

## Testing it yourself

```bash
npm run build -w @pulse-music/site -w @pulse-music/demo-vanilla
npm run test:e2e      # includes the axe-core scans
```

Screen-reader spot checks are welcome in issues — please mention the reader, browser and OS.
