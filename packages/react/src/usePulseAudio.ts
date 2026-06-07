import { useCallback, useEffect, useState } from 'react'
import {
  getSharedEngine,
  type AudioEvent,
  type EventListener,
  type PulseState,
  type Track,
  type Unsubscribe,
} from '@pulse-music/web-component'

/**
 * `usePulseAudio()` — React hook over the shared `PulseEngine`.
 *
 * Returns the engine's current state (re-rendering on every change)
 * plus a stable action surface (`toggle`, `next`, `prev`, `seek`,
 * `setAudioTracks`, `setAmbientEq`), the typed event bus
 * (`subscribe`), the `fmt` formatter, and two computed values
 * (`track`, `progress`) derived from the current state.
 *
 * The state object is a SHALLOW COPY produced by `onStateChange()`,
 * so re-renders are triggered by object-identity changes (matching
 * React's expectations). Action callbacks are wrapped in
 * `useCallback` so they're stable across renders and can be passed
 * to memoised children without forcing re-renders.
 *
 * Equivalent of the Vue `useAudioStore` Pinia composable from
 * v2.3.4 — same surface, same behaviour, projected through React's
 * primitives instead of Vue's.
 *
 * Example:
 *
 * ```tsx
 * function PlayerControls() {
 *   const { isPlaying, track, progress, fmt, toggle, next, prev } = usePulseAudio()
 *   return (
 *     <div>
 *       <h3>{track.title}</h3>
 *       <button onClick={prev}>⏮</button>
 *       <button onClick={toggle}>{isPlaying ? '⏸' : '▶'}</button>
 *       <button onClick={next}>⏭</button>
 *       <span>{fmt(progress)}</span>
 *     </div>
 *   )
 * }
 * ```
 */
export interface UsePulseAudioReturn extends PulseState {
  /** Active track (clamped to a valid index). */
  track: Track
  /** Playback progress as a 0..100 percentage. */
  progress: number
  /** Play / pause toggle. Triggers `'play'` or `'pause'` event. */
  toggle: () => void
  /** Jump to the next track in the playlist (loops). */
  next: () => void
  /** Restart current track if past 3 s, else jump to the previous. */
  prev: () => void
  /** Seek to a fraction (0..1) of the current track. */
  seek: (fraction: number) => void
  /** Replace the playlist. Throws if the array is empty. */
  setAudioTracks: (tracks: Track[]) => void
  /** Flip the global ambient-EQ visualiser. */
  setAmbientEq: (on: boolean) => void
  /**
   * Subscribe to a typed event. Returns an `Unsubscribe`.
   *
   * Wrap in `useEffect` so the listener is detached on unmount:
   *
   * ```tsx
   * useEffect(() => subscribe('play', ({ track, time }) => {
   *   analytics.track('play', { id: track.title, time })
   * }), [subscribe])
   * ```
   */
  subscribe: <E extends AudioEvent>(event: E, cb: EventListener<E>) => Unsubscribe
  /** Format a seconds value as `m:ss`. */
  fmt: (seconds: number) => string
}

export function usePulseAudio(): UsePulseAudioReturn {
  const engine = getSharedEngine()
  const [state, setState] = useState<PulseState>(() => ({ ...engine.state }))

  useEffect(() => {
    // The engine fires onStateChange synchronously inside every action,
    // so the React render lands on the SAME frame as the audio
    // transition. No transitions-on-next-tick lag.
    return engine.onStateChange((s) => setState({ ...s }))
  }, [engine])

  const toggle = useCallback(() => engine.toggle(), [engine])
  const next = useCallback(() => engine.next(), [engine])
  const prev = useCallback(() => engine.prev(), [engine])
  const seek = useCallback((f: number) => engine.seek(f), [engine])
  const setAudioTracks = useCallback((t: Track[]) => engine.setAudioTracks(t), [engine])
  const setAmbientEq = useCallback((on: boolean) => engine.setAmbientEq(on), [engine])
  const subscribe = useCallback(
    <E extends AudioEvent>(event: E, cb: EventListener<E>): Unsubscribe =>
      engine.subscribe(event, cb),
    [engine],
  )
  const fmt = useCallback((s: number) => engine.fmt(s), [engine])

  return {
    ...state,
    // The two computed values read straight off the engine — they
    // re-derive on every render (cheap; `track` is an O(1) array
    // lookup, `progress` is a single division).
    track: engine.track,
    progress: engine.progress,
    toggle,
    next,
    prev,
    seek,
    setAudioTracks,
    setAmbientEq,
    subscribe,
    fmt,
  }
}
