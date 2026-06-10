#!/usr/bin/env node
/**
 * synth-demo-tracks.mjs — programmatic music composer for the demo.
 *
 * Audit round-7 : the previous synthesis fallback produced a static
 * sine-triad drone — legally perfect, musically void ("le son est
 * nul"). Licensed catalogue downloads stay blocked (Pixabay CDN
 * anti-hotlinks with 403) and redistributing third-party "free" tracks
 * is the provenance trap NOTICE.md §3 exists to avoid.
 *
 * This module solves both constraints at once : it COMPOSES two real
 * pieces — drums, bass, arpeggio, chords, not a drone — sample by
 * sample in pure Node (no audio deps), writes them as WAV, and the
 * caller transcodes to opus. The output is an ORIGINAL WORK of this
 * repository : MIT like the source, CC0-equivalent by construction,
 * no third-party rights chain, deterministic (seeded PRNG) so every
 * CI build ships byte-identical audio.
 *
 *   track1 — "MIDNIGHT RUN"  · 104 BPM dark synthwave
 *            Am → F → C → G loop, sawtooth-ish arpeggio in 8ths,
 *            octave bass, four-on-the-floor kick, off-beat hats,
 *            snare on 2 & 4, airy pad under it all.
 *   track2 — "DEEP FOCUS"    · 76 BPM lofi
 *            Fmaj7 → Em7 → Dm7 → Cmaj7, Rhodes-like keys with slow
 *            tremolo, soft kick, rimshot snare, swung hats, vinyl
 *            crackle bed.
 *
 * Tuning the music = editing the PATTERN constants below ; the
 * synthesis layer doesn't need touching.
 *
 * Usage :  node scripts/synth-demo-tracks.mjs <outDir>
 *          writes <outDir>/track1.wav + <outDir>/track2.wav
 *          (also exported as composeTrack1/composeTrack2 for callers)
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SR = 44100 // sample rate

// ─── Deterministic PRNG (mulberry32) — same noise every build ───────
function prng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Note helpers ────────────────────────────────────────────────────
const A4 = 440
/** MIDI note number → frequency. */
const mtof = (m) => A4 * Math.pow(2, (m - 69) / 12)
// Named notes (MIDI numbers) used by the patterns.
const N = {
  C2: 36, D2: 38, E2: 40, F2: 41, G2: 43, A2: 45, B2: 47,
  C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59,
  C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71,
  C5: 72, D5: 74, E5: 76, G5: 79, A5: 81,
}

// ─── Stereo mix buffer ───────────────────────────────────────────────
function makeMix(seconds) {
  const len = Math.ceil(seconds * SR)
  return { L: new Float64Array(len), R: new Float64Array(len), len }
}

/** Add a rendered voice into the mix at `start` seconds, with pan -1..1. */
function addVoice(mix, start, samples, gain, pan = 0) {
  const off = Math.floor(start * SR)
  const gl = gain * Math.min(1, 1 - pan)
  const gr = gain * Math.min(1, 1 + pan)
  for (let i = 0; i < samples.length; i++) {
    const j = off + i
    if (j >= mix.len) break
    mix.L[j] += samples[i] * gl
    mix.R[j] += samples[i] * gr
  }
}

// ─── Instruments (each returns a Float64Array) ───────────────────────

/** Plucked synth note : detuned saw-ish stack + exp decay. */
function pluck(freq, dur, { bright = 1, detune = 1.004 } = {}) {
  const n = Math.floor(dur * SR)
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const env = Math.exp(-t * 5.5) * Math.min(1, t * 400) // fast attack, ~180ms decay
    // Poor-man's saw : first 4 harmonics at 1/k, plus a detuned copy
    // for width. Cheap, warm, reads "synth" instead of "beep".
    let s = 0
    for (let k = 1; k <= 4; k++) {
      s += (Math.sin(2 * Math.PI * freq * k * t) / k) * (k === 1 ? 1 : bright)
      s += (Math.sin(2 * Math.PI * freq * detune * k * t) / k) * 0.6 * (k === 1 ? 1 : bright)
    }
    out[i] = s * env * 0.22
  }
  return out
}

/** Rhodes-ish key : sine + soft 4th harmonic + slow tremolo, long decay. */
function rhodes(freq, dur) {
  const n = Math.floor(dur * SR)
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const env = Math.exp(-t * 1.6) * Math.min(1, t * 200)
    const trem = 1 + 0.12 * Math.sin(2 * Math.PI * 4.2 * t)
    const s =
      Math.sin(2 * Math.PI * freq * t) +
      0.18 * Math.sin(2 * Math.PI * freq * 4 * t) * Math.exp(-t * 6) +
      0.08 * Math.sin(2 * Math.PI * freq * 2.01 * t)
    out[i] = s * env * trem * 0.3
  }
  return out
}

/** Bass : sine + 2nd harmonic, punchy decay. */
function bass(freq, dur) {
  const n = Math.floor(dur * SR)
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const env = Math.exp(-t * 3.2) * Math.min(1, t * 300)
    const s = Math.sin(2 * Math.PI * freq * t) + 0.35 * Math.sin(2 * Math.PI * freq * 2 * t)
    out[i] = s * env * 0.5
  }
  return out
}

