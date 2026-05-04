'use client'

import { useAudioEngine } from '@/hooks/useAudioEngine'
import { RELEASE } from '@/lib/track-config'
import Wordmark from '@/components/Wordmark/Wordmark'
import Cell from '@/components/Stage/Cell'
import TrackTitle from '@/components/TrackTitle/TrackTitle'
import ListenOn from '@/components/ListenOn/ListenOn'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

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
              {/* Placeholder content — replaced by R3F <View> in later tasks */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: '20%',
                  background: stem.color,
                  opacity: 0.12,
                  borderRadius: '50%',
                }}
              />
            </Cell>
          ))}
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
