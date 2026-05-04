// Shared utilities for audio-reactive shapes.

import { useSyncExternalStore } from 'react'

export interface Pt {
  x: number
  y: number
}

/**
 * Build a closed smooth blob path from N control points.
 * Uses the midpoint Q-curve technique: each segment is a quadratic Bezier
 * from midpoint(prev, cur) to midpoint(cur, next) with cur as the control.
 * Result is a continuous closed curve passing near every control point.
 */
export function buildBlobPath(points: Pt[]): string {
  const n = points.length
  if (n < 3) return ''

  const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

  const start = mid(points[n - 1], points[0])
  let d = `M${start.x.toFixed(2)},${start.y.toFixed(2)}`
  for (let i = 0; i < n; i++) {
    const cur = points[i]
    const next = points[(i + 1) % n]
    const m = mid(cur, next)
    d += ` Q${cur.x.toFixed(2)},${cur.y.toFixed(2)} ${m.x.toFixed(2)},${m.y.toFixed(2)}`
  }
  return d + ' Z'
}

/**
 * Average the energy in a frequency band, returning 0..1.
 */
export function bandEnergy(data: Uint8Array, start: number, end: number): number {
  const a = Math.max(0, Math.min(start, data.length - 1))
  const b = Math.max(a + 1, Math.min(end, data.length))
  let sum = 0
  for (let i = a; i < b; i++) sum += data[i]
  return sum / ((b - a) * 255)
}

/**
 * One-pole lowpass smoothing toward a target.
 * alpha: 0..1, lower = sluggish, higher = snappy.
 */
export function lerpToward(current: number, target: number, alpha: number): number {
  return current + (target - current) * alpha
}

/**
 * Reactive prefers-reduced-motion. Re-renders the calling component when the
 * user toggles their OS setting mid-session, so visualisers freeze without a
 * page refresh.
 */
const reducedMotionMQ = (): MediaQueryList | null =>
  typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)')

const subscribeReducedMotion = (notify: () => void) => {
  const mq = reducedMotionMQ()
  if (!mq) return () => {}
  mq.addEventListener('change', notify)
  return () => mq.removeEventListener('change', notify)
}

const getReducedMotionSnapshot = () => reducedMotionMQ()?.matches ?? false
const getReducedMotionServerSnapshot = () => false

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  )
}
