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

const PARTICLE_COUNT = 240
// Horizontal river of particles drifting left → right. FLOW_LENGTH is the
// world-space span — sized to fit the visible stage in the shared scene.
const FLOW_LENGTH = 7.5
const FLOW_THICKNESS = 1.0

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aLane;     // 0..1 vertical lane index
  attribute float aOffset;   // per-particle phase
  uniform float uTime;
  uniform float uLow;
  uniform float uMid;
  uniform float uHigh;
  uniform float uFlowLength;
  uniform float uFlowThickness;
  varying float vEnergy;
  varying float vLane;

  void main() {
    vec3 pos = position;
    // Slow horizontal drift — speed mildly modulated by audio so the river doesn't surge.
    float speed = 0.085 + uMid * 0.16 + uHigh * 0.08;
    float forward = mod(uTime * speed + aOffset, 1.0);
    pos.x = (forward - 0.5) * uFlowLength;
    // Continuous vertical swirl, mostly time-driven; energy gently widens the band.
    float swirl = sin(uTime * 0.9 + aOffset * 6.28 + aLane * 3.14) * (0.085 + uMid * 0.07);
    float scatter = (uHigh * 0.5 + uLow * 0.18) * 0.16 * (sin(aOffset * 25.0) * 0.5 + cos(aOffset * 17.0) * 0.5);
    pos.y = swirl + scatter + (aLane - 0.5) * 0.18;
    // Depth motion for parallax.
    pos.z = cos(uTime * 0.55 + aOffset * 5.1) * 0.14;
    // Confine y to the river's thickness.
    pos.y = clamp(pos.y, -uFlowThickness * 0.5, uFlowThickness * 0.5);

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    // Size grows softly with audio.
    float sizeMod = 0.6 + uMid * 0.85 + uHigh * 0.4;
    gl_PointSize = aSize * sizeMod;

    vEnergy = uMid * 0.6 + uHigh * 0.4;
    vLane = aLane;
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vEnergy;
  varying float vLane;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float r = length(c);
    if (r > 0.5) discard;
    // Crystalline edge: sharp disc with a thin antialias band.
    float disc = smoothstep(0.5, 0.42, r);
    // Bright concentrated core for sparkle.
    float core = smoothstep(0.18, 0.05, r);
    vec3 hot = uColor + vec3(0.5, 0.25, 0.45);
    vec3 col = mix(uColor, hot, vEnergy);
    col *= 0.85 + 0.4 * vLane;
    // Compose: solid disc + brighter centre.
    float alpha = disc * (0.55 + vEnergy * 0.4) + core * 0.6;
    gl_FragColor = vec4(col + vec3(0.4) * core * vEnergy, alpha);
  }
`

export default function VoxParticles({ analyser, muted, color, playing, position = [0, 0, 0], scale = 1 }: VoxParticlesProps) {
  const dataRef = useRef<Uint8Array | null>(null)
  const reducedMotion = useReducedMotion()
  const timeRef = useRef(0)

  const [geometry] = useState(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const lanes = new Float32Array(PARTICLE_COUNT)
    const offsets = new Float32Array(PARTICLE_COUNT)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Position is overridden in vertex shader; just seed valid initial values.
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      sizes[i] = 4 + Math.random() * 12
      lanes[i] = Math.random()
      offsets[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('aLane', new THREE.BufferAttribute(lanes, 1))
    g.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1))
    return g
  })

  const [material] = useState(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uLow: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uColor: { value: new THREE.Color(color) },
      uFlowLength: { value: FLOW_LENGTH },
      uFlowThickness: { value: FLOW_THICKNESS },
    },
  }))

  useEffect(() => {
    /* eslint-disable react-hooks/immutability */
    material.uniforms.uColor.value.set(color)
    /* eslint-enable react-hooks/immutability */
  }, [color, material])
  useEffect(() => () => { material.dispose(); geometry.dispose() }, [material, geometry])

  useFrame((_, delta) => {
    if (reducedMotion) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (!playing) return

    timeRef.current += delta

    let low = 0, mid = 0, high = 0
    if (analyser && !muted) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      // Vocal range is roughly 100Hz–4kHz with formants concentrated in 200–2000Hz.
      // Low: chest body 100-300 Hz (bins 5-14)
      low = bandEnergy(dataRef.current, 5, 14)
      // Mid: vocal core 300-2000 Hz (bins 14-93)
      mid = bandEnergy(dataRef.current, 14, 95)
      // High: presence/sibilance 2-8 kHz (bins 95-370)
      high = bandEnergy(dataRef.current, 95, 280)
    }

    /* eslint-disable react-hooks/immutability */
    const u = material.uniforms
    u.uTime.value = timeRef.current
    // Slower lerps so transient spikes can't yank particles into new positions.
    u.uLow.value = lerpToward(u.uLow.value, low, 0.10)
    u.uMid.value = lerpToward(u.uMid.value, mid, 0.13)
    u.uHigh.value = lerpToward(u.uHigh.value, high, 0.11)
    /* eslint-enable react-hooks/immutability */
  })

  return (
    <points material={material} position={position} scale={scale}>
      <primitive attach="geometry" object={geometry} />
    </points>
  )
}
