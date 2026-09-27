import { PulseEngine, setSharedEngine, type AudioFrame } from '@pulse-music/web-component'
import { demoTracks } from '../../../shared-tracks'

/**
 * The single audio session of the site. The module is evaluated once and
 * survives client-side navigation, so the music never stops between pages.
 */
let media: HTMLAudioElement | null = null
export const engine = new PulseEngine({
  tracks: demoTracks(import.meta.env.BASE_URL),
  volume: 0.85,
  // Keep a hand on the <audio> element: the turntable (deck.ts) bends its
  // playback rate the way a real platter spins up and runs down.
  createAudio: () => (media = new Audio()),
})
setSharedEngine(engine)

/** The engine's <audio> element, once created. */
export const getMedia = (): HTMLAudioElement | null => media

/** Latest visualiser frame, shared by every visual on the page. */
export const frame: { bands: Float32Array; energy: number; bass: number; live: boolean } = {
  bands: new Float32Array(24),
  energy: 0,
  bass: 0,
  live: false,
}

const listeners = new Set<(f: typeof frame) => void>()
let off: (() => void) | null = null

function onFrame(f: AudioFrame): void {
  frame.bands.set(f.bands)
  frame.energy = f.energy
  frame.bass = ((f.bands[0] ?? 0) + (f.bands[1] ?? 0) + (f.bands[2] ?? 0) + (f.bands[3] ?? 0)) / 4
  frame.live = true
  for (const fn of listeners) fn(frame)
}

/** Subscribe a visual to the shared frame loop (the engine loop runs only while needed). */
export function subscribeFrames(fn: (f: typeof frame) => void): () => void {
  listeners.add(fn)
  off ??= engine.onFrame(onFrame)
  return () => {
    listeners.delete(fn)
    if (!listeners.size && off) {
      off()
      off = null
      frame.live = false
    }
  }
}
