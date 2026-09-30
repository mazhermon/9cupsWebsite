'use client'

// Featured wordmark with audio-reactive ghost copies.
// - Main "9cups" stays static — it's the brand anchor.
// - Three coloured ghost copies behind it pulse on each kick transient and
//   pick up a small per-frame glitch jitter (translate + skew).
// - Drive: drums analyser. rAF reads the kick band, transient detector fires
//   a `pulse` envelope (snaps to 1, decays); each frame writes `transform`
//   directly to the ghost spans — no React state during playback.
// - When the drums stem is muted or playback is stopped, pulse decays to 0
//   and ghosts settle to their static base offsets.

import { useEffect, useRef } from 'react'
import { lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

interface WordmarkProps {
  eyebrow?: string
  /** Heading level. Defaults to 1. Pass 2 when the wordmark sits beneath a
   *  hero that already owns the page's single <h1>. */
  level?: 1 | 2
  /** Drums analyser — drives the ghost pulse on kick transients. */
  kickAnalyser?: AnalyserNode | null
  /** When true, the kick channel is silent — ghosts stop pulsing. */
  kickMuted?: boolean
  /** Master playback flag — when false, the ghost rAF idles. */
  playing?: boolean
}

interface GhostBase {
  /** Static offset applied even when no audio is reaching the analyser. */
  baseX: number
  baseY: number
  baseScale: number
  baseSkew: number
  /** How much the kick pulse pushes this ghost. */
  pushX: number
  pushY: number
  pushScale: number
  /** Glitch jitter amplitude applied as random per-frame transform noise. */
  glitchX: number
  glitchSkew: number
}

const GHOST_BASES: GhostBase[] = [
  // Ghost 1 — sits slightly left + above
  { baseX: -10, baseY: -2, baseScale: 1.08, baseSkew: -2, pushX:  18, pushY: -4, pushScale: 0.18, glitchX: 6, glitchSkew: 1.6 },
  // Ghost 2 — slightly right + below
  { baseX:   8, baseY:  4, baseScale: 1.16, baseSkew:  1.5, pushX: -22, pushY:  3, pushScale: 0.20, glitchX: 8, glitchSkew: 2.0 },
  // Ghost 3 — biggest, drifts outward
  { baseX:   0, baseY:  6, baseScale: 1.24, baseSkew:  0.8, pushX:  10, pushY: -2, pushScale: 0.22, glitchX: 4, glitchSkew: 1.0 },
]

export default function Wordmark({ eyebrow, level = 1, kickAnalyser, kickMuted = false, playing = false }: WordmarkProps) {
  const ghostRefs = useRef<(HTMLSpanElement | null)[]>([null, null, null])
  const reducedMotion = useReducedMotion()
  const dataRef = useRef<Uint8Array | null>(null)
  const detector = useRef(new TransientDetector({ threshold: 1.4, cooldownFrames: 5, windowSize: 8 }))
  const frameIdx = useRef(0)
  const pulseRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const playingRef = useRef(playing)
  const mutedRef = useRef(kickMuted)
  const analyserRef = useRef<AnalyserNode | null>(kickAnalyser ?? null)
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => { mutedRef.current = kickMuted }, [kickMuted])
  useEffect(() => { analyserRef.current = kickAnalyser ?? null }, [kickAnalyser])

  useEffect(() => {
    if (reducedMotion) {
      // Apply the static base transforms once, then leave them.
      for (let i = 0; i < GHOST_BASES.length; i++) {
        const node = ghostRefs.current[i]
        const b = GHOST_BASES[i]
        if (node) {
          node.style.transform = `translate(${b.baseX}px, ${b.baseY}px) scale(${b.baseScale}) skewX(${b.baseSkew}deg)`
        }
      }
      return
    }

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      if (typeof document !== 'undefined' && document.hidden) return

      const a = analyserRef.current
      let kickEnergy = 0
      let kicked = false

      if (playingRef.current && a && !mutedRef.current) {
        const cur = dataRef.current
        const buf = (!cur || cur.length !== a.frequencyBinCount)
          ? (dataRef.current = new Uint8Array(a.frequencyBinCount))
          : cur
        a.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
        // ~40-150 Hz kick band — same range Terrain uses for the drum pulse.
        let sum = 0
        const lo = 2, hi = 8
        for (let bin = lo; bin < hi && bin < buf.length; bin++) sum += buf[bin]
        kickEnergy = sum / ((hi - lo) * 255)
        kicked = detector.current.push(kickEnergy, frameIdx.current)
      }
      frameIdx.current++

      // Pulse envelope: snaps to 1 on kick, decays exponentially.
      if (kicked) pulseRef.current = 1
      pulseRef.current = lerpToward(pulseRef.current, 0, 0.16)

      // While the pulse is alive, layer a per-frame glitch jitter on top.
      // Resets to base when pulse → 0, so the ghosts settle still.
      const pulse = pulseRef.current
      const glitchAmt = pulse * pulse  // square so glitch only kicks in at higher pulse values

      for (let i = 0; i < GHOST_BASES.length; i++) {
        const node = ghostRefs.current[i]
        if (!node) continue
        const b = GHOST_BASES[i]

        // Random glitch noise — each ghost gets its own jitter so they don't
        // move in lockstep.
        const jx = (Math.random() - 0.5) * b.glitchX * glitchAmt
        const jSkew = (Math.random() - 0.5) * b.glitchSkew * glitchAmt

        const x = b.baseX + b.pushX * pulse + jx
        const y = b.baseY + b.pushY * pulse
        const s = b.baseScale + b.pushScale * pulse
        const sk = b.baseSkew + jSkew

        node.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(4)}) skewX(${sk.toFixed(2)}deg)`
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [reducedMotion])

  const Heading = level === 2 ? 'h2' : 'h1'

  return (
    <Heading className="wordmark">
      {eyebrow && <span className="wordmark-eyebrow">{eyebrow}</span>}
      <span className="wordmark-frame">
        <span
          ref={(el) => { ghostRefs.current[0] = el }}
          className="wordmark-ghost wordmark-ghost-1"
          aria-hidden="true"
        >9cups</span>
        <span
          ref={(el) => { ghostRefs.current[1] = el }}
          className="wordmark-ghost wordmark-ghost-2"
          aria-hidden="true"
        >9cups</span>
        <span
          ref={(el) => { ghostRefs.current[2] = el }}
          className="wordmark-ghost wordmark-ghost-3"
          aria-hidden="true"
        >9cups</span>
        <span className="wordmark-main">9cups</span>
      </span>
    </Heading>
  )
}
