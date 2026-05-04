'use client'

// Option B: 2D HUD meters per stem in front of a simpler 3D wireframe terrain
// backdrop. The meters do precise per-frame audio-visual sync (CSS scaleY
// keyed to a ref, no React state). The terrain is bass+kick-only and provides
// atmospheric depth.

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { VisualiserProps } from '@/components/Hero/HeroPage'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

// ─── Backdrop terrain (cheaper than Option A's — bass + kick only) ──────
const PLANE_W = 22
const PLANE_D = 14
const SEG_W = 140
const SEG_D = 70

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uLow;
  uniform float uKick;
  uniform float uLowMute;
  uniform float uKickMute;
  varying float vH;
  varying vec2  vUvLocal;

  void main() {
    vec3 pos = position;
    vUvLocal = uv;

    float bass = sin(pos.x * 0.40 + uTime * 0.30) * cos(pos.y * 0.28 + uTime * 0.22);
    float r = length(pos.xy);
    float ring = exp(-r * 0.40);

    float h =
      bass * uLow * uLowMute * 0.7 +
      ring * uKick * uKickMute * 1.4;

    pos.z += h;
    vH = h;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision mediump float;
  varying float vH;
  varying vec2  vUvLocal;
  void main() {
    float n = clamp(abs(vH) * 1.4, 0.0, 1.0);
    vec3 col = mix(vec3(0.13, 0.04, 0.22), vec3(0.55, 0.10, 0.32), n);
    col *= mix(0.10, 0.78, vUvLocal.y);
    gl_FragColor = vec4(col, 1.0);
  }
`

function BackdropTerrain({ analysers, trackStates, stems, playing }: VisualiserProps) {
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
      uTime:     { value: 0 },
      uLow:      { value: 0 },
      uKick:     { value: 0 },
      uLowMute:  { value: 1 },
      uKickMute: { value: 1 },
    },
  }))
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

    const bassIdx = idxByKey.bass
    const drumsIdx = idxByKey.drums
    const low = bassIdx != null ? readBand(bassIdx, 1, 14) : 0
    const kick = drumsIdx != null ? readBand(drumsIdx, 2, 8) : 0
    const kicked = drumsIdx != null && detector.push(kick, frameIdx.current)
    frameIdx.current++

    /* eslint-disable react-hooks/immutability */
    const u = material.uniforms
    u.uTime.value = timeRef.current
    u.uLow.value = lerpToward(u.uLow.value, low, 0.55)
    if (kicked) u.uKick.value = 1
    u.uKick.value = lerpToward(u.uKick.value, 0, 0.13)
    u.uLowMute.value = lerpToward(u.uLowMute.value, bassIdx != null && trackStates[bassIdx]?.muted ? 0 : 1, 0.18)
    u.uKickMute.value = lerpToward(u.uKickMute.value, drumsIdx != null && trackStates[drumsIdx]?.muted ? 0 : 1, 0.18)
    /* eslint-enable react-hooks/immutability */
  })

  return (
    <mesh material={material} rotation={[-Math.PI / 2 + 0.05, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[PLANE_W, PLANE_D, SEG_W, SEG_D]} />
    </mesh>
  )
}

// ─── HTML HUD meters — one per stem ──────────────────────────────────────
// Positioned over the canvas. Each meter is two stacked div layers:
//   `.meter-fill` : transform: scaleY(value) keyed via direct DOM mutation in rAF
//   `.meter-bg`   : static
// We write to style.transform from a rAF loop, never via React state, so no
// re-renders happen during playback.

function StemMeters({ analysers, trackStates, stems, playing }: VisualiserProps) {
  const fillRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null])
  const dataRefs = useRef<(Uint8Array | null)[]>([null, null, null, null])
  const valuesRef = useRef<number[]>([0, 0, 0, 0])
  const rafRef = useRef<number | null>(null)
  const playingRef = useRef(playing)
  const tracksRef = useRef(trackStates)
  const analysersRef = useRef(analysers)
  const stemsRef = useRef(stems)
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => { tracksRef.current = trackStates }, [trackStates])
  useEffect(() => { analysersRef.current = analysers }, [analysers])
  useEffect(() => { stemsRef.current = stems }, [stems])

  useEffect(() => {
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick)

      if (typeof document !== 'undefined' && document.hidden) return

      const stemsLocal = stemsRef.current
      const tracksLocal = tracksRef.current
      const analysersLocal = analysersRef.current
      const playingLocal = playingRef.current

      for (let i = 0; i < stemsLocal.length; i++) {
        const stem = stemsLocal[i]
        const muted = tracksLocal[i]?.muted
        const a = analysersLocal[i]

        let target = 0
        if (playingLocal && a && !muted) {
          const cur = dataRefs.current[i]
          const buf = (!cur || cur.length !== a.frequencyBinCount)
            ? (dataRefs.current[i] = new Uint8Array(a.frequencyBinCount))
            : cur
          a.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
          // Stem-appropriate band so the meter reflects what that stem carries.
          if (stem.key === 'bass')       target = bandEnergy(buf, 1, 14)
          else if (stem.key === 'drums') target = bandEnergy(buf, 2, 8)
          else if (stem.key === 'main')  target = bandEnergy(buf, 14, 95)
          else                            target = bandEnergy(buf, 95, 280)
        }

        // Snap up, decay down — gives the meter a "peak hold" feel.
        const cur = valuesRef.current[i]
        const next = target > cur ? lerpToward(cur, target, 0.7) : lerpToward(cur, target, 0.18)
        valuesRef.current[i] = next

        const fill = fillRefs.current[i]
        if (fill) {
          // scaleY only — hardware-accelerated, no layout.
          fill.style.transform = `scaleY(${next.toFixed(4)})`
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <div className="hud-meters" aria-hidden="true">
      {stems.map((stem, i) => (
        <div className="hud-meter" key={stem.key} style={{ '--meter-color': stem.color } as React.CSSProperties}>
          <div className="hud-meter-bg" />
          <div
            className="hud-meter-fill"
            ref={(el) => { fillRefs.current[i] = el }}
          />
          <div className="hud-meter-label">{stem.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function HudMeters3D(props: VisualiserProps) {
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
          <BackdropTerrain {...props} />
        </Canvas>
      </div>
      <StemMeters {...props} />
    </section>
  )
}
