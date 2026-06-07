/**
 * `@pulse-music/react-native` contract tests.
 *
 * The package ships INTERFACE TYPES + sentinel runtime (the renderer
 * itself is deferred to a v3.X.0 dedicated sprint — see
 * `docs/universal/BLOCKERS.md` #1). These tests verify:
 *
 *   - The parity matrix `RN_PARITY_MATRIX` declares every feature the
 *     web wrappers expose, with an honest emoji marker (✅ port,
 *     ⚠️ adapt, ❌ not supported)
 *   - The sentinel runtime exports (`PulsePlayerRN`, `PulseFabRN`,
 *     `usePulseAudioRN`) throw a clear, actionable error message
 *     instead of silently failing or returning `undefined`
 *   - Re-exports from `@pulse-music/types` are present so RN consumers can
 *     write their integration code today against the planned API
 */
import { describe, expect, it } from 'vitest'
import {
  RN_PARITY_MATRIX,
  PulsePlayerRN,
  PulseFabRN,
  usePulseAudioRN,
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

  it('uses a 3-state marker (✅, ⚠️, ❌) for every entry', () => {
    for (const [, marker] of Object.entries(RN_PARITY_MATRIX)) {
      expect(['✅', '⚠️', '❌']).toContain(marker)
    }
  })

  it('marks `dragToResize` as ❌ (no DOM resize concept on mobile native)', () => {
    expect(RN_PARITY_MATRIX.dragToResize).toBe('❌')
  })

  it('marks `audioPlayback` and `themes` as ✅', () => {
    expect(RN_PARITY_MATRIX.audioPlayback).toBe('✅')
    expect(RN_PARITY_MATRIX.themes).toBe('✅')
  })

  it('marks `backdropFilter` as ⚠️ (needs react-native-blur substitute)', () => {
    expect(RN_PARITY_MATRIX.backdropFilter).toBe('⚠️')
  })
})

describe('@pulse-music/react-native — sentinel runtime', () => {
  it('PulsePlayerRN throws a clear error naming BLOCKERS.md', () => {
    expect(() => PulsePlayerRN({} as never)).toThrowError(/BLOCKERS\.md/)
    expect(() => PulsePlayerRN({} as never)).toThrowError(/@pulse-music\/react-native/)
  })

  it('PulseFabRN throws the same actionable error', () => {
    expect(() => PulseFabRN({} as never)).toThrowError(/BLOCKERS\.md/)
  })

  it('usePulseAudioRN throws the same actionable error', () => {
    expect(() => usePulseAudioRN()).toThrowError(/BLOCKERS\.md/)
  })

  it('error message points at the web wrappers as the interim solution', () => {
    expect(() => usePulseAudioRN()).toThrowError(/@pulse-music\/web-component/)
  })
})

describe('@pulse-music/react-native — type re-exports', () => {
  it('re-exports ALL_VARIANTS with the canonical 10 entries', () => {
    expect(ALL_VARIANTS.length).toBe(10)
    expect(ALL_VARIANTS).toContain('vinyl')
    expect(ALL_VARIANTS).toContain('custom')
  })
})
