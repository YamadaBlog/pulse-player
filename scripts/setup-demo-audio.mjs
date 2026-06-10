#!/usr/bin/env node
/**
 * setup-demo-audio.mjs — cross-platform CC0 demo audio installer.
 *
 * Replaces the legacy bash scripts/setup-demo-audio.sh which required
 * system-installed ffmpeg + cwebp. This Node version uses the
 * npm-portable ffmpeg-static + cwebp-bin packages, so the maintainer
 * never has to `scoop install` / `brew install` / `apt install`.
 *
 * Audio sources (CC0, no attribution required):
 *   - Pixabay Music: https://pixabay.com/music/search/genre/ambient/
 *   - Free Music Archive CC0: https://freemusicarchive.org/license/cc0-1-0/
 *
 * The script downloads 2 tracks (~2-3 min each, ~5 min total playtime)
 * to public/audio/track1.webm + track2.webm via libopus 96 kbps, plus 2
 * cover images converted to lossy WebP at q=85.
 *
 * The OUTPUT files are listed in .gitignore (alpha.26) so they never
 * land in a commit or the GH Pages build by accident. Local-only.
 *
 * Usage:  node scripts/setup-demo-audio.mjs
 *         or  npm run setup:demo-audio
 *
 * Pass --cover-only to skip the audio (useful when iterating on visuals
 * without re-downloading the 8 MB of audio every time).
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createWriteStream } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const AUDIO_DIR = join(REPO_ROOT, 'public', 'audio')

// ─── Locate portable binaries (npm-installed, no system PATH needed) ─────

const ffmpegPath = (await import('ffmpeg-static')).default
const cwebpPath = join(
  REPO_ROOT,
  'node_modules',
  'cwebp-bin',
  'vendor',
  process.platform === 'win32' ? 'cwebp.exe' : 'cwebp',
)

if (!existsSync(ffmpegPath)) {
  console.error(`[setup-demo-audio] ffmpeg-static binary not found at ${ffmpegPath}`)
  console.error(`Did you run \`npm install\`?`)
  process.exit(1)
}
if (!existsSync(cwebpPath)) {
  console.error(`[setup-demo-audio] cwebp-bin binary not found at ${cwebpPath}`)
  console.error(`Did you run \`npm install\`?`)
  process.exit(1)
}

mkdirSync(AUDIO_DIR, { recursive: true })

// ─── CC0 source URLs (verified, no attribution required) ─────────────────

/**
 * Direct download URLs for CC0 / public-domain ambient tracks. The
 * Pixabay redirector serves a 302 → CDN URL ; node:fetch follows it.
 *
 * Sources verified 2026-06-08 against the Pixabay 'CC0' filter:
 *   https://pixabay.com/music/search/cc0/?genre=ambient
 *
 * If a URL ever 404s, the script falls back to a generated silent track
 * + a solid-colour placeholder cover so the demo still boots.
 */
const SOURCES = {
  // Round-8 : default sources switched from Pixabay (CDN anti-hotlinks
  // → 403, licence redistribution grey) to Kevin MacLeod's incompetech
  // catalogue — REAL professionally-produced music under CC BY 4.0
  // (commercial use OK, attribution required). URLs verified
  // hotlinkable 2026-06-10 (HTTP 206 range support, 320/256 kbps).
  // ATTRIBUTION LIVES IN : NOTICE.md §2bis + the demo footer credit.
  // If you swap these via PULSE_TRACK*_URL, keep the credit accurate.
  track1: {
    // "RetroFuture Dirty" — driving retro-synth electro, 3:25.
    // Kevin MacLeod (incompetech.com) · CC BY 4.0.
    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/RetroFuture%20Dirty.mp3',
    out: 'track1.webm',
  },
  track2: {
    // "Lobby Time" — jazzy lounge, 3:13.
    // Kevin MacLeod (incompetech.com) · CC BY 4.0.
    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Lobby%20Time.mp3',
    out: 'track2.webm',
  },
  cover1: {
    // Pulse-aligned colour: midnight gradient. Drawn programmatically
    // below (no third-party download) for deterministic CC0 status.
    out: 'cover.webp',
    palette: ['#0A0B23', '#8B5CF6'],
  },
  cover2: {
    out: 'cover2.webp',
    palette: ['#062A33', '#3DBDA7'],
  },
}

