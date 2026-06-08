/**
 * @pulse-music/react-native — contract tests for the rc.1 renderer.
 *
 * v3.0.0-rc.1 ships the real renderer. These tests cover:
 *
 *   - `RN_PARITY_MATRIX` shape + key set (catches drift between the
 *     web feature set and what RN actually supports).
 *   - `PulseEngineRN` class — state machine, actions, events,
 *     subscriber lifecycle. Uses the `expo-av` mock from
 *     `tests/__mocks__/expo-av.ts` so the suite runs in pure Node
 *     without booting React Native.
 *   - `getSharedEngineRN` singleton behaviour.
 *   - Re-exports from `@pulse-music/types` still surface (no
 *     accidental break during the rc.1 refactor).
 *
 * Component-render tests (PulsePlayerRN, PulseFabRN) need a real RN
 * runtime — they're exercised in `apps/demo-react-native/` end-to-end.
 */

import { describe, expect, it, beforeEach } from 'vitest'

import {
  RN_PARITY_MATRIX,
  PulseEngineRN,
  getSharedEngineRN,
  setSharedEngineRN,
  ALL_VARIANTS,
} from '../src/index'

describe('@pulse-music/react-native — parity matrix', () => {
  it('declares every web feature the consumer might expect', () => {
    const expectedKeys = [
      'audioPlayback',
      'fftVisualisation',
      'themes',
      'ambientEq',
      'pulsoHeartbeat',
      'fabBasic',
      'fabDrag',
      'prefersReducedMotion',
      'backdropFilter',
      'dragToResize',
      'teleportFab',
      'guidedDemoTour',
    ] as const
    for (const k of expectedKeys) {
      expect(RN_PARITY_MATRIX).toHaveProperty(k)
    }
  })

  it('uses the 4-state marker (✅, ⚠️, ⏳, ❌) for every entry', () => {
    for (const [, marker] of Object.entries(RN_PARITY_MATRIX)) {
      expect(['✅', '⚠️', '⏳', '❌']).toContain(marker)
    }
  })

  it('marks audioPlayback ✅ — the rc.1 baseline', () => {
    expect(RN_PARITY_MATRIX.audioPlayback).toBe('✅')
  })

  it('marks fftVisualisation ⚠️ (pseudo-bar synth in rc.1)', () => {
    expect(RN_PARITY_MATRIX.fftVisualisation).toBe('⚠️')
  })

  it('marks dragToResize ❌ (no DOM resize on mobile native)', () => {
    expect(RN_PARITY_MATRIX.dragToResize).toBe('❌')
  })
})

describe('@pulse-music/react-native — PulseEngineRN class', () => {
  let engine: PulseEngineRN
  beforeEach(() => {
    engine = new PulseEngineRN()
  })

  it('initialises with a non-empty default playlist', () => {
    expect(engine.tracks.length).toBeGreaterThan(0)
    expect(engine.track.title).toBeTypeOf('string')
  })

  it('starts in a paused, zero-time state', () => {
    expect(engine.state.isPlaying).toBe(false)
    expect(engine.state.currentTime).toBe(0)
    expect(engine.state.duration).toBe(0)
    expect(engine.state.playCount).toBe(0)
  })

  it('setAudioTracks replaces the playlist', () => {
    engine.setAudioTracks([
      { title: 'Test track A', src: 'https://example.com/a.webm' },
      { title: 'Test track B', src: 'https://example.com/b.webm' },
    ])
    expect(engine.tracks.length).toBe(2)
    expect(engine.track.title).toBe('Test track A')
  })

  it('throws if setAudioTracks called with empty array', () => {
    expect(() => engine.setAudioTracks([])).toThrow(/at least one entry/)
  })

  it('setAmbientEq toggles the state flag', () => {
    expect(engine.state.ambientEq).toBe(false)
    engine.setAmbientEq(true)
    expect(engine.state.ambientEq).toBe(true)
    engine.setAmbientEq(false)
    expect(engine.state.ambientEq).toBe(false)
  })

  it('onStateChange fires when state mutates', () => {
    let calls = 0
    const unsub = engine.onStateChange(() => {
      calls++
    })
    engine.setAmbientEq(true)
    expect(calls).toBeGreaterThan(0)
    unsub()
    const before = calls
    engine.setAmbientEq(false)
    expect(calls).toBe(before) // unsub stopped firing
  })

  it('subscribe registers a typed event listener', () => {
    let plays = 0
    const off = engine.subscribe('play', () => {
      plays++
    })
    expect(typeof off).toBe('function')
    off() // doesn't throw
  })

  it('fmt returns mm:ss format', () => {
    expect(engine.fmt(0)).toBe('0:00')
    expect(engine.fmt(42)).toBe('0:42')
    expect(engine.fmt(138)).toBe('2:18')
    expect(engine.fmt(-5)).toBe('0:00')
    expect(engine.fmt(NaN)).toBe('0:00')
  })

  it('progress is 0 when duration is 0', () => {
    expect(engine.progress).toBe(0)
  })
})

describe('@pulse-music/react-native — singleton', () => {
  it('getSharedEngineRN returns the same instance on repeat calls', () => {
    const a = getSharedEngineRN()
    const b = getSharedEngineRN()
    expect(a).toBe(b)
  })

  it('setSharedEngineRN replaces the singleton', () => {
    const fresh = new PulseEngineRN()
    setSharedEngineRN(fresh)
    expect(getSharedEngineRN()).toBe(fresh)
  })
})

describe('@pulse-music/react-native — re-exports', () => {
  it('re-exports ALL_VARIANTS with the canonical 10 entries', () => {
    expect(ALL_VARIANTS.length).toBe(10)
    expect(ALL_VARIANTS).toContain('vinyl')
    expect(ALL_VARIANTS).toContain('custom')
  })
})
