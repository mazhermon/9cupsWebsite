// Peak-vs-running-average transient detector for audio-reactive visualisers.
// Push the current frame's band energy in; receive `true` if a transient just fired.
// `windowSize` frames of history are kept for the running average.

export class TransientDetector {
  private history: number[] = []
  private windowSize: number
  private threshold: number
  private cooldown: number
  private lastFire = -Infinity

  constructor(opts: { windowSize?: number; threshold?: number; cooldownFrames?: number } = {}) {
    this.windowSize = opts.windowSize ?? 8
    this.threshold = opts.threshold ?? 1.55
    this.cooldown = opts.cooldownFrames ?? 6
  }

  /** Returns true if `current` exceeds threshold * running average and we're past cooldown. */
  push(current: number, frameIndex: number): boolean {
    this.history.push(current)
    if (this.history.length > this.windowSize) this.history.shift()
    if (this.history.length < this.windowSize) return false

    let sum = 0
    for (const v of this.history) sum += v
    const avg = sum / this.history.length
    if (avg <= 0.001) return false

    const fired = current > avg * this.threshold && frameIndex - this.lastFire > this.cooldown
    if (fired) this.lastFire = frameIndex
    return fired
  }
}
