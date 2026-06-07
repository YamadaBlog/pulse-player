import { PulseEngine } from '@pulse/core'

/**
 * Shared PulseEngine singleton for the Web Components.
 *
 * The v2.3.4 Pinia store was a singleton — one audio session shared
 * across every `<MusicPlayer />` and `<MiniPlayer />` on the page.
 * The Web Component layer mirrors that by lazily instantiating ONE
 * engine and returning it from `getSharedEngine()`.
 *
 * Advanced consumers can override the singleton at module-init time
 * via `setSharedEngine(myEngine)`:
 *
 *   import { setSharedEngine } from '@pulse/web-component'
 *   import { PulseEngine } from '@pulse/core'
 *
 *   setSharedEngine(new PulseEngine(myCustomPlaylist))
 *
 * Useful for tests, SSR shells that need to inject a stub engine,
 * or multi-instance scenarios where two completely separate audio
 * sessions should coexist (rare).
 */
let _engine: PulseEngine | null = null

export function getSharedEngine(): PulseEngine {
  if (!_engine) _engine = new PulseEngine()
  return _engine
}

export function setSharedEngine(engine: PulseEngine): void {
  _engine = engine
}
