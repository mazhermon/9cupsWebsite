'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { TrackState } from '@/hooks/useAudioEngine'

export type ShapeType = 'circle' | 'hexagon' | 'diamond' | 'blob'

interface TrackShapeProps {
  track: TrackState
  color: string
  shape: ShapeType
  label: string
  analyser: AnalyserNode | null
  onToggle: () => void
}

// SVG viewBox is 200x200, shapes are centered at 100,100
function getShapePath(shape: ShapeType): string {
  switch (shape) {
    case 'circle':
      return 'M100,20 A80,80 0 1,1 99.999,20 Z'
    case 'hexagon': {
      const cx = 100, cy = 100, r = 80
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 180) * (60 * i - 30)
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
      })
      return `M${pts.join('L')}Z`
    }
    case 'diamond':
      return 'M100,18 L182,100 L100,182 L18,100 Z'
    case 'blob':
      // Organic 8-point star-like blob
      return [
        'M100,22',
        'C118,22 138,38 148,55',
        'C158,72 178,80 178,100',
        'C178,120 158,128 148,145',
        'C138,162 118,178 100,178',
        'C82,178 62,162 52,145',
        'C42,128 22,120 22,100',
        'C22,80 42,72 52,55',
        'C62,38 82,22 100,22',
        'Z',
      ].join(' ')
  }
}

export default function TrackShape({ track, color, shape, label, analyser, onToggle }: TrackShapeProps) {
  const filterIdRef = useRef(`distort-${track.id}-${Math.random().toString(36).slice(2)}`)
  const turbulenceRef = useRef<SVGFETurbulenceElement | null>(null)
  const displacementRef = useRef<SVGFEDisplacementMapElement | null>(null)
  const frameRef = useRef<number>(0)
  const dataRef = useRef<Uint8Array | null>(null)
  const phaseRef = useRef(Math.random() * Math.PI * 2)

  const filterId = filterIdRef.current
  const shapePath = getShapePath(shape)

  // Animation loop — reads analyser data and updates SVG filter
  const animate = useCallback(() => {
    frameRef.current = requestAnimationFrame(animate)

    if (!analyser || !turbulenceRef.current || !displacementRef.current) {
      phaseRef.current += 0.008
      const idleScale = 6 + Math.sin(phaseRef.current) * 3
      displacementRef.current?.setAttribute('scale', String(idleScale))
      turbulenceRef.current?.setAttribute(
        'baseFrequency',
        `${0.012 + Math.sin(phaseRef.current * 0.3) * 0.003} 0.015`
      )
      return
    }

    if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
      dataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
    }

    analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)

    // Use low-mid frequencies (index 2–20) for a punchy reactive signal
    let sum = 0
    const start = 2, end = Math.min(20, dataRef.current.length)
    for (let i = start; i < end; i++) sum += dataRef.current[i]
    const avg = sum / (end - start) // 0–255

    const normalised = avg / 255 // 0–1
    phaseRef.current += 0.006

    const scale = 4 + normalised * 40 + Math.sin(phaseRef.current) * 2
    const baseFreq = 0.010 + normalised * 0.012 + Math.sin(phaseRef.current * 0.4) * 0.002

    displacementRef.current.setAttribute('scale', String(scale))
    turbulenceRef.current.setAttribute('baseFrequency', `${baseFreq.toFixed(4)} ${(baseFreq * 1.2).toFixed(4)}`)
    turbulenceRef.current.setAttribute(
      'seed',
      String(Math.floor(phaseRef.current * 10) % 100)
    )
  }, [analyser])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameRef.current)
  }, [animate])

  const isMuted = track.muted
  const isLoaded = track.loaded

  return (
    <div className="track-shape-wrapper" data-muted={isMuted}>
      <button
        className="track-shape-btn"
        onClick={onToggle}
        aria-label={`${label}: ${isMuted ? 'unmute' : 'mute'}`}
        aria-pressed={isMuted}
        disabled={!isLoaded}
        style={{ '--shape-color': color } as React.CSSProperties}
      >
        <svg
          viewBox="0 0 200 200"
          aria-hidden="true"
          focusable="false"
          className="track-svg"
        >
          <defs>
            <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
              <feTurbulence
                ref={turbulenceRef}
                type="turbulence"
                baseFrequency="0.012 0.015"
                numOctaves="3"
                seed="2"
                stitchTiles="stitch"
                result="noise"
              />
              <feDisplacementMap
                ref={displacementRef}
                in="SourceGraphic"
                in2="noise"
                scale="6"
                xChannelSelector="R"
                yChannelSelector="G"
                result="displaced"
              />
            </filter>
          </defs>

          {/* Glow layer */}
          <path
            d={shapePath}
            fill={color}
            opacity={isMuted ? 0.08 : 0.18}
            filter={`url(#${filterId})`}
            className="shape-glow"
            style={{ transform: 'scale(1.15)', transformOrigin: '100px 100px' }}
          />

          {/* Main shape */}
          <path
            d={shapePath}
            fill={color}
            opacity={isMuted ? 0.2 : 1}
            filter={`url(#${filterId})`}
            className="shape-main"
            style={{ transition: 'opacity 0.4s ease' }}
          />

          {/* Muted indicator — X overlay */}
          {isMuted && (
            <g aria-hidden="true">
              <line x1="70" y1="70" x2="130" y2="130" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
              <line x1="130" y1="70" x2="70" y2="130" stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
            </g>
          )}
        </svg>

        <span className="track-label" aria-hidden="true">
          {label}
        </span>
      </button>
    </div>
  )
}
