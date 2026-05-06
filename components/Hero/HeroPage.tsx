'use client'

// Reusable hero shell: audio engine + wordmark + stem toggles + listen-on
// scaffolding. The Visualiser slot mounts as a full-viewport background; all
// other UI floats above it via z-index.

import type { ComponentType, ReactNode } from 'react'
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

// Onboarding sequence: drums first, then layer in the rhythm section, the
// core, then the topline at 4-second intervals.
const ONBOARDING_ORDER = [
  RELEASE.stems.findIndex(s => s.key === 'drums'),
  RELEASE.stems.findIndex(s => s.key === 'bass'),
  RELEASE.stems.findIndex(s => s.key === 'main'),
  RELEASE.stems.findIndex(s => s.key === 'vox'),
].filter(i => i >= 0)
const ONBOARDING_STEP_MS = 4000

export interface VisualiserProps {
  stems: Stem[]
  trackStates: TrackState[]
  analysers: (AnalyserNode | null)[]
  playing: boolean
  onToggle: (id: number) => void
}

export interface HeroPageProps {
  /** Visualiser component — mounts as the hero's full-viewport background. */
  Visualiser: ComponentType<VisualiserProps>
  /** Optional element rendered behind the foreground content + above the
      visualiser. Useful for backdrop imagery / watermarks. */
  backdropSlot?: ReactNode
  /** Replaces the default Press Play button content. Receives the audio-engine
      bits the variant might need. */
  renderPressPlay?: (args: {
    allLoaded: boolean
    startPlayback: () => void
  }) => ReactNode
  /** Element rendered alongside TrackTitle in the CTA area after playback starts. */
  trackTitleAside?: ReactNode
  /** Optional element next to the wordmark eyebrow text (e.g. small avatar). */
  eyebrowAside?: ReactNode
  /** Optional element rendered above .hero-stack but in front of the
      visualiser — used by the kick-glitch variant for transient overlays. */
  glitchOverlay?: (args: {
    drumsAnalyser: AnalyserNode | null
    drumsMuted: boolean
    playing: boolean
  }) => ReactNode
}

export default function HeroPage({
  Visualiser,
  backdropSlot,
  renderPressPlay,
  trackTitleAside,
  eyebrowAside,
  glitchOverlay,
}: HeroPageProps) {
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

  const startPlayback = () =>
    startPlaybackOnboarded({ stepMs: ONBOARDING_STEP_MS, order: ONBOARDING_ORDER })

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

        {backdropSlot}
        {glitchOverlay?.({ drumsAnalyser, drumsMuted, playing: isPlaying })}

        {/* Foreground content — stacks on top of the visualiser */}
        <div className="hero-stack">
          <div className="hero-eyebrow-row">
            {eyebrowAside}
            <Wordmark
              eyebrow={`${RELEASE.artist} presents`}
              kickAnalyser={drumsAnalyser}
              kickMuted={drumsMuted}
              playing={isPlaying}
            />
          </div>

          <StemToggles
            stems={RELEASE.stems}
            trackStates={tracks}
            onToggle={toggleMute}
            disabled={!allLoaded}
          />

          <div aria-live="polite" className="hero-cta">
            {hasStarted ? (
              <div className="track-title-row">
                {trackTitleAside}
                <TrackTitle
                  title={RELEASE.title}
                  artist={RELEASE.artist}
                  year={RELEASE.year}
                />
              </div>
            ) : (
              renderPressPlay
                ? renderPressPlay({ allLoaded, startPlayback })
                : (
                  <button
                    type="button"
                    className="cta-press-play"
                    onClick={startPlayback}
                    disabled={!allLoaded}
                    aria-label="Start playback"
                  >
                    {allLoaded ? 'Press play to enter' : 'Loading the room…'}
                  </button>
                )
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
