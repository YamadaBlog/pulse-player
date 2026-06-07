/**
 * Test bootstrap for @pulse/react — same Web Audio / rAF stubs as
 * @pulse/core + @pulse/web-component, plus @testing-library/jest-dom
 * matchers for clearer React assertion messages.
 */
import { vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

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
