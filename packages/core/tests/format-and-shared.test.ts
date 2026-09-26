import { describe, expect, it } from 'vitest'
import { clamp, formatTime } from '../src/format'
import { PulseEngine } from '../src/PulseEngine'
import { getSharedEngine, setSharedEngine } from '../src/shared'

describe('formatTime', () => {
  it.each([
    [0, '0:00'],
    [5.9, '0:05'],
    [65, '1:05'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
    [NaN, '0:00'],
    [Infinity, '0:00'],
    [-3, '0:00'],
  ])('formatTime(%s) → %s', (input, expected) => {
    expect(formatTime(input)).toBe(expected)
  })
})

describe('clamp', () => {
  it('clamps and collapses NaN to the minimum', () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-5, 0, 1)).toBe(0)
    expect(clamp(NaN, 0, 1)).toBe(0)
  })
})

describe('shared engine', () => {
  it('is a lazily created singleton that can be replaced', () => {
    const a = getSharedEngine()
    expect(getSharedEngine()).toBe(a)
    const b = new PulseEngine()
    setSharedEngine(b)
    expect(getSharedEngine()).toBe(b)
  })
})