/** Soft pad chord tone : pure-ish sine, slow attack, holds. */
function padTone(freq, dur) {
  const n = Math.floor(dur * SR)
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const a = Math.min(1, t / 0.8)
    const r = Math.min(1, (dur - t) / 0.8)
    const s =
      Math.sin(2 * Math.PI * freq * t) + 0.5 * Math.sin(2 * Math.PI * freq * 1.005 * t)
    out[i] = s * a * r * 0.08
  }
  return out
}

/** Kick : sine pitch-drop 110→42 Hz, click transient. */
function kick(dur = 0.22) {
  const n = Math.floor(dur * SR)
  const out = new Float64Array(n)
  let phase = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = 42 + 68 * Math.exp(-t * 28)
    phase += (2 * Math.PI * f) / SR
    const env = Math.exp(-t * 16)
    out[i] = (Math.sin(phase) + 0.2 * Math.exp(-t * 90)) * env
  }
  return out
}

/** Hat : seeded noise, very fast decay, crude highpass (first diff). */
function hat(rand, dur = 0.05, open = false) {
  const n = Math.floor((open ? dur * 3 : dur) * SR)
  const out = new Float64Array(n)
  let prev = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const white = rand() * 2 - 1
    const hp = white - prev // ~6dB/oct highpass
    prev = white
    out[i] = hp * Math.exp(-t * (open ? 28 : 90)) * 0.5
  }
  return out
}

/** Snare : noise burst + 190 Hz body. */
function snare(rand, dur = 0.18, soft = false) {
  const n = Math.floor(dur * SR)
  const out = new Float64Array(n)
  let prev = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const white = rand() * 2 - 1
    const hp = white - prev * 0.5
    prev = white
    const noise = hp * Math.exp(-t * 26)
    const body = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 30)
    out[i] = (noise * (soft ? 0.35 : 0.7) + body * 0.5) * (soft ? 0.6 : 1)
  }
  return out
}

/** Vinyl crackle bed : sparse seeded ticks + faint hiss. */
function crackle(rand, dur) {
  const n = Math.floor(dur * SR)
  const out = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    let s = (rand() * 2 - 1) * 0.012 // hiss floor
    if (rand() < 0.00012) s += (rand() * 2 - 1) * 0.6 // tick
    out[i] = s
  }
  return out
}

// ─── Composition : track 1 — "MIDNIGHT RUN" (104 BPM synthwave) ─────
export function composeTrack1() {
  const BPM = 104
  const beat = 60 / BPM
  const bar = beat * 4
  const BARS = 32 // ~74 s
  const dur = BARS * bar + 3
  const mix = makeMix(dur)
  const rand = prng(0xdead)

  // Am, F, C, G — one chord per bar, looped.
  const CHORDS = [
    { root: N.A2, tones: [N.A3, N.C4, N.E4] },
    { root: N.F2, tones: [N.F3, N.A3, N.C4] },
    { root: N.C3, tones: [N.C4, N.E4, N.G4] },
    { root: N.G2, tones: [N.G3, N.B3, N.D4] },
  ]

  for (let barIdx = 0; barIdx < BARS; barIdx++) {
    const t0 = barIdx * bar
    const ch = CHORDS[barIdx % 4]
    const intro = barIdx < 2 // drums sit out the first 2 bars
    const breakdown = barIdx >= 16 && barIdx < 20 // pad-only breakdown

    // Pad (always)
    for (const m of ch.tones) addVoice(mix, t0, padTone(mtof(m - 12), bar * 1.05), 1, 0)

    if (breakdown) continue

    // Bass : root 8ths, octave pop on the "and" of 3
    for (let e = 0; e < 8; e++) {
      const m = e === 5 ? ch.root + 12 : ch.root
      addVoice(mix, t0 + e * (beat / 2), bass(mtof(m), beat * 0.45), 0.8, 0)
    }

    // Arpeggio : 8th-note up-down across 2 octaves, slight L/R ping-pong
    const arp = [...ch.tones, ch.tones[0] + 12, ch.tones[1] + 12, ch.tones[2] + 12]
    const order = [0, 1, 2, 3, 4, 5, 4, 2]
    if (!intro)
      for (let e = 0; e < 8; e++) {
        const m = arp[order[e]]
        addVoice(mix, t0 + e * (beat / 2), pluck(mtof(m), beat * 0.5), 0.5, e % 2 ? 0.35 : -0.35)
      }

    if (intro) continue

    // Drums
    for (let b = 0; b < 4; b++) addVoice(mix, t0 + b * beat, kick(), 0.95, 0)
    addVoice(mix, t0 + 1 * beat, snare(rand), 0.5, 0.05)
    addVoice(mix, t0 + 3 * beat, snare(rand), 0.5, 0.05)
    for (let e = 0; e < 8; e++)
      addVoice(mix, t0 + e * (beat / 2) + beat / 4, hat(rand, 0.05, e === 7), 0.4, 0.2)
  }

  return finalize(mix, 0.5)
}

