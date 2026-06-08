/**
 * usePulseAudioRN — React Native hook bridging the RN engine to React state.
 *
 * Returns the same shape as the web `usePulseAudio` (from @pulse-music/react)
 * so consumers can write framework-portable code over the React tree
 * (web vs RN). Subscribes via `useSyncExternalStore` so state updates
 * stay in sync with the engine without rerender storms.
 */

import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

import type { EventMap, Track, Unsubscribe } from '@pulse-music/types'

import {
  getSharedEngineRN,
  type PulseEngineRN,
} from '../utils/audioEngine'
import type { UsePulseAudioRNReturn } from '../types'

export function usePulseAudioRN(engine?: PulseEngineRN): UsePulseAudioRNReturn {
  const e = useMemo(() => engine ?? getSharedEngineRN(), [engine])

  const subscribe = useCallback(
    (cb: () => void) => e.onStateChange(cb) as Unsubscribe,
    [e],
  )
  const getSnapshot = useCallback(() => e.state, [e])

  useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  const toggle = useCallback(() => {
    void e.toggle()
  }, [e])
  const next = useCallback(() => {
    void e.next()
  }, [e])
  const prev = useCallback(() => {
    void e.prev()
  }, [e])
  const seek = useCallback(
    (fraction: number) => {
      void e.seek(fraction)
    },
    [e],
  )
  const setAudioTracks = useCallback(
    (tracks: Track[]) => {
      e.setAudioTracks(tracks)
    },
    [e],
  )
  const setAmbientEq = useCallback(
    (on: boolean) => {
      e.setAmbientEq(on)
    },
    [e],
  )
  const subscribeEvent = useCallback(
    <E extends keyof EventMap>(
      event: E,
      cb: (payload: EventMap[E]) => void,
    ) => e.subscribe(event, cb),
    [e],
  )
  const fmt = useCallback((seconds: number) => e.fmt(seconds), [e])

  // Cleanup engine reference on unmount of the LAST consumer is not
  // automatic — the singleton survives. Consumers who want a fresh
  // engine instance pass one in via `engine` arg and call
  // `engine.dispose()` themselves when done.
  useEffect(() => {
    return () => {
      // no-op for the singleton case
    }
  }, [])

  const state = e.state
  return {
    ...state,
    track: e.track,
    progress: e.progress,
    toggle,
    next,
    prev,
    seek,
    setAudioTracks,
    setAmbientEq,
    subscribe: subscribeEvent,
    fmt,
  }
}
