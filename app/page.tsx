'use client'

import dynamic from 'next/dynamic'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { RELEASE } from '@/lib/track-config'
import Wordmark from '@/components/Wordmark/Wordmark'
import Cell from '@/components/Stage/Cell'
import TrackTitle from '@/components/TrackTitle/TrackTitle'
import ListenOn from '@/components/ListenOn/ListenOn'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

// R3F's <Canvas> applies inline style attributes that don't match server-render output.
// Mount client-only to avoid the hydration mismatch.
const SharedCanvas = dynamic(() => import('@/components/Stage/SharedCanvas'), { ssr: false })

const STEM_URLS = RELEASE.stems.map(s => s.url)

export default function Home() {
  const { tracks, allLoaded, isPlaying, hasStarted, toggleMute, startPlayback, togglePlayback } =
    useAudioEngine(STEM_URLS)

  return (
    <>
      <a href="#stage" className="skip-link">Skip to mixer</a>

      <main className="hero" aria-label="9cups · Catching A Feeling">
        <Wordmark eyebrow={`${RELEASE.artist} presents`} />

        <section
          id="stage"
          className="stage"
          aria-label="Stem mixer. Tap a cell to mute or unmute its stem."
        >
          {RELEASE.stems.map((stem, i) => (
            <Cell
              key={stem.key}
              stemKey={stem.key}
              label={stem.label}
              color={stem.color}
              muted={tracks[i].muted}
              loaded={tracks[i].loaded}
              onToggle={() => toggleMute(i)}
            >
              {/* The visualiser <View> goes here — added per-stem in later tasks */}
            </Cell>
          ))}

          <SharedCanvas />
        </section>

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
