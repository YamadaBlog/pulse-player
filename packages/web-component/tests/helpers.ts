import type { Track } from '@pulse-music/types'
import { createFakeAudio, FakeAudio, tick } from '@pulse-music/test-utils'
import { PulseEngine } from '../src/index'

export const TRACKS: Track[] = [
  {
    title: 'Protofunk',
    artist: 'Kevin MacLeod',
    src: '/audio/protofunk.mp3',
    cover: '/covers/protofunk.svg',
  },
  { title: 'Lobby Time', artist: 'Kevin MacLeod', src: '/audio/lobby-time.mp3' },
]

export function makeEngine(tracks: Track[] = TRACKS): PulseEngine {
  return new PulseEngine({ tracks, createAudio: createFakeAudio, mediaSession: false })
}

export async function mount<T extends HTMLElement & { updateComplete: Promise<boolean> }>(
  markup: string,
  engine?: PulseEngine,
): Promise<T> {
  const host = document.createElement('div')
  host.innerHTML = markup
  const el = host.firstElementChild as T & { engine?: PulseEngine }
  if (engine) el.engine = engine
  document.body.append(host)
  await el.updateComplete
  return el
}

export const $ = <E extends Element = HTMLElement>(el: Element, selector: string): E => {
  const found = el.shadowRoot!.querySelector<E>(selector)
  if (!found) throw new Error(`${selector} not found`)
  return found
}

export const audio = (): FakeAudio => FakeAudio.last!

/** Let promises settle and Lit re-render. */
export async function settle(el: { updateComplete: Promise<boolean> }): Promise<void> {
  await tick()
  await el.updateComplete
}

export function key(target: Element, k: string, init: KeyboardEventInit = {}): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, ...init }),
  )
}
