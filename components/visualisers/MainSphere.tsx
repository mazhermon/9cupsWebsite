'use client'

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { View, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'

interface MainSphereProps {
  analyser: AnalyserNode | null
  muted: boolean
  color: string
  playing: boolean
}

export default function MainSphere(props: MainSphereProps) {
  return (
    <View className="cell-view" index={4}>
      <PerspectiveCamera makeDefault position={[0, 0, 6.4]} fov={32} near={0.1} far={100} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 2, 3]} intensity={1.1} />
      <MainSphereScene {...props} />
    </View>
  )
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMid;
  uniform float uHigh;
  varying vec3 vNormal;
  varying float vDisp;

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

  uniform float uLow;
  void main() {
    vec3 pos = position;
    float n = snoise(pos * 1.4 + vec3(uTime * 0.35));
    float n2 = snoise(pos * 3.1 + vec3(uTime * 0.85));
    float n3 = snoise(pos * 6.0 + vec3(uTime * 1.4));
    // Bigger, more dramatic displacement — was 0.18+0.45*mid, now 0.10+1.10*mid+0.55*low.
    float disp =
      n * (0.10 + uMid * 1.10 + uLow * 0.55) +
      n2 * (0.04 + uHigh * 0.55) +
      n3 * (uHigh * 0.18);
    pos += normal * disp;
    vDisp = disp;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uMid;
  varying vec3 vNormal;
  varying float vDisp;

  void main() {
    vec3 light = normalize(vec3(0.5, 0.7, 1.0));
    float lambert = clamp(dot(vNormal, light), 0.0, 1.0);
    float rim = pow(1.0 - clamp(vNormal.z, 0.0, 1.0), 2.0);
    vec3 base = uColor * (0.35 + lambert * 0.85);
    base += uColor * rim * (0.7 + uMid * 0.6);
    base += vec3(0.6, 0.4, 0.9) * vDisp * 0.4;
    gl_FragColor = vec4(base, 1.0);
  }
`

function MainSphereScene({ analyser, muted, color, playing }: MainSphereProps) {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const reducedMotion = useReducedMotion()

  // Build the ShaderMaterial imperatively so uniforms live on the THREE instance
  // (mutating instance fields is fine — only React-managed values are immutable).
  const [material] = useState(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uLow: { value: 0 },
        uMid: { value: 0 },
        uHigh: { value: 0 },
        uColor: { value: new THREE.Color(color) },
      },
    })
  })

  useEffect(() => { material.uniforms.uColor.value.set(color) }, [color, material])
  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    if (reducedMotion) return
    if (typeof document !== 'undefined' && document.hidden) return
    if (!playing) return

    let low = 0, mid = 0, high = 0
    if (analyser && !muted) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      // MAIN stem carries the full instrumental — react across the entire spectrum.
      low = bandEnergy(dataRef.current, 2, 14)     // 40-300 Hz body
      mid = bandEnergy(dataRef.current, 14, 95)    // 300-2000 Hz core
      high = bandEnergy(dataRef.current, 95, 280)  // 2-6 kHz air
    }

    /* eslint-disable react-hooks/immutability -- THREE uniforms are intentionally mutated each frame; this is the documented R3F pattern. */
    material.uniforms.uTime.value += delta * (0.55 + mid * 1.5)
    material.uniforms.uLow.value = lerpToward(material.uniforms.uLow.value, low, 0.45)
    material.uniforms.uMid.value = lerpToward(material.uniforms.uMid.value, mid, 0.50)
    material.uniforms.uHigh.value = lerpToward(material.uniforms.uHigh.value, high, 0.55)
    /* eslint-enable react-hooks/immutability */

    if (meshRef.current) {
      // Rotation speed scales with energy so the sphere "settles" between phrases.
      meshRef.current.rotation.y += delta * (0.05 + mid * 0.8 + low * 0.35)
      meshRef.current.rotation.x += delta * (0.02 + high * 0.45)
    }
  })

  return (
    <mesh ref={meshRef} material={material}>
      <icosahedronGeometry args={[1, 12]} />
    </mesh>
  )
}
