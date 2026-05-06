'use client'

// Reusable wireframe terrain — single PlaneGeometry with a custom vertex
// shader for audio-reactive displacement and a TRIVIAL fragment shader that
// just outputs a solid colour. No lighting, no height-based gradients, no
// fog. Performance is the priority; the look is the wireframe geometry
// itself, not the shading.
//
// Layout / reuse:
//   The component renders a <section> that fills its parent. Drop it in and
//   it covers whatever container it's mounted in — typically a full-viewport
//   hero behind other content.
//
// Audio inputs:
//   Reads four AnalyserNodes (bass / drums / main / vox) and resolves a
//   matching mute state per stem. Each stem contributes a different
//   displacement layer:
//     bass  → broad rolling hills
//     drums → radial pulse from origin on each kick transient
//     main  → mid-frequency wave field
//     vox   → fine high-frequency ripples
//   Mute a stem → its multiplier lerps to 0 → its layer disappears.

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { VisualiserProps } from '@/components/Hero/HeroPage'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

// Force the active camera to look at a fixed world target — drei's
// PerspectiveCamera doesn't expose a lookAt prop, so we apply it via R3F's
// camera object once on mount and on target change.
function CameraLookAt({ target }: { target: [number, number, number] }) {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    camera.lookAt(target[0], target[1], target[2])
    camera.updateProjectionMatrix()
  }, [camera, target])
  return null
}

export interface TerrainProps extends VisualiserProps {
  /** Hex colour for the wireframe lines. Default is the brand mid-purple. */
  color?: string
  /** Override mesh segmentation if perf needs it lower. Default 180 × 90 ≈ 16k verts. */
  segments?: { w: number; d: number }
}

