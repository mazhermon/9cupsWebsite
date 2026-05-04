'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

interface BassTerrainProps {
  analyser: AnalyserNode | null
  muted: boolean
  color: string
  playing: boolean
  position?: [number, number, number]
  scale?: number
}

// Cheap wireframe ground. Static geometry — no shader displacement, no
// per-vertex noise. Audio drives the group Y position only: bass kicks bounce
// the whole plane up; mid-frame energy adds a gentle float.
const PLANE_W = 9
const PLANE_D = 5
const PLANE_SEG_W = 30
const PLANE_SEG_D = 16

export default function BassTerrain({
  analyser,
  muted,
  color,
  playing,
  position = [0, 0, 0],
  scale = 1,
}: BassTerrainProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const reducedMotion = useReducedMotion()
  const detector = useState(() => new TransientDetector({ threshold: 1.32, cooldownFrames: 6, windowSize: 8 }))[0]
  const frameIdx = useRef(0)
  const pulseRef = useRef(0)
  const lowRef = useRef(0)

  const [material] = useState(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    wireframe: true,
  }))
  useEffect(() => { material.color.set(color) }, [color, material])
  useEffect(() => () => material.dispose(), [material])

  useFrame(() => {
    if (reducedMotion) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (!playing) return

    let low = 0
    let kicked = false
    if (analyser && !muted) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      // Sub/low bass: 21–300 Hz (bins 1–14)
      low = bandEnergy(dataRef.current, 1, 14)
      kicked = detector.push(low, frameIdx.current)
    }
    frameIdx.current++

    // Sharp pulse on transient, fast decay.
    if (kicked) pulseRef.current = 1
    pulseRef.current = lerpToward(pulseRef.current, 0, 0.12)
    lowRef.current = lerpToward(lowRef.current, low, 0.55)

    if (groupRef.current) {
      // Group bounces vertically on bass — obvious sync, zero GPU cost.
      groupRef.current.position.y = position[1] + pulseRef.current * 0.35 + lowRef.current * 0.15
    }
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh material={material} rotation={[-Math.PI / 2 + 0.04, 0, 0]}>
        <planeGeometry args={[PLANE_W, PLANE_D, PLANE_SEG_W, PLANE_SEG_D]} />
      </mesh>
    </group>
  )
}
