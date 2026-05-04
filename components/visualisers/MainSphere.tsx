'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'

interface MainSphereProps {
  analyser: AnalyserNode | null
  muted: boolean
  color: string
  playing: boolean
  position?: [number, number, number]
  scale?: number
}

// Solid low-poly sphere. No custom shader — MeshBasicMaterial only. Audio
// drives scale + rotation + a small hue cycle.
export default function MainSphere({
  analyser,
  muted,
  color,
  playing,
  position = [0, 0, 0],
  scale = 1,
}: MainSphereProps) {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const reducedMotion = useReducedMotion()
  const baseHSL = useRef<{ h: number; s: number; l: number }>({ h: 0, s: 0, l: 0 })
  const midRef = useRef(0)
  const lowRef = useRef(0)

  const [material] = useState(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
  }))
  useEffect(() => {
    material.color.set(color)
    material.color.getHSL(baseHSL.current)
  }, [color, material])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    if (reducedMotion) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (!playing) return

    let low = 0, mid = 0
    if (analyser && !muted) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      low = bandEnergy(dataRef.current, 2, 14)
      mid = bandEnergy(dataRef.current, 14, 95)
    }

    midRef.current = lerpToward(midRef.current, mid, 0.5)
    lowRef.current = lerpToward(lowRef.current, low, 0.4)

    if (meshRef.current) {
      const s = scale * (0.85 + midRef.current * 0.55 + lowRef.current * 0.20)
      meshRef.current.scale.setScalar(s)
      meshRef.current.rotation.y += delta * (0.3 + midRef.current * 1.4)
      meshRef.current.rotation.x += delta * (0.1 + lowRef.current * 0.5)
    }

    // Subtle hue shift — keeps the brand colour but pulses it.
    const h = (baseHSL.current.h + midRef.current * 0.05) % 1
    material.color.setHSL(h, baseHSL.current.s, baseHSL.current.l + midRef.current * 0.1)
  })

  return (
    <mesh ref={meshRef} material={material} position={position}>
      <sphereGeometry args={[1, 32, 24]} />
    </mesh>
  )
}
