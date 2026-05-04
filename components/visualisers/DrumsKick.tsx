'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

interface DrumsKickProps {
  analyser: AnalyserNode | null
  muted: boolean
  color: string
  playing: boolean
  position?: [number, number, number]
  scale?: number
}

// Cheap wireframe icosahedron. Snaps bigger on each kick transient, decays
// back to baseline. Constant Y rotation gives the spinning-ball look without
// shaders.
export default function DrumsKick({
  analyser,
  muted,
  color,
  playing,
  position = [0, 0, 0],
  scale = 1,
}: DrumsKickProps) {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const reducedMotion = useReducedMotion()
  const detector = useState(() => new TransientDetector({ threshold: 1.4, cooldownFrames: 5, windowSize: 8 }))[0]
  const frameIdx = useRef(0)
  const pulseRef = useRef(0)
  const baseScaleRef = useRef(1)

  const [material] = useState(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    wireframe: true,
  }))
  useEffect(() => { material.color.set(color) }, [color, material])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    if (reducedMotion) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (!playing) return

    let kick = 0
    let mid = 0
    let kicked = false
    if (analyser && !muted) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      // ~40-150 Hz for the kick (bins 2-7)
      kick = bandEnergy(dataRef.current, 2, 8)
      // ~200-2000 Hz for snare body (drives rotation)
      mid = bandEnergy(dataRef.current, 9, 90)
      kicked = detector.push(kick, frameIdx.current)
    }
    frameIdx.current++

    if (kicked) pulseRef.current = 1
    pulseRef.current = lerpToward(pulseRef.current, kick * 0.5, 0.20)

    if (meshRef.current) {
      // Snap-on-kick scale + spin.
      const s = 1 + pulseRef.current * 0.45
      meshRef.current.scale.setScalar(s * baseScaleRef.current)
      meshRef.current.rotation.y += delta * (0.4 + mid * 1.6)
      meshRef.current.rotation.x += delta * (0.15 + pulseRef.current * 0.8)
    }
  })

  // Apply the prop scale to the geometry baseline (rather than chaining a group).
  useEffect(() => { baseScaleRef.current = scale }, [scale])

  return (
    <mesh ref={meshRef} material={material} position={position}>
      <icosahedronGeometry args={[0.95, 1]} />
    </mesh>
  )
}
