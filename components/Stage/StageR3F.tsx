'use client'

// Single Canvas, single camera, all four visualisers as positioned meshes in
// shared world space. One render pass per frame instead of four scissor passes
// through drei's <View> tunnel.
//
// Layout: HTML cells sit on top of the canvas as click targets. Their CSS-grid
// positions roughly mirror the world-space positions of the meshes below, so
// clicking the bottom strip mutes BASS, etc.

import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import type { Stem } from '@/lib/track-config'
import type { TrackState } from '@/hooks/useAudioEngine'
import Cell from '@/components/Stage/Cell'
import BassTerrain from '@/components/visualisers/BassTerrain'
import MainSphere from '@/components/visualisers/MainSphere'
import DrumsKick from '@/components/visualisers/DrumsKick'
import VoxParticles from '@/components/visualisers/VoxParticles'

interface StageR3FProps {
  stems: Stem[]
  trackStates: TrackState[]
  analysers: (AnalyserNode | null)[]
  onToggle: (id: number) => void
  playing: boolean
}

// World-space placement for each visualiser, tuned for the camera below.
// Tweak these together — they assume the camera is at [0, 1.4, 5.2] looking at
// [0, 0, 0] with fov 48.
const POSITIONS = {
  drums: [-2.0, 0.7, 0] as [number, number, number],
  main:  [+2.0, 0.7, 0] as [number, number, number],
  vox:   [0, -0.45, 0] as [number, number, number],
  bass:  [0, -1.5, 0] as [number, number, number],
}

const SCALES = {
  drums: 0.9,
  main: 1.05,
  vox: 1.0,
  bass: 1.0,
}

export default function StageR3F({ stems, trackStates, analysers, onToggle, playing }: StageR3FProps) {
  // Map each stem to its analyser/muted state by key for clarity below.
  const byKey = Object.fromEntries(
    stems.map((stem, i) => [stem.key, { analyser: analysers[i], muted: trackStates[i].muted, color: stem.color }]),
  )

  return (
    <section
      id="stage"
      className="stage"
      aria-label="Stem mixer. Tap a cell to mute or unmute its stem."
    >
      {stems.map((stem, i) => (
        <Cell
          key={stem.key}
          stemKey={stem.key}
          label={stem.label}
          color={stem.color}
          muted={trackStates[i].muted}
          loaded={trackStates[i].loaded}
          onToggle={() => onToggle(i)}
        />
      ))}

      <div className="shared-canvas" aria-hidden="true">
        <Canvas
          dpr={1}
          gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
          frameloop="always"
          style={{ width: '100%', height: '100%' }}
        >
          <PerspectiveCamera makeDefault position={[0, 1.4, 5.2]} fov={48} near={0.1} far={50} />

          {byKey.bass && (
            <BassTerrain
              {...byKey.bass}
              playing={playing}
              position={POSITIONS.bass}
              scale={SCALES.bass}
            />
          )}
          {byKey.vox && (
            <VoxParticles
              {...byKey.vox}
              playing={playing}
              position={POSITIONS.vox}
              scale={SCALES.vox}
            />
          )}
          {byKey.drums && (
            <DrumsKick
              {...byKey.drums}
              playing={playing}
              position={POSITIONS.drums}
              scale={SCALES.drums}
            />
          )}
          {byKey.main && (
            <MainSphere
              {...byKey.main}
              playing={playing}
              position={POSITIONS.main}
              scale={SCALES.main}
            />
          )}
        </Canvas>
      </div>
    </section>
  )
}
