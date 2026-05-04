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

const RING_COUNT = 5
const RING_LIFETIME = 0.85

// Vertex shader: pushes vertices radially outward by uKick (transient flash) + uHigh (snare/hat).
// Uses simplex noise to vary displacement per vertex for organic shatter.
const meshVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uKick;
  uniform float uMid;
  uniform float uHigh;

  // Compact 3D simplex noise (Ashima Arts, public domain).
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m*m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 dir = normalize(position);
    float n  = snoise(position * 1.7 + uTime * 0.6);
    float n2 = snoise(position * 4.5 + uTime * 1.4);
    // Stronger displacement on kick, plus continuous wobble + high-band fine ridges.
    float disp =
      uKick * (0.55 + n * 0.5) +
      uMid * 0.16 +
      uHigh * 0.18 * abs(n2);
    vec3 displaced = position + dir * disp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`

const meshFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uKick;
  void main() {
    vec3 flash = vec3(1.0, 0.92, 0.96);
    vec3 col = mix(uColor, flash, clamp(uKick * 0.85, 0.0, 1.0));
    gl_FragColor = vec4(col, 0.85);
  }
`

// Solid inner core, slightly smaller than the wireframe shell — gives the wireframe a body.
const coreFragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uKick;
  uniform float uHigh;
  varying vec3 vNormal;
  void main() {
    float rim = pow(1.0 - clamp(vNormal.z, 0.0, 1.0), 2.0);
    vec3 col = uColor * (0.18 + uKick * 0.45) + uColor * rim * (0.45 + uHigh * 0.35);
    gl_FragColor = vec4(col, 0.55);
  }
