'use client'

import dynamic from 'next/dynamic'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { RELEASE } from '@/lib/track-config'
import Wordmark from '@/components/Wordmark/Wordmark'
import StemToggles from '@/components/StemToggles/StemToggles'
import TrackTitle from '@/components/TrackTitle/TrackTitle'
import ListenOn from '@/components/ListenOn/ListenOn'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

// All R3F (Canvas + visualisers) lives behind one dynamic-import boundary so drei's
// View tunnel singleton is shared. Splitting into multiple ssr:false imports
// duplicates the module and breaks the tunnel.
const StageR3F = dynamic(() => import('@/components/Stage/StageR3F'), { ssr: false })

const STEM_URLS = RELEASE.stems.map(s => s.url)

export default function Home() {
  const { tracks, allLoaded, isPlaying, hasStarted, analysers, toggleMute, startPlayback, togglePlayback } =
    useAudioEngine(STEM_URLS)

  return (
    <>
      <a href="#stage" className="skip-link">Skip to mixer</a>

      <main className="hero" aria-label="9cups · Catching A Feeling">
        <Wordmark eyebrow={`${RELEASE.artist} presents`} />

        <StemToggles
          stems={RELEASE.stems}
          trackStates={tracks}
          onToggle={toggleMute}
          disabled={!allLoaded}
        />

        <StageR3F
          stems={RELEASE.stems}
          trackStates={tracks}
          analysers={analysers}
          onToggle={toggleMute}
          playing={isPlaying}
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
