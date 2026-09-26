import type { Track } from '@pulse-music/types'

export const TRACK_ATTRIBUTES = [
  'src',
  'title',
  'artist',
  'album',
  'cover',
  'cover-pos',
  'cover-scale',
] as const

// `HTMLElement` doesn't exist during server rendering: fall back to a
// plain class so importing the package never throws in Node.
const Base = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement

/**
 * `<pulse-track>` — declares one playlist entry in plain HTML:
 *
 * ```html
 * <pulse-player>
 *   <pulse-track src="/a.mp3" title="Intro" artist="Me" cover="/a.jpg"></pulse-track>
 * </pulse-player>
 * ```
 *
 * It renders nothing; the parent player reads its attributes.
 *
 * @tagname pulse-track
 */
export class PulseTrackElement extends Base {
  connectedCallback(): void {
    this.hidden = true
  }

  /** The entry as a `Track`, or `null` when `src` is missing. */
  toTrack(): Track | null {
    return trackFrom(this)
  }
}

function trackFrom(el: Element): Track | null {
  const src = el.getAttribute('src')
  if (!src) return null
  const scale = Number(el.getAttribute('cover-scale'))
  const track: Track = { src, title: el.getAttribute('title') ?? src.split('/').pop() ?? src }
  const artist = el.getAttribute('artist')
  const album = el.getAttribute('album')
  const cover = el.getAttribute('cover')
  const coverPos = el.getAttribute('cover-pos')
  if (artist) track.artist = artist
  if (album) track.album = album
  if (cover) track.cover = cover
  if (coverPos) track.coverPos = coverPos
  if (scale > 0) track.coverScale = scale
  return track
}

/** Collect the `<pulse-track>` children of `host`. */
export function readTracks(host: Element): Track[] {
  return Array.from(host.querySelectorAll(':scope > pulse-track'))
    .map(trackFrom)
    .filter((t): t is Track => t !== null)
}

declare global {
  interface HTMLElementTagNameMap {
    'pulse-track': PulseTrackElement
  }
}
