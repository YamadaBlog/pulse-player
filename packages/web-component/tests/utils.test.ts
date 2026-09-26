import { afterEach, describe, expect, it, vi } from 'vitest'
import { cssUrl, hueFrom, sampleAccent } from '../src/utils/color'
import {
  onReducedMotionChange,
  prefersReducedMotion,
  registerAnimatableAccent,
} from '../src/utils/motion'
import { DEFAULT_LABELS, readTracks } from '../src/index'
import { mergeLabels } from '../src/labels'

afterEach(() => vi.restoreAllMocks())

/** Make `new Image()` load immediately and the canvas return `pixels`. */
function fakeImagePipeline(pixels: number[] | null): { crossOrigins: Array<string | null> } {
  const crossOrigins: Array<string | null> = []
  class FakeImage {
    crossOrigin: string | null = null
    decoding = ''
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_: string) {
      crossOrigins.push(this.crossOrigin)
      queueMicrotask(() => (pixels ? this.onload?.() : this.onerror?.()))
    }
  }
  vi.stubGlobal('Image', FakeImage)
  const create = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    const el = create(tag)
    if (tag === 'canvas') {
      ;(el as HTMLCanvasElement).getContext = (() => ({
        drawImage() {},
        getImageData: () => ({ data: new Uint8ClampedArray(pixels ?? []) }),
      })) as unknown as HTMLCanvasElement['getContext']
    }
    return el
  }) as typeof document.createElement)
  return { crossOrigins }
}

describe('sampleAccent', () => {
  it('picks the dominant vivid hue of the artwork', async () => {
    // 32×32 pixels of saturated red, a few grey ones.
    const px: number[] = []
    for (let i = 0; i < 32 * 32; i++)
      px.push(...(i % 10 ? [220, 30, 40, 255] : [128, 128, 128, 255]))
    fakeImagePipeline(px)
    const color = await sampleAccent('/covers/red-unique.png')
    expect(color).toMatch(/^hsl\((35[0-9]|[0-9]) /)
  })

  it('requests CORS for cross-origin covers only, and caches results', async () => {
    const { crossOrigins } = fakeImagePipeline(new Array(32 * 32 * 4).fill(0))
    await sampleAccent('https://cdn.example.com/a.png')
    await sampleAccent('/same-origin.png')
    await sampleAccent('/same-origin.png')
    expect(crossOrigins).toEqual(['anonymous', null])
  })

  it('resolves null when the image fails or is colourless', async () => {
    fakeImagePipeline(null)
    expect(await sampleAccent('/broken.png')).toBeNull()
    fakeImagePipeline(new Array(32 * 32 * 4).fill(0))
    expect(await sampleAccent('/transparent.png')).toBeNull()
  })

  it('hueFrom is deterministic', () => {
    expect(hueFrom('Projector Screen')).toBe(hueFrom('Projector Screen'))
    expect(hueFrom('a')).toBeGreaterThanOrEqual(0)
    expect(hueFrom('a')).toBeLessThan(360)
  })
})

describe('cssUrl', () => {
  it('keeps encoded URLs intact and neutralises string breakouts', () => {
    expect(cssUrl('/covers/Warm%20Fuzz.jpg')).toBe('url("/covers/Warm%20Fuzz.jpg")')
    expect(cssUrl('/a");background:red;x:("')).toBe(String.raw`url("/a\");background:red;x:(\"")`)
    expect(cssUrl('/a\\b\nc')).toBe(String.raw`url("/a\\bc")`)
  })
})

describe('motion utils', () => {
  it('reads and follows the reduced-motion preference', () => {
    const listeners: Array<(e: { matches: boolean }) => void> = []
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.push(fn),
      removeEventListener: vi.fn(),
    }))
    expect(prefersReducedMotion()).toBe(true)
    const seen: boolean[] = []
    const off = onReducedMotionChange((r) => seen.push(r))
    listeners[0]!({ matches: false })
    expect(seen).toEqual([false])
    off()
  })

  it('registers the animatable accent property once, tolerating duplicates', () => {
    const registerProperty = vi.fn(() => {
      throw new Error('already registered')
    })
    vi.stubGlobal('CSS', { registerProperty })
    expect(() => registerAnimatableAccent()).not.toThrow()
    registerAnimatableAccent()
    expect(registerProperty.mock.calls.length).toBeLessThanOrEqual(1)
  })
})

describe('labels and tracks', () => {
  it('merges partial label overrides', () => {
    expect(mergeLabels(null)).toBe(DEFAULT_LABELS)
    expect(mergeLabels({ play: 'Jouer' })).toMatchObject({ play: 'Jouer', pause: 'Pause' })
  })

  it('reads <pulse-track> attributes, skipping entries without src', () => {
    const host = document.createElement('div')
    host.innerHTML = `
      <pulse-track src="/a.mp3" title="A" artist="B" album="C" cover="/c.png" cover-pos="10% 20%" cover-scale="1.2"></pulse-track>
      <pulse-track title="no source"></pulse-track>
      <pulse-track src="/dir/file-name.mp3"></pulse-track>`
    expect(readTracks(host)).toEqual([
      {
        src: '/a.mp3',
        title: 'A',
        artist: 'B',
        album: 'C',
        cover: '/c.png',
        coverPos: '10% 20%',
        coverScale: 1.2,
      },
      { src: '/dir/file-name.mp3', title: 'file-name.mp3' },
    ])
  })
})
