import { describe, expect, it, vi } from 'vitest'
import { installMediaSessionStub } from '@pulse-music/test-utils'
import { MediaSessionBridge } from '../src/media-session'

const handlers = () => ({
  play: vi.fn(),
  pause: vi.fn(),
  next: vi.fn(),
  prev: vi.fn(),
  seekTo: vi.fn(),
  seekBy: vi.fn(),
})

describe('MediaSessionBridge', () => {
  it('maps every OS action onto the engine', () => {
    const session = installMediaSessionStub()
    const h = handlers()
    const bridge = new MediaSessionBridge(h)
    bridge.bind()
    bridge.bind() // idempotent
    session.handlers.get('play')!({})
    session.handlers.get('previoustrack')!({})
    session.handlers.get('seekto')!({ seekTime: 42 })
    session.handlers.get('seekto')!({})
    session.handlers.get('seekbackward')!({})
    session.handlers.get('seekforward')!({ seekOffset: 30 })
    expect(h.play).toHaveBeenCalled()
    expect(h.prev).toHaveBeenCalled()
    expect(h.seekTo).toHaveBeenCalledTimes(1)
    expect(h.seekTo).toHaveBeenCalledWith(42)
    expect(h.seekBy.mock.calls).toEqual([[-10], [30]])
  })

  it('publishes metadata with absolute artwork URLs, and clears it', () => {
    const session = installMediaSessionStub()
    const bridge = new MediaSessionBridge(handlers())
    bridge.setTrack({ title: 'T', src: '/t.mp3', artist: 'A', album: 'B', cover: '/c.png' })
    expect(session.metadata).toMatchObject({
      title: 'T',
      artist: 'A',
      album: 'B',
      artwork: [{ src: new URL('/c.png', location.href).href, sizes: '512x512' }],
    })
    bridge.setTrack(null)
    expect(session.metadata).toBeNull()
  })

  it('reports a clamped position only for finite durations', () => {
    const session = installMediaSessionStub()
    const bridge = new MediaSessionBridge(handlers())
    bridge.setPosition(Infinity, 3, 1)
    bridge.setPosition(100, 250, 0)
    expect(session.positions).toEqual([{ duration: 100, position: 100, playbackRate: 1 }])
  })

  it('is a no-op without the Media Session API', () => {
    Object.defineProperty(navigator, 'mediaSession', { value: undefined, configurable: true })
    delete (navigator as unknown as Record<string, unknown>).mediaSession
    const bridge = new MediaSessionBridge(handlers())
    expect(() => {
      bridge.bind()
      bridge.setTrack({ title: 'x', src: '/x' })
      bridge.setPlaying(true)
      bridge.setPosition(10, 1, 1)
      bridge.unbind()
    }).not.toThrow()
  })
})
