'use client'

// Option A: one wireframe terrain, all four stems feed one vertex shader.
// Single PlaneGeometry, one shader compile, one render pass. The cheapest
// shape that still gets the topographic-map look.
//
// Layout per stem in the displacement formula:
//   bass  → broad slow rolling hills (huge wavelength sin/cos)
//   drums → radial pulse from origin on each kick transient
//   main  → mid-frequency continuous wave field
//   vox   → fine high-frequency ripples on the surface
// Mute a stem → its multiplier lerps to 0 → its contribution disappears.

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { VisualiserProps } from '@/components/Hero/HeroPage'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

const PLANE_W = 22
const PLANE_D = 14
// Vertex count = (W+1)*(D+1). 180 × 90 ≈ 16k verts — fits the Clicktorelease
// reference perf budget. Adjust here if mobile profiling needs less.
const SEG_W = 180
const SEG_D = 90

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uLow;       // bass smoothed energy
  uniform float uMid;       // main midrange smoothed
  uniform float uKick;      // drums kick pulse (sharp 0..1 with decay)
  uniform float uHigh;      // vox high frequency smoothed
  uniform float uLowMute;   // 0 muted, 1 active (smoothed)
  uniform float uMidMute;
  uniform float uKickMute;
  uniform float uHighMute;
  varying float vH;
  varying vec2  vUvLocal;

  void main() {
    vec3 pos = position;
    vUvLocal = uv;

    // Bass: huge wavelength rolling hills covering the whole plane
    float bass = sin(pos.x * 0.42 + uTime * 0.32) * cos(pos.y * 0.30 + uTime * 0.22);

    // Mid: medium-wavelength wave field (cross-current)
    float mid = sin(pos.x * 0.85 + uTime * 0.65) * cos(pos.y * 1.05 + uTime * 0.48);

    // Vox: fine ripples (smallest wavelength)
    float ripple = sin(pos.x * 3.4 + uTime * 1.7) * cos(pos.y * 3.4 + uTime * 1.55);

    // Drums: radial dome that pulses on each kick — falls off quickly with distance
    float r = length(pos.xy);
    float ring = exp(-r * 0.42);

    float h =
      bass   * uLow  * uLowMute  * 0.65 +
      mid    * uMid  * uMidMute  * 0.42 +
      ring   * uKick * uKickMute * 1.30 +
      ripple * uHigh * uHighMute * 0.18;

    pos.z += h;
    vH = h;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision mediump float;
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  varying float vH;
  varying vec2 vUvLocal;

  void main() {
    float n = clamp(abs(vH) * 1.4, 0.0, 1.0);
    vec3 col = mix(uColorLow, uColorHigh, n);
    // Atmospheric darkening toward the horizon (back of plane = uvLocal.y → 0 after rotation)
    float depth = vUvLocal.y;        // 0 = back, 1 = front
    col *= mix(0.18, 1.0, depth);
    gl_FragColor = vec4(col, 1.0);
  }
`

function TerrainScene({ analysers, trackStates, stems, playing }: VisualiserProps) {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const reducedMotion = useReducedMotion()
  const detector = useState(() => new TransientDetector({ threshold: 1.32, cooldownFrames: 5, windowSize: 8 }))[0]
  const dataRefs = useRef<(Uint8Array | null)[]>([null, null, null, null])
  const frameIdx = useRef(0)
  const timeRef = useRef(0)

  // Resolve stem-key → trackStates index once (per render).
  const idxByKey: Record<string, number> = {}
  stems.forEach((s, i) => { idxByKey[s.key] = i })

  const [material] = useState(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    wireframe: true,
    transparent: false,
    uniforms: {
      uTime:      { value: 0 },
      uLow:       { value: 0 },
      uMid:       { value: 0 },
      uKick:      { value: 0 },
      uHigh:      { value: 0 },
      uLowMute:   { value: 1 },
      uMidMute:   { value: 1 },
      uKickMute:  { value: 1 },
      uHighMute:  { value: 1 },
      // Brand colours: dark valleys → vivid pink/magenta peaks.
      uColorLow:  { value: new THREE.Color('#3B1A6E') },
      uColorHigh: { value: new THREE.Color('#CC2E90') },
    },
  }))

  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    if (reducedMotion) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (!playing) return

    timeRef.current += delta

    // Read each analyser; map to bands. One pass per frame, no allocations.
    const readBand = (idx: number, lo: number, hi: number) => {
      const a = analysers[idx]
      if (!a) return 0
      const cur = dataRefs.current[idx]
      const buf = (!cur || cur.length !== a.frequencyBinCount)
        ? (dataRefs.current[idx] = new Uint8Array(a.frequencyBinCount))
        : cur
      a.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
      return bandEnergy(buf, lo, hi)
    }

    const bassIdx  = idxByKey.bass
    const drumsIdx = idxByKey.drums
    const mainIdx  = idxByKey.main
    const voxIdx   = idxByKey.vox

    // 21–300 Hz for bass low band
    const low  = bassIdx  != null ? readBand(bassIdx,  1, 14) : 0
    // 40–150 Hz for drum kick (transient detection)
    const kick = drumsIdx != null ? readBand(drumsIdx, 2, 8)  : 0
    // 300–2000 Hz for main midrange body
    const mid  = mainIdx  != null ? readBand(mainIdx, 14, 95) : 0
    // 2–8 kHz for vox presence/sibilance
    const high = voxIdx   != null ? readBand(voxIdx,  95, 280): 0

    const kicked = drumsIdx != null && detector.push(kick, frameIdx.current)
    frameIdx.current++

    /* eslint-disable react-hooks/immutability -- THREE uniforms are mutated each frame; documented R3F pattern. */
    const u = material.uniforms
    u.uTime.value = timeRef.current
    u.uLow.value  = lerpToward(u.uLow.value,  low,  0.55)
    u.uMid.value  = lerpToward(u.uMid.value,  mid,  0.50)
    u.uHigh.value = lerpToward(u.uHigh.value, high, 0.55)
    if (kicked) u.uKick.value = 1
    u.uKick.value = lerpToward(u.uKick.value, 0, 0.13)

    // Mute multipliers — smoothly fade contribution when a stem is muted.
    const target = (idx: number) => (idx != null && trackStates[idx]?.muted ? 0 : 1)
    u.uLowMute.value  = lerpToward(u.uLowMute.value,  target(bassIdx),  0.18)
    u.uMidMute.value  = lerpToward(u.uMidMute.value,  target(mainIdx),  0.18)
    u.uKickMute.value = lerpToward(u.uKickMute.value, target(drumsIdx), 0.18)
    u.uHighMute.value = lerpToward(u.uHighMute.value, target(voxIdx),   0.18)
    /* eslint-enable react-hooks/immutability */
  })

  return (
    <mesh
      ref={meshRef}
      material={material}
      // -PI/2 + small tilt so plane lies flat with a slight forward incline,
      // matching the Clicktorelease "looking down a wireframe plain" feel.
      rotation={[-Math.PI / 2 + 0.05, 0, 0]}
      position={[0, -0.4, 0]}
    >
      <planeGeometry args={[PLANE_W, PLANE_D, SEG_W, SEG_D]} />
    </mesh>
  )
}

export default function UnifiedTerrain(props: VisualiserProps) {
  return (
    <section
      id="stage"
      className="stage stage--full"
      aria-label="Stem mixer. Mute or unmute each stem from the buttons above."
    >
      <div className="shared-canvas" aria-hidden="true">
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          frameloop="always"
          style={{ width: '100%', height: '100%' }}
        >
          <PerspectiveCamera makeDefault position={[0, 3.6, 7.2]} fov={42} near={0.1} far={60} />
          <TerrainScene {...props} />
        </Canvas>
      </div>
    </section>
  )
}
