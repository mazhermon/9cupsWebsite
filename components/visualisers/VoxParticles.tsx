'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'

interface VoxParticlesProps {
  analyser: AnalyserNode | null
  muted: boolean
  color: string
  playing: boolean
  position?: [number, number, number]
  scale?: number
}

// Cheap horizontal particle river. Built-in PointsMaterial (no custom shader),
// positions updated in JS each frame. Mid-frequency energy widens the band and
// speeds the drift; high-frequency adds a small jitter.
const PARTICLE_COUNT = 80
const FLOW_LENGTH = 7.5
const FLOW_THICKNESS = 0.9

interface Particle {
  offset: number      // 0..1, position along the flow
  lane: number        // -0.5..0.5, vertical lane bias
  phase: number       // random phase for Y wobble
  size: number        // base point size
}

export default function VoxParticles({
  analyser,
  muted,
  color,
  playing,
  position = [0, 0, 0],
  scale = 1,
}: VoxParticlesProps) {
  const pointsRef = useRef<THREE.Points | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const reducedMotion = useReducedMotion()
  const timeRef = useRef(0)
  const midRef = useRef(0)
  const highRef = useRef(0)

  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: PARTICLE_COUNT }, () => ({
      offset: Math.random(),
      lane: Math.random() - 0.5,
      phase: Math.random() * Math.PI * 2,
      size: 0.5 + Math.random() * 0.8,
    })),
  )

  const [geometry] = useState(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
    return g
  })

  const [material] = useState(() => new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: 0.08,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  }))
  useEffect(() => { material.color.set(color) }, [color, material])
  useEffect(() => () => { material.dispose(); geometry.dispose() }, [material, geometry])

  useFrame((_, delta) => {
    if (reducedMotion) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (!playing) return

    timeRef.current += delta

    let mid = 0, high = 0
    if (analyser && !muted) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      mid = bandEnergy(dataRef.current, 14, 95)
      high = bandEnergy(dataRef.current, 95, 280)
    }

    midRef.current = lerpToward(midRef.current, mid, 0.18)
    highRef.current = lerpToward(highRef.current, high, 0.22)

    /* eslint-disable react-hooks/immutability -- particle offsets and BufferAttribute arrays are mutable scratch state. */
    const positions = geometry.attributes.position.array as Float32Array
    const speed = 0.05 + midRef.current * 0.22
    const wobbleAmp = 0.15 + midRef.current * 0.18
    const jitterAmp = highRef.current * 0.12
    const t = timeRef.current

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i]
      p.offset = (p.offset + delta * speed) % 1
      const x = (p.offset - 0.5) * FLOW_LENGTH
      const y = Math.sin(t * 0.9 + p.phase) * wobbleAmp + p.lane * FLOW_THICKNESS + (Math.random() - 0.5) * jitterAmp
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = 0
    }
    geometry.attributes.position.needsUpdate = true
    /* eslint-enable react-hooks/immutability */
  })

  return (
    <points ref={pointsRef} material={material} geometry={geometry} position={position} scale={scale} />
  )
}
