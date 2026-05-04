'use client'

// Reusable hero shell: audio engine + wordmark + stem toggles + listen-on
// scaffolding. Each visualiser variant ( /vis-a, /vis-b, /vis-c ) renders the
// same surrounding UI; only the Visualiser slot differs.

import type { ComponentType } from 'react'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import type { TrackState } from '@/hooks/useAudioEngine'
import { RELEASE } from '@/lib/track-config'
import type { Stem } from '@/lib/track-config'
import Wordmark from '@/components/Wordmark/Wordmark'
import StemShapes from '@/components/StemShapes/StemShapes'
import TrackTitle from '@/components/TrackTitle/TrackTitle'
import ListenOn from '@/components/ListenOn/ListenOn'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

const STEM_URLS = RELEASE.stems.map(s => s.url)

export interface VisualiserProps {
  stems: Stem[]
  trackStates: TrackState[]
  analysers: (AnalyserNode | null)[]
  playing: boolean
  onToggle: (id: number) => void
}

interface HeroPageProps {
  /** Visualiser component to render in the stage area. */
  Visualiser: ComponentType<VisualiserProps>
}

export default function HeroPage({ Visualiser }: HeroPageProps) {
  const {
    tracks,
    allLoaded,
    isPlaying,
    hasStarted,
    analysers,
    toggleMute,
    startPlayback,
    togglePlayback,
  } = useAudioEngine(STEM_URLS)

  return (
    <>
      <a href="#stage" className="skip-link">Skip to mixer</a>

      <main className="hero" aria-label="9cups · Catching A Feeling">
        <Wordmark eyebrow={`${RELEASE.artist} presents`} />

        <StemShapes
          stems={RELEASE.stems}
          trackStates={tracks}
          analysers={analysers}
          playing={isPlaying}
          onToggle={toggleMute}
          disabled={!allLoaded}
        />

        <Visualiser
          stems={RELEASE.stems}
          trackStates={tracks}
          analysers={analysers}
          playing={isPlaying}
          onToggle={toggleMute}
        />

        <div aria-live="polite">
          {hasStarted ? (
            <TrackTitle
              title={RELEASE.title}
              artist={RELEASE.artist}
              year={RELEASE.year}
            />
          ) : (
            <button
              type="button"
              className="cta-press-play"
              onClick={startPlayback}
              disabled={!allLoaded}
              aria-label="Start playback"
            >
              {allLoaded ? 'Press play to enter' : 'Loading the room…'}
            </button>
          )}
        </div>

        <ListenOn platforms={RELEASE.platforms} />
      </main>

      {hasStarted && (
        <PlayControl isPlaying={isPlaying} onToggle={togglePlayback} />
      )}

      <GrainOverlay />
    </>
  )
}