`
const coreVertexShader = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

interface RingState {
  age: number
  active: boolean
  // Each ring picks up the energy snapshot at spawn so colour & thickness match the hit.
  intensity: number
}

export default function DrumsKick({ analyser, muted, color, playing, position = [0, 0, 0], scale = 1 }: DrumsKickProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const reducedMotion = useReducedMotion()
  const detector = useState(() => new TransientDetector({ threshold: 1.4, cooldownFrames: 5, windowSize: 8 }))[0]
  const frameIdx = useRef(0)
  const timeRef = useRef(0)
  const rotationRef = useRef({ x: 0, y: 0 })

  const [meshMaterial] = useState(() => new THREE.ShaderMaterial({
    vertexShader: meshVertexShader,
    fragmentShader: meshFragmentShader,
    transparent: true,
    depthWrite: false,
    wireframe: true,
    uniforms: {
      uTime: { value: 0 },
      uKick: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    },
  }))

  const [coreMaterial] = useState(() => new THREE.ShaderMaterial({
    vertexShader: coreVertexShader,
    fragmentShader: coreFragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uKick: { value: 0 },
      uHigh: { value: 0 },
    },
  }))

  // Pre-build a small pool of expanding torus rings.
  const [ringHandles] = useState(() => {
    const geometry = new THREE.TorusGeometry(1, 0.025, 12, 96)
    return Array.from({ length: RING_COUNT }, () => {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        depthWrite: false,
        opacity: 0,
        toneMapped: false,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.scale.setScalar(0.5)
      mesh.visible = false
      return {
        mesh,
        material,
        state: { age: RING_LIFETIME, active: false, intensity: 0 } as RingState,
      }
    })
  })

  useEffect(() => {
    /* eslint-disable react-hooks/immutability -- THREE uniform / instance mutation. */
    meshMaterial.uniforms.uColor.value.set(color)
    coreMaterial.uniforms.uColor.value.set(color)
    ringHandles.forEach((h) => h.material.color.set(color))
    /* eslint-enable react-hooks/immutability */
  }, [color, meshMaterial, coreMaterial, ringHandles])
  useEffect(() => () => {
    meshMaterial.dispose()
    coreMaterial.dispose()
    ringHandles.forEach((h) => h.material.dispose())
    if (ringHandles[0]) ringHandles[0].mesh.geometry.dispose()
  }, [meshMaterial, coreMaterial, ringHandles])

  // Mount torus rings into the group on first render.
  useEffect(() => {
    if (!groupRef.current) return
    const group = groupRef.current
    ringHandles.forEach((h) => group.add(h.mesh))
    return () => {
      ringHandles.forEach((h) => group.remove(h.mesh))
    }
  }, [ringHandles])

  useFrame((_, delta) => {
    if (reducedMotion) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (!playing) return

    timeRef.current += delta

    let kick = 0
    let mid = 0
    let high = 0
    let kicked = false
    if (analyser && !muted) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      // ~40-150 Hz for the kick (bins 2-7).
      kick = bandEnergy(dataRef.current, 2, 8)
      // ~200-2000 Hz for snare body.
      mid = bandEnergy(dataRef.current, 9, 90)
      // ~3-12 kHz for cymbals/hats.
      high = bandEnergy(dataRef.current, 140, 280)
      kicked = detector.push(kick, frameIdx.current)
    }
    frameIdx.current++

    /* eslint-disable react-hooks/immutability -- THREE uniform mutation. */
    const um = meshMaterial.uniforms
    um.uTime.value = timeRef.current
    um.uKick.value = lerpToward(um.uKick.value, kick * (kicked ? 1.6 : 1.0), kicked ? 0.9 : 0.40)
    um.uMid.value = lerpToward(um.uMid.value, mid, 0.45)
    um.uHigh.value = lerpToward(um.uHigh.value, high, 0.50)

    const uc = coreMaterial.uniforms
    uc.uKick.value = um.uKick.value
    uc.uHigh.value = um.uHigh.value
    /* eslint-enable react-hooks/immutability */

    // Rotation only when playing.
    rotationRef.current.y += delta * (0.18 + mid * 1.2)
    rotationRef.current.x += delta * (0.06 + high * 0.6)
    if (groupRef.current) {
      const wireframeMesh = groupRef.current.children[0]
      const coreMesh = groupRef.current.children[1]
      if (wireframeMesh) {
        wireframeMesh.rotation.y = rotationRef.current.y
        wireframeMesh.rotation.x = rotationRef.current.x
      }
      if (coreMesh) {
        coreMesh.rotation.y = rotationRef.current.y * 0.55
        coreMesh.rotation.x = rotationRef.current.x * 0.55
      }
    }

    // Spawn an expanding shockwave ring on each kick (replaces the particle burst —
    // visually distinct from VOX's continuous particle stream).
    if (kicked) {
      let target = ringHandles.findIndex((h) => !h.state.active)
      if (target === -1) {
        let oldest = 0
        for (let i = 1; i < ringHandles.length; i++) {
          if (ringHandles[i].state.age > ringHandles[oldest].state.age) oldest = i
        }
        target = oldest
      }
      /* eslint-disable react-hooks/immutability -- mutating per-handle scratch state. */
      const h = ringHandles[target]
      h.state.age = 0
      h.state.active = true
      h.state.intensity = Math.min(1, kick * 1.6 + 0.4)
      h.mesh.visible = true
      h.mesh.rotation.set(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        Math.random() * Math.PI,
      )
      /* eslint-enable react-hooks/immutability */
    }

    // Update ring states each frame.
    /* eslint-disable react-hooks/immutability -- mutating ring scratch state + THREE objects. */
    for (let i = 0; i < ringHandles.length; i++) {
      const h = ringHandles[i]
      if (!h.state.active) continue
      h.state.age += delta
      const t = h.state.age / RING_LIFETIME
      if (t >= 1) {
        h.state.active = false
        h.mesh.visible = false
        h.material.opacity = 0
        continue
      }
      // Ease-out scale: starts small, expands fast then slows.
      const ease = 1 - Math.pow(1 - t, 2)
      const scale = 0.45 + ease * 1.95
      h.mesh.scale.setScalar(scale)
      // Fade out: opacity starts at intensity, decays to 0 with a slight tail.
      h.material.opacity = (1 - t) * 0.8 * h.state.intensity
    }
    /* eslint-enable react-hooks/immutability */
  })

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh material={meshMaterial}>
        <icosahedronGeometry args={[0.95, 3]} />
      </mesh>
      <mesh material={coreMaterial}>
        <icosahedronGeometry args={[0.78, 2]} />
      </mesh>
    </group>
  )
}