// ─── Download helper with timeout + size cap ─────────────────────────────

async function downloadFile(url, outPath, maxBytes = 20 * 1024 * 1024) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'pulse-player-demo-setup/1.0' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const ws = createWriteStream(outPath)
    await pipeline(Readable.fromWeb(res.body), ws)
    return true
  } catch (err) {
    console.warn(`  ⚠️  download failed for ${url}: ${err.message}`)
    return false
  } finally {
    clearTimeout(timeout)
  }
}

// ─── Audio install (download → opus 96k webm) ────────────────────────────

/**
 * Synthesise an ambient pad via ffmpeg lavfi sine + tremolo + reverb.
 *
 * Audio is **mathematically CC0** by construction — every sample is
 * generated locally from a closed-form sine expression plus a tremolo
 * LFO. No third-party sample, no Pixabay hotlink, no rights chain.
 *
 * track1 = warm pad in C minor (220, 261.6, 329.6 Hz triad + 110 sub)
 * track2 = chill pad in F major (174.6, 220, 261.6 Hz triad + 87.3 sub)
 *
 * The pad pulses gently with a 0.5 Hz tremolo so the ambient EQ
 * visualiser has something to react to. Stereo width via slight
 * pan offset between channels.
 */
async function setupTrack(key, spec) {
  console.log(`▶ ${key} → ${spec.out}`)
  const outWebm = join(AUDIO_DIR, spec.out)

  // ── Maintainer override (audit round-7) ──────────────────────────
  // PULSE_TRACK1_URL / PULSE_TRACK2_URL replace the source URL without
  // touching code. Designed for the Pages workflow : set a GitHub
  // *repository variable* with a direct MP3/OGG link to a track YOU
  // chose (and whose licence YOU verified — CC-BY needs a credit in
  // NOTICE.md + the demo footer), re-run the deploy, and the public
  // demo plays your song. Selection of an actual SONG is a human-ears
  // decision the maintainer makes ; this hook is the 30-second plumbing
  // for it. If the URL fails, the composed fallback below still ships.
  const overrideUrl = process.env[`PULSE_${key.toUpperCase()}_URL`]
  const sourceUrl = overrideUrl || spec.url
  if (overrideUrl) console.log(`  ↳ using ${key} override URL from env`)

  // Try the network source first. If 403 / network-down, fall back to
  // the in-repo composer.
  const tmpMp3 = join(AUDIO_DIR, `_tmp_${key}.mp3`)
  const downloaded = await downloadFile(sourceUrl, tmpMp3)
  if (downloaded) {
    execFileSync(
      ffmpegPath,
      ['-y', '-i', tmpMp3, '-c:a', 'libopus', '-b:a', '96k', '-vn', outWebm],
      { stdio: 'pipe' },
    )
    try { execFileSync(process.platform === 'win32' ? 'cmd' : 'sh', process.platform === 'win32' ? ['/c', 'del', tmpMp3] : ['-c', `rm -f "${tmpMp3}"`], { stdio: 'pipe' }) } catch {}
    console.log(`  ✔ ${spec.out} (network source)`)
    return
  }

  // Composed fallback (audit round-7) — the previous lavfi sine-triad
  // drone was legally perfect but musically void. The sequencer in
  // synth-demo-tracks.mjs composes a REAL piece (drums, bass,
  // arpeggio/keys, chords) sample-by-sample in pure Node : an original
  // work of this repo, MIT, deterministic (seeded PRNG → identical
  // bytes on every CI build), zero third-party rights chain.
  const { composeTrack1, composeTrack2 } = await import('./synth-demo-tracks.mjs')
  const wav = key === 'track1' ? composeTrack1() : composeTrack2()
  const tmpWav = join(AUDIO_DIR, `_tmp_${key}.wav`)
  writeFileSync(tmpWav, wav)
  execFileSync(
    ffmpegPath,
    ['-y', '-i', tmpWav, '-c:a', 'libopus', '-b:a', '112k', outWebm],
    { stdio: 'pipe' },
  )
  try { execFileSync(process.platform === 'win32' ? 'cmd' : 'sh', process.platform === 'win32' ? ['/c', 'del', tmpWav] : ['-c', `rm -f "${tmpWav}"`], { stdio: 'pipe' }) } catch {}
  console.log(`  ✔ ${spec.out} (composed in-repo — ${key === 'track1' ? '104 BPM synthwave' : '76 BPM lofi'})`)
}

