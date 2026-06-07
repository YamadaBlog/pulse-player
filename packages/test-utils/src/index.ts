/**
 * @pulse/test-utils — internal shared test scaffolding.
 *
 * Every `@pulse/*` package's vitest suite needs the same set of
 * stubs (Web Audio, ResizeObserver, rAF, HTMLMediaElement.play) to
 * run under jsdom. Before this package existed, each suite copy-
 * pasted the same 80-line setup file — 4 copies, drift inevitable.
 *
 * Usage in a package's `tests/setup.ts`:
 *
 *   import { installAudioStubs, installRafStubs, installMediaStubs } from '@pulse/test-utils'
 *   import { beforeEach, vi } from 'vitest'
 *
 *   installAudioStubs()
 *   installRafStubs()
 *   installMediaStubs()
 *
 *   beforeEach(() => vi.clearAllMocks())
 *
 * The functions are deliberately split so a renderer-only package
 * (no audio) can opt out of `installAudioStubs()` if it ever needs to.
 *
 * Note: this package is `private: true` — never published to npm.
 * It only exists to dedupe internal test plumbing.
 */
import { vi } from 'vitest'

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

/**
 * Install the Web Audio API stubs on `globalThis`.
 *
 * jsdom doesn't ship `AudioContext` / `AnalyserNode` /
 * `MediaElementSourceNode`. These stubs are deliberately synchronous
 * and inert — tests assert on the PulseEngine's public API, not on
 * the analyser's frequency output.
 */
export function installAudioStubs(): void {
  // @ts-expect-error — assigning Web Audio stubs to the jsdom window.
  globalThis.AudioContext = StubAudioContext
  // @ts-expect-error — webkit prefix path tested in code (Safari < 14.1).
  globalThis.webkitAudioContext = StubAudioContext
}

/**
 * Install `requestAnimationFrame` / `cancelAnimationFrame` on
 * `globalThis` if jsdom didn't wire them. Backed by `setTimeout(_, 16)`
 * so abortable rAF loops resolve reliably under the test environment.
 */
export function installRafStubs(): void {
  if (typeof globalThis.requestAnimationFrame !== 'undefined') return
  let id = 0
  const map = new Map<number, ReturnType<typeof setTimeout>>()
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    const i = ++id
    map.set(
      i,
      setTimeout(() => {
        map.delete(i)
        cb(performance.now())
      }, 16),
    )
    return i
  }
  globalThis.cancelAnimationFrame = (i: number): void => {
    const t = map.get(i)
    if (t) {
      clearTimeout(t)
      map.delete(i)
    }
  }
}

/**
 * Stub `HTMLMediaElement.play / pause / load` so PulseEngine.toggle()
 * doesn't throw inside jsdom (which doesn't implement audio playback).
 */
export function installMediaStubs(): void {
  if (typeof HTMLMediaElement === 'undefined') return
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve())
  HTMLMediaElement.prototype.pause = vi.fn(() => {})
  HTMLMediaElement.prototype.load = vi.fn(() => {})
}

/**
 * One-call helper: installs every stub above. Use from a package's
 * `tests/setup.ts` for the common case.
 */
export function installAllStubs(): void {
  installAudioStubs()
  installRafStubs()
  installMediaStubs()
}
