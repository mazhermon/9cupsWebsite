'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { View, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

interface BassTerrainProps {
  analyser: AnalyserNode | null
  muted: boolean
  color: string
  playing: boolean
}

const SPARK_COUNT = 140
const PLANE_WIDTH = 9
const PLANE_DEPTH = 5
const PLANE_SEG_W = 60
const PLANE_SEG_D = 32
const GROUND_Y = -0.55

export default function BassTerrain(props: BassTerrainProps) {
  return (
    <View className="cell-view" index={1}>
      <PerspectiveCamera makeDefault position={[0, 0.95, 1.65]} fov={52} near={0.1} far={30} />
      <CameraLookAt target={[0, -0.4, -1.0]} />
      <BassTerrainScene {...props} />
    </View>
  )
}

function CameraLookAt({ target }: { target: [number, number, number] }) {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    camera.lookAt(target[0], target[1], target[2])
    camera.updateProjectionMatrix()
  }, [camera, target])
  return null
}

const terrainVertex = /* glsl */ `
  uniform float uTime;
  uniform float uLow;        // 0..1 sub/low bass smoothed
  uniform float uHigh;       // 0..1 high-frequency FX smoothed
  uniform float uPulse;      // 0..1 transient flash, decays
  uniform float uShockZ;     // current local-Y position of travelling shockwave
  varying float vHeight;
  varying vec2 vUv;

  // Compact 3D simplex noise (Ashima/Stefan Gustavson, public domain).
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
    // Plane geometry sits in local XY before being rotated to lie flat.
    // Local +Y becomes world -Z (depth into the scene); local +Z (normal) becomes world +Y (up).
    vec3 pos = position;
    vUv = uv;

    // Base scrolling heightmap — gentle dunes/water.
    float n1 = snoise(vec3(pos.x * 0.55, 0.0, pos.y * 0.55 + uTime * 0.45)) * 0.18;
    float n2 = snoise(vec3(pos.x * 1.6,  0.0, pos.y * 1.6  + uTime * 0.85)) * 0.07;
    float baseHeight = (n1 + n2) * (0.45 + uLow * 1.6);

    // High-frequency texture — fine jitter that grows with FX content.
    float jitter = snoise(vec3(pos.x * 5.0, uTime * 1.4, pos.y * 5.0)) * uHigh * 0.18;

    // Bass-driven dome bulge centred on origin.
    float dist2 = pos.x * pos.x + pos.y * pos.y;
    float bump = exp(-dist2 * 0.55) * (uLow * 0.55 + uPulse * 0.55);

    // Travelling shockwave front (Gaussian along plane-local Y, which becomes depth).
    float shock = exp(-pow(pos.y - uShockZ, 2.0) * 4.5) * uPulse * 0.6;

    float h = baseHeight + jitter + shock + bump;
    pos.z += h;  // displace along plane normal (becomes world +Y up after the rotation)

    vHeight = h;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const terrainFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uLow;
  uniform float uPulse;
  varying float vHeight;
  varying vec2 vUv;

  void main() {
    // Brightness scales with peak amplitude.
    float intensity = 0.32 + abs(vHeight) * 4.8 + uLow * 0.32 + uPulse * 0.45;
    // Heat shift on the brightest peaks and on transient flashes.
    vec3 hot = vec3(1.0, 0.55, 0.95);
    vec3 col = mix(uColor, hot, clamp(uPulse * 0.85 + abs(vHeight) * 1.4, 0.0, 1.0));
    // Atmospheric fade — back of plane (uv.y ≈ 1 in local geometry) fades into nothing.
    float depthFade = smoothstep(1.0, 0.55, vUv.y) * smoothstep(0.0, 0.10, vUv.y);
    gl_FragColor = vec4(col * intensity, 0.85 * depthFade);
  }
`

const sparkVertex = /* glsl */ `
  attribute vec3 aVelocity;
  attribute float aBirth;
  attribute float aLifetime;
  uniform float uTime;
  varying float vAge;
  void main() {
    float dt = uTime - aBirth;
    float age = dt / max(aLifetime, 0.001);
    vAge = clamp(age, 0.0, 1.0);
    vec3 pos = position + aVelocity * dt;
    // Cheap gravity — sparks slow + curve back down.
    pos.y -= 1.6 * dt * dt;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    float fade = aLifetime > 0.0 ? (1.0 - vAge) : 0.0;
    gl_PointSize = (3.5 + 9.0 * fade) * fade;
  }
`

const sparkFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vAge;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float r = length(c);
    if (r > 0.5) discard;
    float core = smoothstep(0.18, 0.0, r);
    float halo = smoothstep(0.5, 0.18, r);
    float fade = 1.0 - vAge;
    vec3 col = uColor + vec3(0.5, 0.25, 0.55) * core;
    gl_FragColor = vec4(col, (halo * 0.55 + core * 0.9) * fade);
  }
