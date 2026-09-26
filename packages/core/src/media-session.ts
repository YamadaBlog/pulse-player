import type { Track } from '@pulse-music/types'

export interface MediaSessionHandlers {
  play(): void
  pause(): void
  next(): void
  prev(): void
  seekTo(seconds: number): void
  seekBy(deltaSeconds: number): void
}

const ACTIONS: MediaSessionAction[] = [
  'play',
  'pause',
  'previoustrack',
  'nexttrack',
  'seekto',
  'seekbackward',
  'seekforward',
]

function session(): MediaSession | undefined {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator
    ? navigator.mediaSession
    : undefined
}

function absolute(url: string): string {
  try {
    return new URL(url, location.href).href
  } catch {
    return url
  }
}

/**
 * Bridges the engine to the OS media controls (hardware media keys,
 * lock screen, notification shade, headset buttons). Every call is a
 * no-op where the Media Session API is unavailable.
 */
export class MediaSessionBridge {
  private bound = false

  constructor(private readonly handlers: MediaSessionHandlers) {}

  bind(): void {
    const ms = session()
    if (!ms || this.bound) return
    this.bound = true
    const h = this.handlers
    const table: Partial<Record<MediaSessionAction, MediaSessionActionHandler>> = {
      play: () => h.play(),
      pause: () => h.pause(),
      previoustrack: () => h.prev(),
      nexttrack: () => h.next(),
      seekto: (d) => {
        if (typeof d.seekTime === 'number') h.seekTo(d.seekTime)
      },
      seekbackward: (d) => h.seekBy(-(d.seekOffset ?? 10)),
      seekforward: (d) => h.seekBy(d.seekOffset ?? 10),
    }
    for (const action of ACTIONS) {
      try {
        ms.setActionHandler(action, table[action] ?? null)
      } catch {
        /* action unsupported by this browser */
      }
    }
  }

  setTrack(track: Track | null): void {
    const ms = session()
    if (!ms || typeof MediaMetadata === 'undefined') return
    if (!track) {
      ms.metadata = null
      return
    }
    ms.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist ?? '',
      album: track.album ?? '',
      artwork: track.cover ? [{ src: absolute(track.cover), sizes: '512x512' }] : [],
    })
  }

  setPlaying(playing: boolean): void {
    const ms = session()
    if (ms) ms.playbackState = playing ? 'playing' : 'paused'
  }

  setPosition(duration: number, position: number, playbackRate: number): void {
    const ms = session()
    if (!ms?.setPositionState || !Number.isFinite(duration) || duration <= 0) return
    try {
      ms.setPositionState({
        duration,
        position: Math.min(Math.max(0, position), duration),
        playbackRate: playbackRate || 1,
      })
    } catch {
      /* inconsistent values during a source swap — next update fixes it */
    }
  }

  unbind(): void {
    const ms = session()
    if (!ms || !this.bound) return
    this.bound = false
    for (const action of ACTIONS) {
      try {
        ms.setActionHandler(action, null)
      } catch {
        /* unsupported */
      }
    }
    ms.metadata = null
    ms.playbackState = 'none'
  }
}
