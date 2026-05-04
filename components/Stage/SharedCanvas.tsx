'use client'

import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
import type { ReactNode } from 'react'

interface SharedCanvasProps {
  children?: ReactNode
}

/**
 * Single shared <Canvas> overlaying the .stage. Each <View> rendered inside
 * a cell's child element maps to a screen-space viewport in this canvas.
 * Pass any post-fx etc. as children.
 */
export default function SharedCanvas({ children }: SharedCanvasProps) {
  return (
    <Canvas
      className="shared-canvas"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 35 }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
    >
      <View.Port />
      {children}
    </Canvas>
  )
}
