'use client'

// Single client-only entry point for everything WebGL — the Canvas, the View.Port,
// and every per-stem visualiser. Importing all R3F modules from this one chunk
// guarantees drei's tunnel singleton is shared between the Views and the Port.
// (Splitting them into separate dynamic imports duplicates the module and breaks
// the tunnel.)

import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
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

export default function StageR3F({ stems, trackStates, analysers, onToggle, playing }: StageR3FProps) {
  return (
    <section
      id="stage"
      className="stage"
      aria-label="Stem mixer. Tap a cell to mute or unmute its stem."
    >
      {stems.map((stem, i) => {
        const analyser = analysers[i]
        const muted = trackStates[i].muted
        const common = { analyser, muted, color: stem.color, playing }
        return (
          <Cell
            key={stem.key}
            stemKey={stem.key}
            label={stem.label}
            color={stem.color}
            muted={muted}
            loaded={trackStates[i].loaded}
            onToggle={() => onToggle(i)}
          >
            {stem.key === 'bass' && <BassTerrain {...common} />}
            {stem.key === 'main' && <MainSphere {...common} />}
            {stem.key === 'drums' && <DrumsKick {...common} />}
            {stem.key === 'vox' && <VoxParticles {...common} />}
          </Cell>
        )
      })}

      <div className="shared-canvas" style={{ pointerEvents: 'none' }} aria-hidden="true">
        <Canvas
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          frameloop="always"
          style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
          eventSource={typeof document !== 'undefined' ? (document.body as HTMLElement) : undefined}
        >
          <View.Port />
        </Canvas>
      </div>
    </section>
  )
}
