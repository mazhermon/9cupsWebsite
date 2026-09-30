'use client'

// Shared editorial-split hero. Used by /img-c, /img-c2, /img-c3 — each
// variant differs only by the image fed to the left column (and an optional
// CSS filter for colourisation).

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import type { TrackState } from '@/hooks/useAudioEngine'
import { RELEASE, LISTEN_LINKS } from '@/lib/track-config'
import type { Stem } from '@/lib/track-config'
import Wordmark from '@/components/Wordmark/Wordmark'
import StemToggles from '@/components/StemToggles/StemToggles'
import TrackTitle from '@/components/TrackTitle/TrackTitle'
import ListenOn from '@/components/ListenOn/ListenOn'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'
import InlineCover from '@/components/ImageDemo/InlineCover'
import BackgroundVideo from '@/components/hero-video/BackgroundVideo'

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
  /** Looping video for the portrait column, e.g. "haze". When set it replaces
   *  the still image entirely — any overlaySlot still renders on top, so the
   *  album-cover blend survives the swap. No CSS filter is applied: the colour
   *  grading is baked into the files and filtering a playing video is the one
   *  thing the hero-video package asks callers not to do. */
  videoName?: string
  /** Ignored when videoName is set. */
  imageSrc: string
  imageAlt: string
  /** CSS object-position for the image inside its column. */
  imageObjectPosition?: string
  /** Optional CSS filter string applied to the image (e.g. `url(#duotone)`). */
  imageFilter?: string
  /** Optional SVG filter definitions to embed once at page load. */
  svgFilters?: ReactNode

  // ── Optional second image overlaid on the first via mix-blend-mode.
  // When set, a second <Image> is layered on top of the primary, blended
  // using the supplied mode at the supplied opacity.
  overlayImageSrc?: string
  overlayBlendMode?: 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light' | 'color' | 'hue' | 'lighten' | 'darken'
  overlayOpacity?: number
  overlayObjectPosition?: string
  overlayFilter?: string

  /** Custom overlay render-prop. Receives audio + stem context so the slot
      can drive blend animations from the analyser data. Mounts inside the
      same .editorial-portrait box as the static overlay; both render if
      both are supplied (custom on top). */
  overlaySlot?: (ctx: {
    analysers: (AnalyserNode | null)[]
    trackStates: TrackState[]
    stems: Stem[]
    playing: boolean
  }) => ReactNode
}

export default function EditorialHero({
  videoName,
  imageSrc,
  imageAlt,
  imageObjectPosition = 'center 35%',
  imageFilter,
  svgFilters,
  overlayImageSrc,
  overlayBlendMode = 'overlay',
  overlayOpacity = 0.7,
  overlayObjectPosition = 'center center',
  overlayFilter,
  overlaySlot,
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
        <div className={`editorial-portrait${videoName ? ' editorial-portrait--video' : ''}`}>
          {videoName ? (
            <BackgroundVideo name={videoName} pauseLabel="background" />
          ) : (
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
          )}
          {overlayImageSrc && (
            <Image
              src={overlayImageSrc}
              alt=""
              fill
              sizes="50vw"
              aria-hidden="true"
              className="editorial-portrait-img editorial-portrait-overlay"
              style={{
                objectPosition: overlayObjectPosition,
                mixBlendMode: overlayBlendMode,
                opacity: overlayOpacity,
                ...(overlayFilter ? { filter: overlayFilter } : {}),
              }}
            />
          )}
          {overlaySlot?.({
            analysers,
            trackStates: tracks,
            stems: RELEASE.stems,
            playing: isPlaying,
          })}
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

            <ListenOn platforms={LISTEN_LINKS} />
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
