# Demo audio + covers

This folder is **intentionally empty** in the repository and in the GH Pages deployment. Per [`NOTICE.md`](../../NOTICE.md) §3, the previous demo placeholders had undocumented provenance and could not be safely redistributed.

## Adding tracks locally

Run from the repo root:

```bash
npm run setup:demo-audio
```

This downloads CC0-licensed alternatives via [`scripts/setup-demo-audio.sh`](../../scripts/setup-demo-audio.sh). The script requires `ffmpeg` and `cwebp` on PATH (`scoop install ffmpeg webp` on Windows ; `brew install ffmpeg webp` on macOS ; `apt install ffmpeg webp` on Debian/Ubuntu).

The generated files are gitignored (`public/audio/*.{webm,mp3,webp}`) so they never leak into a commit or the GH Pages build.

## Custom tracks for your own demo

Drop your own `track1.webm` + `track2.webm` + `cover.webp` + `cover2.webp` in this folder. The [`useAudioStore.ts`](../../src/lib/useAudioStore.ts) `DEFAULT_TRACKS` constant references those exact filenames.

If you're integrating Pulse in a production app, override the playlist via the `tracks` prop (Vue / React / Svelte) or the `setAudioTracks()` engine action (Web Component / vanilla) — see [`docs/API.md`](../../docs/API.md). The demo `public/audio/` folder is only consumed by the in-repo demo.

## Why the live demo at GH Pages has no audio

By design — until the maintainer (or any contributor) PRs in a verified CC0 track + cover. The chrome UI animates correctly without audio source ; the play button shows the silent state. This is the legally-safe baseline.
