# Pulse — brand assets

Visual identity for the Pulse multi-framework music player project.

## Logo

- [`logo.svg`](./logo.svg) — dark background variant (default). Heartbeat waveform mark over a deep night background (`#05050A`) with a violet → teal gradient stroke (`#8B5CF6` → `#3DBDA7`).
- [`logo-light.svg`](./logo-light.svg) — light background variant. Same waveform mark, white background.

The waveform itself echoes the **pulso heartbeat ring** that animates around the FAB component when audio is playing — the same product feature lifted into the brand mark.

## Colour palette

| Token              | Hex                         | Usage                                               |
| ------------------ | --------------------------- | --------------------------------------------------- |
| `--pulse-bg-dark`  | `#05050A`                   | Default page background, FAB inner                  |
| `--pulse-accent-1` | `#8B5CF6`                   | Gradient start (violet)                             |
| `--pulse-accent-2` | `#3DBDA7`                   | Gradient end (teal)                                 |
| `--pulse-text-low` | `rgba(255, 255, 255, 0.55)` | Low-emphasis caption text (WCAG AA at 0.55 opacity) |

## Typography

The repo doesn't ship a custom typeface. The reference Vue demo uses the system stack (`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`). Future paid theme packs may include a custom display face — the brand mark itself is typeface-independent.

## Usage rules

- Mark may be used freely under MIT licence.
- **Do** retain the gradient direction (top-left → bottom-right) when re-colouring.
- **Don't** add additional flourishes inside the rounded square — the mark is the waveform, full stop.
- Minimum size: 16 px (square). Below that, the waveform geometry stops being legible.

## Files

- `logo.svg` — 64×64 viewBox, dark background, full mark.
- `logo-light.svg` — 64×64 viewBox, light background.
- `../../public/favicon.svg` — 32×32 viewBox, simplified for browser tab rendering.

Generating PNG fallbacks (for npm README rendering, social media): use any vector editor or `rsvg-convert logo.svg -o logo.png -w 256 -h 256`.

## Trademark status

"Pulse" / "pulse-player" are NOT registered trademarks yet (see [`LICENSING.md`](../universal/LICENSING.md) §"Trademark notes"). The mark above is the maintainer's preferred visual identity but cannot be enforced against third parties using a similar shape — only filing via USPTO / EUIPO would change that.
