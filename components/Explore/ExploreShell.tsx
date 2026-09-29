'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { useAudioEngine, type TrackState } from '@/hooks/useAudioEngine'
import { RELEASE } from '@/lib/track-config'
import StemToggles from '@/components/StemToggles/StemToggles'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

const STEM_URLS = RELEASE.stems.map(s => s.url)
const ORDER = [
  RELEASE.stems.findIndex(s => s.key === 'drums'),
  RELEASE.stems.findIndex(s => s.key === 'bass'),
  RELEASE.stems.findIndex(s => s.key === 'main'),
  RELEASE.stems.findIndex(s => s.key === 'vox'),
].filter(i => i >= 0)

export interface StageContext {
  analysers: (AnalyserNode | null)[]
  tracks: TrackState[]
  playing: boolean
}

interface ExploreShellProps {
  slug: string
  title: string
  blurb: string
  tags: string[]
  children: (ctx: StageContext) => ReactNode
}

export default function ExploreShell({ slug, title, blurb, tags, children }: ExploreShellProps) {
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

  return (
    <main className={`ex-stage ex-stage-${slug}`} aria-label={title}>
      <header className="ex-stage-head">
        <Link href="/explore" className="ex-stage-back" aria-label="Back to explore index">
          <span aria-hidden>←</span> explore
        </Link>
        <div className="ex-stage-meta">
          <h1 className="ex-stage-title">{title}</h1>
          <ul className="ex-stage-tags" aria-hidden>
            {tags.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>
        <p className="ex-stage-blurb">{blurb}</p>
      </header>

      <section className="ex-stage-canvas" id="stage">
        {children({ analysers, tracks, playing: isPlaying })}
      </section>

      <footer className="ex-stage-controls">
        {!hasStarted ? (
          <button
            type="button"
            className="ex-press-play"
            onClick={() => startPlaybackOnboarded({ stepMs: 2500, order: ORDER })}
            disabled={!allLoaded}
          >
            {allLoaded ? 'Press play' : 'Loading the room…'}
          </button>
        ) : (
          <StemToggles
            stems={RELEASE.stems}
            trackStates={tracks}
            onToggle={toggleMute}
            disabled={!allLoaded}
          />
        )}
      </footer>

      {hasStarted && <PlayControl isPlaying={isPlaying} onToggle={togglePlayback} />}
      <GrainOverlay />
    </main>
  )
}