// ─── Composition : track 2 — "DEEP FOCUS" (76 BPM lofi) ─────────────
export function composeTrack2() {
  const BPM = 76
  const beat = 60 / BPM
  const bar = beat * 4
  const BARS = 24 // ~76 s
  const dur = BARS * bar + 3
  const mix = makeMix(dur)
  const rand = prng(0xbeef)

  // Fmaj7, Em7, Dm7, Cmaj7 — one per bar.
  const CHORDS = [
    { root: N.F2, tones: [N.F3, N.A3, N.C4, N.E4] },
    { root: N.E2, tones: [N.E3, N.G3, N.B3, N.D4] },
    { root: N.D2, tones: [N.D3, N.F3, N.A3, N.C4] },
    { root: N.C2, tones: [N.C3, N.E3, N.G3, N.B3] },
  ]
  const swing = beat * 0.08 // lazy off-beats

  // Vinyl bed under the whole take
  addVoice(mix, 0, crackle(prng(0xcafe), dur - 0.5), 1, 0)

  for (let barIdx = 0; barIdx < BARS; barIdx++) {
    const t0 = barIdx * bar
    const ch = CHORDS[barIdx % 4]
    const intro = barIdx < 1

    // Keys : chord stab on 1, re-voiced echo on the "and of 2"
    for (const [i, m] of ch.tones.entries())
      addVoice(mix, t0 + i * 0.012, rhodes(mtof(m), beat * 2.4), 0.55, i % 2 ? 0.25 : -0.25)
    for (const [i, m] of ch.tones.slice(1).entries())
      addVoice(mix, t0 + 2.5 * beat + i * 0.012, rhodes(mtof(m), beat * 1.4), 0.3, 0.15)

    // Melody : sparse seeded noodling on chord tones (pentatonic-safe)
    if (barIdx % 2 === 1) {
      const pool = [...ch.tones.map((m) => m + 12)]
      const e = Math.floor(rand() * 3)
      addVoice(mix, t0 + e * beat + swing, rhodes(mtof(pool[Math.floor(rand() * pool.length)]), beat * 1.2), 0.28, 0.3)
    }

    if (intro) continue

    // Bass : root on 1, fifth on the "and of 3"
    addVoice(mix, t0, bass(mtof(ch.root), beat * 1.6), 0.7, 0)
    addVoice(mix, t0 + 2.5 * beat + swing, bass(mtof(ch.root + 7), beat * 0.8), 0.5, 0)

    // Drums : soft kick 1 & "and of 2", rim on 2 & 4, swung hats
    addVoice(mix, t0, kick(0.25), 0.7, 0)
    addVoice(mix, t0 + 1.5 * beat + swing, kick(0.2), 0.5, 0)
    addVoice(mix, t0 + 1 * beat, snare(rand, 0.12, true), 0.45, 0.1)
    addVoice(mix, t0 + 3 * beat, snare(rand, 0.12, true), 0.45, 0.1)
    for (let e = 0; e < 8; e++)
      addVoice(mix, t0 + e * (beat / 2) + (e % 2 ? swing : 0) + beat / 4, hat(rand, 0.04), 0.22, -0.15)
  }

  return finalize(mix, 0.55)
}

// ─── Master : soft-clip, normalise, fades, encode WAV ────────────────
function finalize(mix, gain) {
  const { L, R, len } = mix
  // Soft clip + peak scan
  let peak = 0
  for (let i = 0; i < len; i++) {
    L[i] = Math.tanh(L[i] * gain)
    R[i] = Math.tanh(R[i] * gain)
    const p = Math.max(Math.abs(L[i]), Math.abs(R[i]))
    if (p > peak) peak = p
  }
  const norm = peak > 0 ? 0.89 / peak : 1
  // Fades
  const fadeIn = Math.floor(0.6 * SR)
  const fadeOut = Math.floor(2.5 * SR)
  for (let i = 0; i < len; i++) {
    let g = norm
    if (i < fadeIn) g *= i / fadeIn
    if (i > len - fadeOut) g *= Math.max(0, (len - i) / fadeOut)
    L[i] *= g
    R[i] *= g
  }
  // 16-bit PCM stereo WAV
  const data = Buffer.alloc(len * 4)
  for (let i = 0; i < len; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), i * 4)
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), i * 4 + 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(2, 22) // stereo
  header.writeUInt32LE(SR, 24)
  header.writeUInt32LE(SR * 4, 28)
  header.writeUInt16LE(4, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

// ─── CLI ─────────────────────────────────────────────────────────────
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())
if (isMain) {
  const outDir = process.argv[2] ?? '.'
  mkdirSync(outDir, { recursive: true })
  console.log('♪ composing track1 — MIDNIGHT RUN (104 BPM synthwave)…')
  writeFileSync(join(outDir, 'track1.wav'), composeTrack1())
  console.log('♪ composing track2 — DEEP FOCUS (76 BPM lofi)…')
  writeFileSync(join(outDir, 'track2.wav'), composeTrack2())
  console.log('✅ WAVs written to', outDir)
}
