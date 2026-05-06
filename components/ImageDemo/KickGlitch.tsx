'use client'

// Variant D — flashes a duotone'd portrait briefly on each detected kick
// transient, then fades out. Mounts in HeroPage's `glitchOverlay` slot.
//
// Implementation: rAF loop reads the drums analyser, transient detector fires,
// pulseRef snaps to 1 + a random translate offset for a glitch feel; the
// element's opacity + transform are mutated via DOM each frame (no React
// state during playback). Pulse decays exponentially.

import { useEffect, useRef } from 'react'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

interface KickGlitchProps {
  drumsAnalyser: AnalyserNode | null
  drumsMuted: boolean
  playing: boolean
}

export default function KickGlitch({ drumsAnalyser, drumsMuted, playing }: KickGlitchProps) {
  const elRef = useRef<HTMLDivElement | null>(null)
  const reducedMotion = useReducedMotion()
  const dataRef = useRef<Uint8Array | null>(null)
  const detector = useRef(new TransientDetector({ threshold: 1.4, cooldownFrames: 5, windowSize: 8 }))
  const frameIdx = useRef(0)
  const pulseRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const playingRef = useRef(playing)
  const mutedRef = useRef(drumsMuted)
  const analyserRef = useRef(drumsAnalyser)
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => { mutedRef.current = drumsMuted }, [drumsMuted])
  useEffect(() => { analyserRef.current = drumsAnalyser }, [drumsAnalyser])

  useEffect(() => {
    if (reducedMotion) {
      const el = elRef.current
      if (el) el.style.opacity = '0'
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
        kickEnergy = bandEnergy(buf, 2, 8)
        kicked = detector.current.push(kickEnergy, frameIdx.current)
      }
      frameIdx.current++

      if (kicked) pulseRef.current = 1
      pulseRef.current = lerpToward(pulseRef.current, 0, 0.18)

      const el = elRef.current
      if (!el) return
      // Opacity peaks at ~0.42 on each kick — bright enough to flash, low
      // enough not to dominate.
      const op = pulseRef.current * 0.42
      // Glitch jitter: small random translate, scaled by pulse.
      const jx = (Math.random() - 0.5) * 12 * pulseRef.current
      const jy = (Math.random() - 0.5) * 6 * pulseRef.current
      const sx = 1 + pulseRef.current * 0.04
      el.style.opacity = op.toFixed(3)
      el.style.transform = `translate(${jx.toFixed(2)}px, ${jy.toFixed(2)}px) scale(${sx.toFixed(4)})`
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [reducedMotion])

  return (
    <div
      ref={elRef}
      className="kick-glitch"
      aria-hidden="true"
      style={{
        backgroundImage: 'url(/artist/maz-bw-wide.webp)',
      }}
    />
  )
}
