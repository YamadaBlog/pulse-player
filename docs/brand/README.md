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

## PNG renders

Generated via [`sharp`](https://sharp.pixelplumbing.com/) (libvips, no external binary needed on Windows / macOS / Linux):

- `logo-256.png` — 4.7 kB. Drop into npm package READMEs (~256 px box).
- `logo-512.png` — 12.9 kB. Drop into social media avatars / Twitter profile.
- `og-banner.png` — 30.8 kB. Open Graph + Twitter Card. Mirrored to [`public/og-banner.png`](../../public/og-banner.png) so it serves at `https://yamadablog.github.io/pulse-player/og-banner.png` after GH Pages deploy.

To regenerate after editing the SVGs, run from the repo root:

```bash
node -e "
const sharp = require('sharp')
const fs = require('fs')
sharp(fs.readFileSync('docs/brand/og-banner.svg'), { density: 144 })
  .resize(1200, 630).png({ quality: 95 })
  .toFile('docs/brand/og-banner.png')
sharp(fs.readFileSync('docs/brand/logo.svg'), { density: 300 })
  .resize(256, 256).png({ quality: 95 })
  .toFile('docs/brand/logo-256.png')
sharp(fs.readFileSync('docs/brand/logo.svg'), { density: 300 })
  .resize(512, 512).png({ quality: 95 })
  .toFile('docs/brand/logo-512.png')
sharp(fs.readFileSync('public/favicon.svg'), { density: 300 })
  .resize(32, 32).png()
  .toFile('public/favicon.png')
"
cp docs/brand/og-banner.png public/og-banner.png
```

## Setting the GitHub repo social preview (one-time)

After the og-banner.png is committed:

1. Go to https://github.com/YamadaBlog/pulse-player/settings
2. Scroll to **Social preview**
3. Click **Edit** → **Upload an image**
4. Pick `docs/brand/og-banner.png` (1200 × 630, 30.8 kB)

The repo's GitHub-rendered social preview (when someone shares the repo URL on Bluesky / LinkedIn / Discord) will then use the branded banner instead of GitHub's auto-generated one. This is a maintainer-only Settings page — Claude / contributors cannot set it via the API.

## Trademark status

"Pulse" / "pulse-player" are NOT registered trademarks yet (see [`LICENSING.md`](../universal/LICENSING.md) §"Trademark notes"). The mark above is the maintainer's preferred visual identity but cannot be enforced against third parties using a similar shape — only filing via USPTO / EUIPO would change that.
