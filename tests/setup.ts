/**
 * Test environment bootstrap.
 *
 * jsdom doesn't ship the Web Audio API, ResizeObserver, or matchMedia
 * — we stub the minimum surface our code touches. Stubs are deliberately
 * synchronous and inert: tests assert on behaviour against the public
 * API, not on internals of the analyser node.
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

class StubResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = StubResizeObserver as unknown as typeof ResizeObserver

// jsdom doesn't always wire requestAnimationFrame onto `globalThis`
// (it lives on `window` but our composable references the global).
// Polyfill with a setTimeout-backed shim so abortable rAF loops resolve
// reliably under the test environment.
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

if (!('matchMedia' in window)) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}

// Audio playback methods aren't implemented in jsdom — stub so .play()
// doesn't throw inside the store's toggle().
if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve())
  HTMLMediaElement.prototype.pause = vi.fn(() => {})
  HTMLMediaElement.prototype.load = vi.fn(() => {})
}

beforeEach(() => {
  vi.clearAllMocks()
})
