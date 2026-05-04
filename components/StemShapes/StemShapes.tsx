'use client'

// Four geometric shapes — one per stem — that double as the mute toggles
// AND as per-stem audio-reactive characters. Returns to the v1 "shape per
// track" idea but driven by Web Audio analysers + ref-mutated CSS transforms
// (no React state during playback, no SVG filter overhead).
//
// Implementation notes:
//   - Each shape is an inline SVG inside a <button>.
//   - The <button> wrapper gets a ref; transform is mutated via DOM each rAF.
//   - Audio is sampled per stem (not the unified mix) so each shape responds
//     to its own track. When muted, the shape softens and the mute multiplier
//     fades to 0 → no movement.
//   - Animation uses scale + rotate only (transform-only, GPU-friendly).

import { useEffect, useRef } from 'react'
import type { Stem } from '@/lib/track-config'
import type { TrackState } from '@/hooks/useAudioEngine'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

interface StemShapesProps {
  stems: Stem[]
  trackStates: TrackState[]
  analysers: (AnalyserNode | null)[]
  playing: boolean
  onToggle: (id: number) => void
  /** Disable until stems have loaded so users don't get stuck pre-toggling silence. */
  disabled?: boolean
}

const SVG_SIZE = 64

// Each stem maps to a distinct geometric character. The SVG is centred at
// (0,0) with a roughly unit radius so a single CSS transform on the button
// can scale all shapes uniformly without per-shape geometry tweaks.
function ShapeSvg({ stemKey }: { stemKey: Stem['key'] }) {
  const r = 26 // base radius — leaves headroom inside SVG_SIZE for stroke + scale
  switch (stemKey) {
    case 'bass':
      // Circle — pulses with the low end like a heartbeat.
      return (
        <svg viewBox={`-${SVG_SIZE / 2} -${SVG_SIZE / 2} ${SVG_SIZE} ${SVG_SIZE}`} aria-hidden="true">
          <circle cx="0" cy="0" r={r} fill="currentColor" />
        </svg>
      )
    case 'drums':
      // Diamond — square rotated 45°. Snaps on every kick.
      return (
        <svg viewBox={`-${SVG_SIZE / 2} -${SVG_SIZE / 2} ${SVG_SIZE} ${SVG_SIZE}`} aria-hidden="true">
          <polygon
            points={`0,-${r} ${r},0 0,${r} -${r},0`}
            fill="currentColor"
          />
        </svg>
      )
    case 'main':
      // Hexagon — slow, steady rotation with mid-frequency body.
      return (
        <svg viewBox={`-${SVG_SIZE / 2} -${SVG_SIZE / 2} ${SVG_SIZE} ${SVG_SIZE}`} aria-hidden="true">
          <polygon
            points={`${r},0 ${r * 0.5},${r * 0.866} -${r * 0.5},${r * 0.866} -${r},0 -${r * 0.5},-${r * 0.866} ${r * 0.5},-${r * 0.866}`}
            fill="currentColor"
          />
        </svg>
      )
    case 'vox':
      // Blob — a soft, slightly irregular path that vibrates with high frequencies.
      return (
        <svg viewBox={`-${SVG_SIZE / 2} -${SVG_SIZE / 2} ${SVG_SIZE} ${SVG_SIZE}`} aria-hidden="true">
          <path
            d={`M ${r * 0.95},-${r * 0.18}
                C ${r * 1.05},${r * 0.45} ${r * 0.45},${r * 1.05} -${r * 0.18},${r * 0.95}
                C -${r * 0.95},${r * 0.55} -${r * 1.05},-${r * 0.35} -${r * 0.55},-${r * 0.95}
                C ${r * 0.25},-${r * 1.05} ${r * 0.95},-${r * 0.65} ${r * 0.95},-${r * 0.18} Z`}
            fill="currentColor"
          />
        </svg>
      )
  }
}

interface ShapeButtonProps {
  stem: Stem
  index: number
  trackState: TrackState | undefined
  analyser: AnalyserNode | null
  playing: boolean
  onToggle: () => void
  disabled?: boolean
}

