'use client'

// Audio-driven blend overlay for /img-c4-pulse.
//
// Drives:
//   - opacity: bass low-band as a sustained baseline + kick transients spike it
//   - filter:  hue-rotate(N deg) and saturate(S) modulated by mid energy
//
// rAF reads the relevant analysers each frame, transient detector flags
// kicks, and the wrapper's style is mutated directly — no React state during
// playback, no re-renders.

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { TrackState } from '@/hooks/useAudioEngine'
import type { Stem } from '@/lib/track-config'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

interface PulseOverlayProps {
  analysers: (AnalyserNode | null)[]
  trackStates: TrackState[]
  stems: Stem[]
  playing: boolean
}

export default function PulseOverlay({ analysers, trackStates, stems, playing }: PulseOverlayProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()
  const dataRefs = useRef<(Uint8Array | null)[]>(stems.map(() => null))
  const detector = useRef(new TransientDetector({ threshold: 1.4, cooldownFrames: 5, windowSize: 8 }))
  const frameIdx = useRef(0)
  const kickPulse = useRef(0)
  const bassEnvelope = useRef(0)
  const midEnvelope = useRef(0)
  const rafRef = useRef<number | null>(null)
  // Snapshot props in refs so the rAF reads fresh values without re-binding.
  const playingRef = useRef(playing)
  const trackStatesRef = useRef(trackStates)
  const stemsRef = useRef(stems)
  const analysersRef = useRef(analysers)
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => { trackStatesRef.current = trackStates }, [trackStates])
  useEffect(() => { stemsRef.current = stems }, [stems])
  useEffect(() => { analysersRef.current = analysers }, [analysers])

  useEffect(() => {
    if (reducedMotion) return

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)
      if (typeof document !== 'undefined' && document.hidden) return

      const stemsLocal = stemsRef.current
      const tracksLocal = trackStatesRef.current
      const analysersLocal = analysersRef.current

      const idxByKey: Record<string, number> = {}
      stemsLocal.forEach((s, i) => { idxByKey[s.key] = i })

      const readBand = (idx: number | undefined, lo: number, hi: number) => {
        if (idx == null) return 0
        if (tracksLocal[idx]?.muted) return 0
        const a = analysersLocal[idx]
        if (!a) return 0
        const cur = dataRefs.current[idx]
        const buf = (!cur || cur.length !== a.frequencyBinCount)
          ? (dataRefs.current[idx] = new Uint8Array(a.frequencyBinCount))
          : cur
        a.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
        return bandEnergy(buf, lo, hi)
      }

      let kicked = false
      let bass = 0, mid = 0
      if (playingRef.current) {
        const kick = readBand(idxByKey.drums, 2, 8)
        bass = readBand(idxByKey.bass, 1, 14)
        mid = readBand(idxByKey.main, 14, 95)
        kicked = idxByKey.drums != null && detector.current.push(kick, frameIdx.current)
      }
      frameIdx.current++

      // Envelopes
      if (kicked) kickPulse.current = 1
      kickPulse.current = lerpToward(kickPulse.current, 0, 0.16)
      bassEnvelope.current = lerpToward(bassEnvelope.current, bass, 0.30)
      midEnvelope.current = lerpToward(midEnvelope.current, mid, 0.22)

      // Composite the visible parameters
      const opacity = Math.min(
        1,
        0.30 + bassEnvelope.current * 0.50 + kickPulse.current * 0.18,
      )
      const hue = midEnvelope.current * 60          // 0–60 deg
      const sat = 1 + midEnvelope.current * 0.7      // 1.0–1.7

      const el = wrapRef.current
      if (!el) return
      el.style.opacity = opacity.toFixed(3)
      el.style.filter = `hue-rotate(${hue.toFixed(1)}deg) saturate(${sat.toFixed(3)})`
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [reducedMotion])

  return (
    <div ref={wrapRef} className="pulse-overlay" aria-hidden="true">
      <Image
        src="/covers/catching-a-feeling.webp"
        alt=""
        fill
        sizes="50vw"
        className="pulse-overlay-img"
      />
    </div>
  )
}
