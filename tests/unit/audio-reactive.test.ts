import { describe, it, expect } from 'vitest'
import { bandEnergy, lerpToward } from '@/lib/audio-reactive'

describe('bandEnergy', () => {
  it('returns 0 for an all-zero buffer over the full range', () => {
    const data = new Uint8Array(8)
    expect(bandEnergy(data, 0, 8)).toBe(0)
  })

  it('returns 1 for an all-255 buffer over the full range', () => {
    const data = new Uint8Array(8).fill(255)
    expect(bandEnergy(data, 0, 8)).toBe(1)
  })

  it('averages the requested bin range', () => {
    const data = new Uint8Array([0, 255, 0, 255, 0])
    // [1,3) => [255, 0] => avg 127.5 / 255 = 0.5
    expect(bandEnergy(data, 1, 3)).toBeCloseTo(0.5, 10)
  })

  it('clamps a start index beyond the array length to the last bin', () => {
    const data = new Uint8Array([10, 20, 30, 40])
    expect(bandEnergy(data, 10, 20)).toBeCloseTo(40 / 255, 10)
  })

  it('clamps an end index beyond the array length to the array length', () => {
    const data = new Uint8Array([10, 20, 30, 40])
    expect(bandEnergy(data, 0, 100)).toBeCloseTo((10 + 20 + 30 + 40) / 4 / 255, 10)
  })

  it('handles start > end by collapsing to a single-bin band at the clamped start', () => {
    // Documents actual behaviour: b = max(a+1, min(end,length)) forces at least
    // one bin starting at the clamped start index, rather than returning 0.
    const data = new Uint8Array([10, 20, 30, 40])
    expect(bandEnergy(data, 3, 1)).toBeCloseTo(40 / 255, 10)
  })

  it('clamps a negative start index to 0', () => {
    const data = new Uint8Array([10, 20, 30, 40])
    expect(bandEnergy(data, -5, 2)).toBeCloseTo((10 + 20) / 2 / 255, 10)
  })
})

describe('lerpToward', () => {
  it('is a no-op at alpha 0', () => {
    expect(lerpToward(0.2, 0.9, 0)).toBe(0.2)
  })

  it('reaches the target exactly at alpha 1', () => {
    expect(lerpToward(0.2, 0.9, 1)).toBeCloseTo(0.9, 10)
  })

  it('moves toward the target proportionally to alpha', () => {
    // 0 + (10 - 0) * 0.25 = 2.5
    expect(lerpToward(0, 10, 0.25)).toBeCloseTo(2.5, 10)
  })

  it('is stable when current === target', () => {
    expect(lerpToward(0.5, 0.5, 0.3)).toBe(0.5)
    expect(lerpToward(0.5, 0.5, 1)).toBe(0.5)
    expect(lerpToward(0.5, 0.5, 0)).toBe(0.5)
  })
})