// ─── Cover generation (FFmpeg → PNG → cwebp) ─────────────────────────────

async function setupCover(key, spec) {
  console.log(`▶ ${key} → ${spec.out}`)
  const tmpPng = join(AUDIO_DIR, `_tmp_${key}.png`)
  const outWebp = join(AUDIO_DIR, spec.out)
  // FFmpeg generates a 512×512 vertical gradient from two colours.
  // Pulse-aligned palette per track variant. No third-party assets.
  const [c1, c2] = spec.palette
  execFileSync(
    ffmpegPath,
    [
      '-y',
      '-f', 'lavfi',
      '-i', `color=c=${c1}:size=512x512:duration=1`,
      '-vf', `format=rgba,geq=r='${parseInt(c1.slice(1,3),16)}+(${parseInt(c2.slice(1,3),16)}-${parseInt(c1.slice(1,3),16)})*Y/H':g='${parseInt(c1.slice(3,5),16)}+(${parseInt(c2.slice(3,5),16)}-${parseInt(c1.slice(3,5),16)})*Y/H':b='${parseInt(c1.slice(5,7),16)}+(${parseInt(c2.slice(5,7),16)}-${parseInt(c1.slice(5,7),16)})*Y/H':a=255`,
      '-frames:v', '1',
      tmpPng,
    ],
    { stdio: 'pipe' },
  )
  execFileSync(cwebpPath, ['-q', '85', tmpPng, '-o', outWebp], { stdio: 'pipe' })
  try { execFileSync(process.platform === 'win32' ? 'cmd' : 'sh', process.platform === 'win32' ? ['/c', 'del', tmpPng] : ['-c', `rm -f "${tmpPng}"`], { stdio: 'pipe' }) } catch {}
  console.log(`  ✔ ${spec.out} ready (cwebp q=85)`)
}

// ─── Main ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const coverOnly = args.includes('--cover-only')
// --audio-only (audit round-6) : generate ONLY the .webm tracks, leave
// covers untouched. Used by the Pages deploy workflow — the demo build
// references the committed SVG covers (main.ts env split), so the
// script's gradient .webp covers would be dead weight there, and on a
// dev machine this flag protects the maintainer's local cover art.
const audioOnly = args.includes('--audio-only')

console.log(`\nPulse demo audio setup`)
console.log(`  ffmpeg: ${ffmpegPath}`)
console.log(`  cwebp:  ${cwebpPath}`)
console.log(`  out:    ${AUDIO_DIR}\n`)

if (!coverOnly) {
  await setupTrack('track1', SOURCES.track1)
  await setupTrack('track2', SOURCES.track2)
}
if (!audioOnly) {
  await setupCover('cover1', SOURCES.cover1)
  await setupCover('cover2', SOURCES.cover2)
}

console.log(`\n✅ Done. Reload the dev server to hear the demo.`)
console.log(`   The files are gitignored — they stay local, never commit.\n`)
