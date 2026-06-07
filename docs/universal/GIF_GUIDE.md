# Optional — creating a GIF for the README hero

The README already embeds the YouTube demo (`https://youtu.be/q_FJ1GWaCc8`) as a clickable thumbnail, which is the modern best practice for component-library READMEs:

- ✅ Zero repo weight (GIF would add 2-10 MB to every clone)
- ✅ Plays in real time at full fidelity
- ✅ YouTube CDN serves at any resolution
- ✅ Comments + analytics + chapters out of the box

This guide is for the case where you want an **animated GIF** in addition to (or instead of) the YouTube embed — e.g. for npm package README (which doesn't autoplay YouTube embeds) or for a social-media share.

## Path A — Extract the GIF from the existing YouTube video

The fastest path. You already have the canonical demo recorded; just clip + compress it.

### Tooling

| Tool       | Install                                                                    | Use                           |
| ---------- | -------------------------------------------------------------------------- | ----------------------------- |
| `yt-dlp`   | [github.com/yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp)               | Download YouTube video as MP4 |
| `ffmpeg`   | `brew install ffmpeg` / `sudo apt install ffmpeg` / `scoop install ffmpeg` | Extract clip + convert to GIF |
| `gifsicle` | `brew install gifsicle` / `sudo apt install gifsicle`                      | Optimise GIF size (optional)  |

### Workflow

```bash
# 1. Download the demo as MP4 at 1080p
yt-dlp -f 'bv*[height<=1080]+ba/b[height<=1080]' \
       -o 'pulse-demo.mp4' \
       'https://youtu.be/q_FJ1GWaCc8'

# 2. Clip the hero moment (adjust -ss start time + -t duration)
ffmpeg -i pulse-demo.mp4 -ss 00:00:05 -t 8 -an clip.mp4

# 3. Generate an optimised palette (sharper colours, smaller file)
ffmpeg -i clip.mp4 -vf 'fps=20,scale=720:-1:flags=lanczos,palettegen' palette.png

# 4. Render the GIF using that palette
ffmpeg -i clip.mp4 -i palette.png \
       -lavfi 'fps=20,scale=720:-1:flags=lanczos [x]; [x][1:v] paletteuse' \
       docs/screenshots/hero.gif

# 5. Optional second-pass optimisation (often saves 30-50 %)
gifsicle -O3 --lossy=80 docs/screenshots/hero.gif -o docs/screenshots/hero.gif
```

Target dimensions: **720 px wide** (sharp on retina, light enough to ship). Target weight: **under 3 MB**. If yours is heavier, drop `fps` from 20 → 15, or shorten the clip.

## Path B — Re-record from the running demo (more control)

If you want a specific motion (e.g. only the resize handle interaction, or only the FAB menu opening), record fresh.

### macOS (built-in)

`Cmd+Shift+5` → "Record selected portion" → drag to enclose the player. Save as `.mov`. Convert:

```bash
ffmpeg -i recording.mov -ss 0 -t 6 \
       -vf 'fps=20,scale=720:-1:flags=lanczos' \
       docs/screenshots/hero.gif
```

### Windows — ScreenToGif

[ScreenToGif](https://www.screentogif.com/) is the standard tool. Free, MIT, native GIF output, built-in editor for trimming + delay tweaking.

1. Open ScreenToGif → Recorder
2. Drag the capture frame over the `<pulse-player>` element
3. Set FPS = 20, capture 5-10 seconds
4. Editor → Reduce frame count → Save as `docs/screenshots/hero.gif`

### Linux — Peek

[Peek](https://github.com/phw/peek) — `sudo apt install peek` — same workflow as ScreenToGif.

## Path C — Skip the GIF entirely (recommended)

The current README already does this: a clickable YouTube thumbnail with the play-button overlay. That solves 95 % of the use cases (browsing the GitHub repo, sharing the link on social) without adding repo weight.

The ONE case where a GIF actually wins is **npm package READMEs** — npmjs.com doesn't render YouTube embeds, only static images and GIFs. If you publish `@pulse/*` to npm, consider adding a 1-2 MB GIF to the `npm publish` tarball (but NOT to the git repo — list it in `.npmignore` if you keep it in `docs/screenshots/`).

## Where the GIF goes in the README

If you ship one, edit the top of `README.md`:

```markdown
# 🎵 pulse-player

### A premium drop-in music player, going universal.

<img src="./docs/screenshots/hero.gif" alt="Pulse player demo showing 9 themes, resize handle, and FAB menu" width="100%" />

[Watch the full 3-minute demo on YouTube →](https://youtu.be/q_FJ1GWaCc8)
```

Keep the YouTube link as fallback / complete walkthrough. The GIF is the 5-second eye-catcher.

## Decision tree

```
Will you ship the README to npmjs.com?
  ├── Yes  → ship a GIF (≤ 3 MB), keep YouTube link as fallback
  └── No   → YouTube thumbnail alone is enough (current setup)

Are you targeting Twitter / Bluesky / LinkedIn shares?
  ├── Yes  → ship a short GIF (3-5 s, ≤ 1 MB) optimised for autoplay
  └── No   → YouTube link alone is enough
```
