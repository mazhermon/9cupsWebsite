import { describe, it, expect } from 'vitest'
import { TransientDetector } from '@/lib/transient-detect'

describe('TransientDetector', () => {
  it('returns false until windowSize samples have accumulated', () => {
    const d = new TransientDetector({ windowSize: 4, threshold: 1.55, cooldownFrames: 3 })
    // First windowSize-1 pushes can never fire: history is still filling.
    expect(d.push(1, 0)).toBe(false)
    expect(d.push(1, 1)).toBe(false)
    expect(d.push(1, 2)).toBe(false)
    // On the 4th push, history.length === windowSize, so real detection begins,
    // but the value itself (1) doesn't exceed threshold * avg(1) = 1.55.
    expect(d.push(1, 3)).toBe(false)
  })

  it('fires true when current exceeds threshold * running average', () => {
    const d = new TransientDetector({ windowSize: 4, threshold: 1.55, cooldownFrames: 3 })
    d.push(1, 0)
    d.push(1, 1)
    d.push(1, 2)
    d.push(1, 3) // window now [1,1,1,1], avg = 1
    // history becomes [1,1,1,100], avg = 25.75, threshold*avg = 39.9125 < 100
    expect(d.push(100, 4)).toBe(true)
  })

  it('respects cooldownFrames: no second fire within the cooldown window', () => {
    const d = new TransientDetector({ windowSize: 4, threshold: 1.55, cooldownFrames: 3 })
    d.push(1, 0)
    d.push(1, 1)
    d.push(1, 2)
    d.push(1, 3)
    expect(d.push(100, 4)).toBe(true) // fires, lastFire = 4

    // history [1,1,100,100], avg = 50.5, threshold*avg = 78.275 < 100:
    // the amplitude condition is satisfied again, but frameIndex(5) - lastFire(4) = 1
    // is not > cooldown(3), so it must not fire.
    expect(d.push(100, 5)).toBe(false)

    // Let the average fall back down while cooldown keeps ticking.
    expect(d.push(1, 6)).toBe(false)
    expect(d.push(1, 7)).toBe(false)
    expect(d.push(1, 8)).toBe(false)

    // history [1,1,1,100], avg = 25.75 again, and frameIndex(9) - lastFire(4) = 5 > 3:
    // both conditions hold, so it fires again.
    expect(d.push(100, 9)).toBe(true)
  })

  it('returns false when the running average is at or below the silence floor (0.001)', () => {
    const d = new TransientDetector({ windowSize: 3, threshold: 1.5, cooldownFrames: 0 })
    expect(d.push(0, 0)).toBe(false)
    expect(d.push(0, 1)).toBe(false)
    // Window is now full ([0,0,0], avg = 0 <= 0.001) but must still report false,
    // even though frameIndex - lastFire > cooldown holds.
    expect(d.push(0, 2)).toBe(false)
  })

  it('slides the history window so only the last windowSize samples count', () => {
    const d = new TransientDetector({ windowSize: 3, threshold: 1.2, cooldownFrames: 0 })
    d.push(10, 0)
    d.push(10, 1)
    d.push(10, 2) // window [10,10,10], avg 10, current 10 doesn't exceed 1.2*10
    expect(d.push(1, 3)).toBe(false) // window [10,10,1]
    expect(d.push(1, 4)).toBe(false) // window [10,1,1], the old 10s from frame 0/1 have aged out
    // window is now [1,1,20]: avg = 7.333, threshold*avg = 8.8 < 20.
    // If the two stale 10-samples from frames 0-1 still counted, avg would be much
    // higher and this would not fire — proving the window truly slides.
    expect(d.push(20, 5)).toBe(true)
  })

  it('behaves as documented with default options (windowSize 8, threshold 1.55, cooldown 6)', () => {
    const d = new TransientDetector()
    // Fill the 8-sample window with quiet background.
    for (let i = 0; i < 8; i++) {
      expect(d.push(1, i)).toBe(false)
    }
    // window [1,1,1,1,1,1,1,100], avg = 13.375, threshold*avg = 20.73 < 100
    expect(d.push(100, 8)).toBe(true)
    // Immediate repeat: amplitude condition holds again (avg 25.75, thr*avg 39.9 < 100)
    // but frameIndex(9) - lastFire(8) = 1 is not > cooldown(6).
    expect(d.push(100, 9)).toBe(false)
    // Let the background return and cooldown lapse (frames 10-14 are quiet).
    for (let i = 10; i < 15; i++) {
      expect(d.push(1, i)).toBe(false)
    }
    // frameIndex(15) - lastFire(8) = 7 > 6, and avg has fallen back to 25.75: fires again.
    expect(d.push(100, 15)).toBe(true)
  })
})