const PLANE_W = 22
const PLANE_D = 14

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uLow;
  uniform float uMid;
  uniform float uKick;
  uniform float uDrumBody;   // continuous mid-band drums (body / snare) — keeps the terrain alive between kicks
  uniform float uHigh;
  uniform float uLowMute;
  uniform float uMidMute;
  uniform float uKickMute;
  uniform float uHighMute;
  uniform float uDrumSolo;   // 0..1: ramps to 1 when drums is the ONLY active stem

  void main() {
    vec3 pos = position;

    float bass   = sin(pos.x * 0.42 + uTime * 0.32) * cos(pos.y * 0.30 + uTime * 0.22);
    float mid    = sin(pos.x * 0.85 + uTime * 0.65) * cos(pos.y * 1.05 + uTime * 0.48);
    float ripple = sin(pos.x * 3.40 + uTime * 1.70) * cos(pos.y * 3.40 + uTime * 1.55);
    float r = length(pos.xy);
    // Wider falloff than before (was 0.42) — kick spreads further across the plane.
    float ring = exp(-r * 0.28);
    // Continuous drum-body wave — different wavelength than bass/mid so it
    // reads as a distinct rhythmic layer when drums plays alone.
    float drumWave = sin(pos.x * 0.55 + uTime * 1.25) * cos(pos.y * 0.65 + uTime * 0.95);

    // When drums is solo, scale up its contribution so the terrain feels
    // alive even without the other layers.
    float drumBoost = 1.0 + uDrumSolo * 1.6;

    float h =
      bass   * uLow      * uLowMute  * 0.65 +
      mid    * uMid      * uMidMute  * 0.42 +
      ring   * uKick     * uKickMute * 1.55 * drumBoost +
      drumWave * uDrumBody * uKickMute * 0.55 * drumBoost +
      ripple * uHigh     * uHighMute * 0.18;

    pos.z += h;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

// Trivial fragment shader — solid colour, no varyings, no lighting math.
// For wireframe rendering this only runs on line-rasterised pixels.
const fragmentShader = /* glsl */ `
  precision lowp float;
  uniform vec3 uColor;
  void main() {
    gl_FragColor = vec4(uColor, 1.0);
  }
`

function TerrainMesh({ stems, trackStates, analysers, playing, color = '#8B3AC4' }: TerrainProps) {
  const reducedMotion = useReducedMotion()
  const detector = useState(() => new TransientDetector({ threshold: 1.32, cooldownFrames: 5, windowSize: 8 }))[0]
  const dataRefs = useRef<(Uint8Array | null)[]>([null, null, null, null])
  const frameIdx = useRef(0)
  const timeRef = useRef(0)

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
      uDrumBody:  { value: 0 },
      uHigh:      { value: 0 },
      uLowMute:   { value: 1 },
      uMidMute:   { value: 1 },
      uKickMute:  { value: 1 },
      uHighMute:  { value: 1 },
      uDrumSolo:  { value: 0 },
      uColor:     { value: new THREE.Color(color) },
    },
  }))

  useEffect(() => {
    /* eslint-disable react-hooks/immutability -- THREE uniform mutation */
    material.uniforms.uColor.value.set(color)
    /* eslint-enable react-hooks/immutability */
  }, [color, material])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    if (reducedMotion) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (!playing) return

    timeRef.current += delta

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

    const low      = bassIdx  != null ? readBand(bassIdx,  1, 14) : 0
    const kick     = drumsIdx != null ? readBand(drumsIdx, 2, 8)  : 0
    // Drum body — snare / mid-frequency drum content (~200-1500 Hz). Drives
    // the continuous drumWave layer so drums has motion between kicks.
    const drumBody = drumsIdx != null ? readBand(drumsIdx, 9, 60) : 0
    const mid      = mainIdx  != null ? readBand(mainIdx, 14, 95) : 0
    const high     = voxIdx   != null ? readBand(voxIdx,  95, 280): 0

    const kicked = drumsIdx != null && detector.push(kick, frameIdx.current)
    frameIdx.current++

    // Drum-solo target: 1 when drums is the only unmuted stem, else 0.
    const isUnmuted = (idx: number | undefined) => idx != null && !trackStates[idx]?.muted
    const drumSoloTarget = isUnmuted(drumsIdx)
      && !isUnmuted(bassIdx) && !isUnmuted(mainIdx) && !isUnmuted(voxIdx)
      ? 1 : 0

    /* eslint-disable react-hooks/immutability -- THREE uniforms mutated each frame */
    const u = material.uniforms
    u.uTime.value = timeRef.current
    u.uLow.value      = lerpToward(u.uLow.value,      low,      0.55)
    u.uMid.value      = lerpToward(u.uMid.value,      mid,      0.50)
    u.uHigh.value     = lerpToward(u.uHigh.value,     high,     0.55)
    u.uDrumBody.value = lerpToward(u.uDrumBody.value, drumBody, 0.40)
    if (kicked) u.uKick.value = 1
    u.uKick.value = lerpToward(u.uKick.value, 0, 0.13)

    const target = (idx: number) => (idx != null && trackStates[idx]?.muted ? 0 : 1)
    u.uLowMute.value  = lerpToward(u.uLowMute.value,  target(bassIdx),  0.18)
    u.uMidMute.value  = lerpToward(u.uMidMute.value,  target(mainIdx),  0.18)
    u.uKickMute.value = lerpToward(u.uKickMute.value, target(drumsIdx), 0.18)
    u.uHighMute.value = lerpToward(u.uHighMute.value, target(voxIdx),   0.18)
    // Slow lerp on the solo flag — gives a smooth ramp-down as other stems
    // come in during the onboarding rather than a hard cut.
    u.uDrumSolo.value = lerpToward(u.uDrumSolo.value, drumSoloTarget, 0.04)
    /* eslint-enable react-hooks/immutability */
  })

  const segW = 180
  const segD = 90

  return (
    <mesh
      material={material}
      rotation={[-Math.PI / 2 + 0.05, 0, 0]}
      position={[0, -0.4, 0]}
    >
      <planeGeometry args={[PLANE_W, PLANE_D, segW, segD]} />
    </mesh>
  )
}

export default function Terrain(props: TerrainProps) {
  return (
    <section
      className="terrain"
      aria-hidden="true"
    >
      <Canvas
        dpr={1}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        frameloop="always"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Camera tuned for the short-wide hero canvas (100vw × 50vh).
            Lower Y + wider fov keeps the wireframe filling the viewport. */}
        <PerspectiveCamera makeDefault position={[0, 2.2, 5.8]} fov={52} near={0.1} far={60} />
        <CameraLookAt target={[0, -0.6, 0]} />
        <TerrainMesh {...props} />
      </Canvas>
    </section>
  )
}