function ShapeButton({ stem, trackState, analyser, playing, onToggle, disabled }: ShapeButtonProps) {
  // The rAF mutates `transform` on this inner wrapper, NOT on the button —
  // otherwise the label below would scale + rotate with the shape.
  const shapeRef = useRef<HTMLSpanElement | null>(null)
  const reducedMotion = useReducedMotion()
  const dataRef = useRef<Uint8Array | null>(null)
  const detectorRef = useRef(new TransientDetector({ threshold: 1.4, cooldownFrames: 5, windowSize: 8 }))
  const frameIdx = useRef(0)
  const energyRef = useRef(0)
  const pulseRef = useRef(0)
  const rotationRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  // Latest props in refs so the rAF loop reads fresh values without re-binding.
  const playingRef = useRef(playing)
  const mutedRef = useRef(trackState?.muted ?? false)
  const analyserRef = useRef(analyser)
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => { mutedRef.current = trackState?.muted ?? false }, [trackState?.muted])
  useEffect(() => { analyserRef.current = analyser }, [analyser])

  useEffect(() => {
    if (reducedMotion) return

    let lastT = performance.now()
    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick)
      const delta = Math.min(0.05, (now - lastT) / 1000)
      lastT = now

      if (typeof document !== 'undefined' && document.hidden) return

      const a = analyserRef.current
      let energy = 0
      let kicked = false

      if (playingRef.current && a && !mutedRef.current) {
        const cur = dataRef.current
        const buf = (!cur || cur.length !== a.frequencyBinCount)
          ? (dataRef.current = new Uint8Array(a.frequencyBinCount))
          : cur
        a.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)

        // Stem-appropriate band — each shape responds to what its stem actually carries.
        if (stem.key === 'bass')       energy = bandEnergy(buf, 1, 14)
        else if (stem.key === 'drums') energy = bandEnergy(buf, 2, 8)
        else if (stem.key === 'main')  energy = bandEnergy(buf, 14, 95)
        else                            energy = bandEnergy(buf, 95, 280)

        if (stem.key === 'drums') {
          kicked = detectorRef.current.push(energy, frameIdx.current)
        }
      }
      frameIdx.current++

      // Smooth the energy reading; transient gives an instant pulse spike.
      energyRef.current = lerpToward(energyRef.current, energy, 0.45)
      if (kicked) pulseRef.current = 1
      pulseRef.current = lerpToward(pulseRef.current, 0, 0.18)

      // Continuous rotation (only main + vox feel right with rotation).
      if (stem.key === 'main')      rotationRef.current += delta * (10 + energyRef.current * 60)
      else if (stem.key === 'vox')  rotationRef.current += delta * (-6 - energyRef.current * 40)

      // Per-shape transform recipe.
      let scale = 1
      let rot = 0
      switch (stem.key) {
        case 'bass':
          // Heartbeat scaling on low energy.
          scale = 1 + energyRef.current * 0.45
          break
        case 'drums':
          // Sharp kick spike + a small wobble rotation.
          scale = 1 + pulseRef.current * 0.55 + energyRef.current * 0.10
          rot = pulseRef.current * 12
          break
        case 'main':
          // Smooth breathing + slow continuous rotation.
          scale = 1 + energyRef.current * 0.35
          rot = rotationRef.current
          break
        case 'vox':
          // Fine vibration via slight scale + counter-rotation.
          scale = 1 + energyRef.current * 0.30
          rot = rotationRef.current
          break
      }

      const node = shapeRef.current
      if (node) {
        node.style.transform = `scale(${scale.toFixed(4)}) rotate(${rot.toFixed(2)}deg)`
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [reducedMotion, stem.key])

  const muted = trackState?.muted ?? false

  return (
    <button
      type="button"
      className="stem-shape"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={muted}
      aria-label={`${stem.label} stem: ${muted ? 'unmute' : 'mute'}`}
      data-muted={muted}
      style={{ color: stem.color }}
    >
      <span ref={shapeRef} className="stem-shape-surface">
        <ShapeSvg stemKey={stem.key} />
      </span>
      <span className="stem-shape-label" aria-hidden="true">{stem.label}</span>
    </button>
  )
}

export default function StemShapes({ stems, trackStates, analysers, playing, onToggle, disabled }: StemShapesProps) {
  return (
    <nav className="stem-shapes" aria-label="Stem mute controls">
      <ul>
        {stems.map((stem, i) => (
          <li key={stem.key}>
            <ShapeButton
              stem={stem}
              index={i}
              trackState={trackStates[i]}
              analyser={analysers[i] ?? null}
              playing={playing}
              onToggle={() => onToggle(i)}
              disabled={disabled}
            />
          </li>
        ))}
      </ul>
    </nav>
  )
}
