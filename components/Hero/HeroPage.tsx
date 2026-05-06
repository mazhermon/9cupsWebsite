'use client'

// Reusable hero shell: audio engine + wordmark + stem toggles + listen-on
// scaffolding. The Visualiser slot mounts as a full-viewport background; all
// other UI floats above it via z-index.

import type { ComponentType } from 'react'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import type { TrackState } from '@/hooks/useAudioEngine'
import { RELEASE } from '@/lib/track-config'
import type { Stem } from '@/lib/track-config'
import Wordmark from '@/components/Wordmark/Wordmark'
import StemToggles from '@/components/StemToggles/StemToggles'
import TrackTitle from '@/components/TrackTitle/TrackTitle'
import ListenOn from '@/components/ListenOn/ListenOn'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

const STEM_URLS = RELEASE.stems.map(s => s.url)
const DRUMS_INDEX = RELEASE.stems.findIndex(s => s.key === 'drums')

export interface VisualiserProps {
  stems: Stem[]
  trackStates: TrackState[]
  analysers: (AnalyserNode | null)[]
  playing: boolean
  onToggle: (id: number) => void
}

interface HeroPageProps {
  /** Visualiser component — mounts as the hero's full-viewport background. */
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
    startPlaybackOnboarded,
    togglePlayback,
  } = useAudioEngine(STEM_URLS)

  const drumsAnalyser = analysers[DRUMS_INDEX] ?? null
  const drumsMuted = tracks[DRUMS_INDEX]?.muted ?? false

  return (
    <>
      <a href="#stage" className="skip-link">Skip to mixer</a>

      <main className="hero" aria-label="9cups · Catching A Feeling">
        {/* Background — fills the hero, click-through */}
        <Visualiser
          stems={RELEASE.stems}
          trackStates={tracks}
          analysers={analysers}
          playing={isPlaying}
          onToggle={toggleMute}
        />

        {/* Foreground content — stacks on top of the visualiser */}
        <div className="hero-stack">
          <Wordmark
            eyebrow={`${RELEASE.artist} presents`}
            kickAnalyser={drumsAnalyser}
            kickMuted={drumsMuted}
            playing={isPlaying}
          />

          <StemToggles
            stems={RELEASE.stems}
            trackStates={tracks}
            onToggle={toggleMute}
            disabled={!allLoaded}
          />

          <div aria-live="polite" className="hero-cta">
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
                onClick={() => startPlaybackOnboarded()}
                disabled={!allLoaded}
                aria-label="Start playback"
              >
                {allLoaded ? 'Press play to enter' : 'Loading the room…'}
              </button>
            )}
          </div>

          <ListenOn platforms={RELEASE.platforms} />
        </div>
      </main>

      {hasStarted && (
        <PlayControl isPlaying={isPlaying} onToggle={togglePlayback} />
      )}

      <GrainOverlay />
    </>
  )
}