`

function BassTerrainScene({ analyser, muted, color, playing }: BassTerrainProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const reducedMotion = useReducedMotion()
  const detector = useState(() => new TransientDetector({ threshold: 1.32, cooldownFrames: 6, windowSize: 8 }))[0]
  const frameIdx = useRef(0)
  const timeRef = useRef(0)
  const shockZRef = useRef(-PLANE_DEPTH * 0.5)
  const shockActiveRef = useRef(false)
  const sparkAccum = useRef(0)
  const nextSparkIdx = useRef(0)

  const [terrainMaterial] = useState(() => new THREE.ShaderMaterial({
    vertexShader: terrainVertex,
    fragmentShader: terrainFragment,
    transparent: true,
    depthWrite: false,
    wireframe: true,
    uniforms: {
      uTime: { value: 0 },
      uLow: { value: 0 },
      uHigh: { value: 0 },
      uPulse: { value: 0 },
      uShockZ: { value: -PLANE_DEPTH * 0.5 },
      uColor: { value: new THREE.Color(color) },
    },
  }))

  const [sparkGeom] = useState(() => {
    const positions = new Float32Array(SPARK_COUNT * 3)
    const velocities = new Float32Array(SPARK_COUNT * 3)
    const births = new Float32Array(SPARK_COUNT)
    const lifetimes = new Float32Array(SPARK_COUNT)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aVelocity', new THREE.BufferAttribute(velocities, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aBirth', new THREE.BufferAttribute(births, 1).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('aLifetime', new THREE.BufferAttribute(lifetimes, 1).setUsage(THREE.DynamicDrawUsage))
    return g
  })

  const [sparkMaterial] = useState(() => new THREE.ShaderMaterial({
    vertexShader: sparkVertex,
    fragmentShader: sparkFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(color) },
    },
  }))

  useEffect(() => {
    /* eslint-disable react-hooks/immutability -- THREE uniform mutation. */
    terrainMaterial.uniforms.uColor.value.set(color)
    sparkMaterial.uniforms.uColor.value.set(color)
    /* eslint-enable react-hooks/immutability */
  }, [color, terrainMaterial, sparkMaterial])
  useEffect(() => () => {
    terrainMaterial.dispose()
    sparkMaterial.dispose()
    sparkGeom.dispose()
  }, [terrainMaterial, sparkMaterial, sparkGeom])

  useFrame((_, delta) => {
    if (reducedMotion) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (!playing) return

    timeRef.current += delta

    let low = 0, high = 0
    let kicked = false
    if (analyser && !muted) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      // Sub/low bass: 21–300 Hz (bins 1–14)
      low = bandEnergy(dataRef.current, 1, 14)
      // FX/air: 1.7–8 kHz (bins 80–370) — captures synthesised hits + texture
      high = bandEnergy(dataRef.current, 80, 280)
      kicked = detector.push(low, frameIdx.current)
    }
    frameIdx.current++

    /* eslint-disable react-hooks/immutability -- THREE uniform mutation. */
    const u = terrainMaterial.uniforms
    u.uTime.value = timeRef.current
    u.uLow.value = lerpToward(u.uLow.value, low, 0.50)
    u.uHigh.value = lerpToward(u.uHigh.value, high, 0.50)

    if (kicked) {
      shockZRef.current = -PLANE_DEPTH * 0.5
      shockActiveRef.current = true
      u.uPulse.value = 1
    }
    u.uPulse.value = lerpToward(u.uPulse.value, 0, 0.07)

    if (shockActiveRef.current) {
      shockZRef.current += delta * 3.6
      if (shockZRef.current > PLANE_DEPTH * 0.5) shockActiveRef.current = false
    }
    u.uShockZ.value = shockZRef.current

    sparkMaterial.uniforms.uTime.value = timeRef.current
    /* eslint-enable react-hooks/immutability */

    // Emit sparks roughly proportional to high-frequency energy.
    sparkAccum.current += high * delta * 22
    if (kicked) sparkAccum.current += 4
    const toEmit = Math.floor(sparkAccum.current)
    if (toEmit > 0) {
      sparkAccum.current -= toEmit
      /* eslint-disable react-hooks/immutability -- BufferAttribute arrays are mutable scratch. */
      const positions = sparkGeom.attributes.position.array as Float32Array
      const velocities = sparkGeom.attributes.aVelocity.array as Float32Array
      const births = sparkGeom.attributes.aBirth.array as Float32Array
      const lifetimes = sparkGeom.attributes.aLifetime.array as Float32Array
      const burstSize = Math.min(toEmit, 14)
      for (let i = 0; i < burstSize; i++) {
        const idx = nextSparkIdx.current
        nextSparkIdx.current = (nextSparkIdx.current + 1) % SPARK_COUNT
        const wx = (Math.random() - 0.5) * PLANE_WIDTH * 0.85
        const wz = (Math.random() - 0.5) * PLANE_DEPTH * 0.85
        positions[idx * 3] = wx
        positions[idx * 3 + 1] = GROUND_Y + 0.05
        positions[idx * 3 + 2] = wz
        const upBoost = 0.85 + Math.random() * 0.7 + high * 1.4 + (kicked ? 0.6 : 0)
        velocities[idx * 3] = (Math.random() - 0.5) * 0.6
        velocities[idx * 3 + 1] = upBoost
        velocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.45
        births[idx] = timeRef.current
        lifetimes[idx] = 0.95 + Math.random() * 0.65
      }
      sparkGeom.attributes.position.needsUpdate = true
      sparkGeom.attributes.aVelocity.needsUpdate = true
      sparkGeom.attributes.aBirth.needsUpdate = true
      sparkGeom.attributes.aLifetime.needsUpdate = true
      /* eslint-enable react-hooks/immutability */
    }
  })

  return (
    <group ref={groupRef}>
      <mesh
        material={terrainMaterial}
        rotation={[-Math.PI / 2 + 0.04, 0, 0]}
        position={[0, GROUND_Y, 0]}
      >
        <planeGeometry args={[PLANE_WIDTH, PLANE_DEPTH, PLANE_SEG_W, PLANE_SEG_D]} />
      </mesh>
      <points material={sparkMaterial}>
        <primitive attach="geometry" object={sparkGeom} />
      </points>
    </group>
  )
}
