/**
 * Test environment bootstrap for @pulse/web-component.
 *
 * Ported from `@pulse/core`'s setup with the same Web Audio /
 * ResizeObserver / rAF stubs. Lit's reactive controller pattern
 * needs no extra hooks under jsdom — the Custom Element lifecycle
 * (`connectedCallback`, `disconnectedCallback`) works out of the box.
 */
import { vi, beforeEach } from 'vitest'

class StubAnalyserNode {
  fftSize = 256
  smoothingTimeConstant = 0.5
  get frequencyBinCount() {
    return this.fftSize / 2
  }
  connect() {}
  disconnect() {}
  getByteFrequencyData(arr: Uint8Array) {
    arr.fill(0)
  }
}

class StubMediaElementSourceNode {
  connect() {}
  disconnect() {}
}

class StubAudioContext {
  state = 'running' as const
  destination = {}
  createAnalyser() {
    return new StubAnalyserNode()
  }
  createMediaElementSource() {
    return new StubMediaElementSourceNode()
  }
  close() {
    return Promise.resolve()
  }
}

// @ts-expect-error — assigning Web Audio stubs to the jsdom window.
globalThis.AudioContext = StubAudioContext
// @ts-expect-error — webkit prefix path tested in code.
globalThis.webkitAudioContext = StubAudioContext

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  let _id = 0
  const _map = new Map<number, ReturnType<typeof setTimeout>>()
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    const id = ++_id
    _map.set(
      id,
      setTimeout(() => {
        _map.delete(id)
        cb(performance.now())
      }, 16),
    )
    return id
  }
  globalThis.cancelAnimationFrame = (id: number): void => {
    const t = _map.get(id)
    if (t) {
      clearTimeout(t)
      _map.delete(id)
    }
  }
}

if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve())
  HTMLMediaElement.prototype.pause = vi.fn(() => {})
  HTMLMediaElement.prototype.load = vi.fn(() => {})
}

beforeEach(() => {
  vi.clearAllMocks()
})
