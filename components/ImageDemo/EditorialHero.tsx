'use client'

// Shared editorial-split hero. Used by /img-c, /img-c2, /img-c3 — each
// variant differs only by the image fed to the left column (and an optional
// CSS filter for colourisation).

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { RELEASE } from '@/lib/track-config'
import Wordmark from '@/components/Wordmark/Wordmark'
import StemToggles from '@/components/StemToggles/StemToggles'
import TrackTitle from '@/components/TrackTitle/TrackTitle'
import ListenOn from '@/components/ListenOn/ListenOn'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'
import InlineCover from '@/components/ImageDemo/InlineCover'

const Terrain = dynamic(() => import('@/components/Terrain/Terrain'), { ssr: false })

const STEM_URLS = RELEASE.stems.map(s => s.url)
const DRUMS_INDEX = RELEASE.stems.findIndex(s => s.key === 'drums')
const ONBOARDING_ORDER = [
  RELEASE.stems.findIndex(s => s.key === 'drums'),
  RELEASE.stems.findIndex(s => s.key === 'bass'),
  RELEASE.stems.findIndex(s => s.key === 'main'),
  RELEASE.stems.findIndex(s => s.key === 'vox'),
].filter(i => i >= 0)
const ONBOARDING_STEP_MS = 4000

export interface EditorialHeroProps {
  imageSrc: string
  imageAlt: string
  /** CSS object-position for the image inside its column. */
  imageObjectPosition?: string
  /** Optional CSS filter string applied to the image (e.g. `url(#duotone)`). */
  imageFilter?: string
  /** Optional SVG filter definitions to embed once at page load. */
  svgFilters?: ReactNode
}

export default function EditorialHero({
  imageSrc,
  imageAlt,
  imageObjectPosition = 'center 35%',
  imageFilter,
  svgFilters,
}: EditorialHeroProps) {
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

      {svgFilters}

      <main className="hero hero--editorial" aria-label="9cups · Catching A Feeling">
        <div className="editorial-portrait">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            sizes="50vw"
            className="editorial-portrait-img"
            style={{
              objectPosition: imageObjectPosition,
              ...(imageFilter ? { filter: imageFilter } : {}),
            }}
            priority
          />
        </div>

        <div className="editorial-right">
          <Terrain
            stems={RELEASE.stems}
            trackStates={tracks}
            analysers={analysers}
            playing={isPlaying}
            onToggle={toggleMute}
          />

          <div className="hero-stack hero-stack--editorial">
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
                <div className="track-title-row">
                  <InlineCover size={88} />
                  <TrackTitle
                    title={RELEASE.title}
                    artist={RELEASE.artist}
                    year={RELEASE.year}
                  />
                </div>
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
          </div>
        </div>
      </main>

      {hasStarted && (
        <PlayControl isPlaying={isPlaying} onToggle={togglePlayback} />
      )}

      <GrainOverlay />
    </>
  )
}
