'use client'

// /explore/home-ascii — iteration 2.
//
//   LEFT panel:
//     - ASCII portrait of maz-bw-wide, animated (idle shimmer + audio)
//     - Cover overlay tints + reveals on hover
//
//   RIGHT panel (top half):
//     - Wordmark / stems / CTA / listen-on
//
//   BOTTOM 50vh — full viewport width, overlaying the bottom of BOTH cols:
//     - Terrain (wireframe, bass+drums only)
//     - Glyph strip layered ON TOP of the terrain (main+vox, no tags)
//   Both react to audio; together they fill the lower visualiser zone.

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { RELEASE, LISTEN_LINKS } from '@/lib/track-config'
import { bandEnergy, lerpToward } from '@/lib/audio-reactive'
import Wordmark from '@/components/Wordmark/Wordmark'
import StemToggles from '@/components/StemToggles/StemToggles'
import TrackTitle from '@/components/TrackTitle/TrackTitle'
import ListenOn from '@/components/ListenOn/ListenOn'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'
import InlineCover from '@/components/ImageDemo/InlineCover'
import GlyphFace from './GlyphFace'
import GlyphStrip from './GlyphStrip'

const Terrain = dynamic(() => import('@/components/Terrain/Terrain'), { ssr: false })

const STEM_URLS = RELEASE.stems.map(s => s.url)
const BASS_IDX  = RELEASE.stems.findIndex(s => s.key === 'bass')
const DRUMS_IDX = RELEASE.stems.findIndex(s => s.key === 'drums')
const MAIN_IDX  = RELEASE.stems.findIndex(s => s.key === 'main')
const VOX_IDX   = RELEASE.stems.findIndex(s => s.key === 'vox')
const ONBOARDING_ORDER = [DRUMS_IDX, BASS_IDX, MAIN_IDX, VOX_IDX].filter(i => i >= 0)
const ONBOARDING_STEP_MS = 4000

// Source image for the ASCII face. Pick a grid shape that matches the
// source's aspect ratio:
//   portrait source (taller than wide)  → tall grid, e.g. cols 56 × rows 72
//   landscape source (wider than tall)  → wide grid, e.g. cols 100 × rows 50
// cropAnchorX/Y let you bias the centre-crop if the subject isn't centred.
const FACE_SRC = '/artist/9cups-fam.jpg'
const FACE_CROP_ANCHOR_X = 0.5
const FACE_CROP_ANCHOR_Y = 0.5
const FACE_COLS = 100
const FACE_ROWS = 50
const FACE_CONTRAST = 1.8  // bright outdoor shot — boost to separate subjects from sky

// Drive a transform-only kick pulse on the .ha-left wrapper. transform on
// a wrapper element is GPU-composited — the cached <pre> layer beneath it
// is NOT re-rasterised. Total per-frame cost: 1 analyser read + 1 CSS-var
// write. Visually: subtle 2% scale punch on each kick, plus a tiny X-axis
// sway from bass.
function useFaceMotion(
  ref: React.RefObject<HTMLElement | null>,
  drumsAnalyser: AnalyserNode | null,
  bassAnalyser: AnalyserNode | null,
  drumsMuted: boolean,
  bassMuted: boolean,
  playing: boolean,
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const bufs: { drums: Uint8Array | null; bass: Uint8Array | null } = { drums: null, bass: null }
    const s = { kick: 0, bass: 0 }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      let kickE = 0, bassE = 0

      if (playing) {
        if (drumsAnalyser && !drumsMuted) {
          let buf = bufs.drums
          if (!buf || buf.length !== drumsAnalyser.frequencyBinCount) {
            buf = new Uint8Array(drumsAnalyser.frequencyBinCount); bufs.drums = buf
          }
          drumsAnalyser.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
          kickE = bandEnergy(buf, 2, 8)
        }
        if (bassAnalyser && !bassMuted) {
          let buf = bufs.bass
          if (!buf || buf.length !== bassAnalyser.frequencyBinCount) {
            buf = new Uint8Array(bassAnalyser.frequencyBinCount); bufs.bass = buf
          }
          bassAnalyser.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
          bassE = bandEnergy(buf, 1, 8)
        }
      }

      if (kickE > s.kick) s.kick = kickE
      s.kick = lerpToward(s.kick, 0, 0.18)
      s.bass = lerpToward(s.bass, bassE, 0.10)

      el.style.setProperty('--face-scale', (1 + s.kick * 0.022).toFixed(4))
      el.style.setProperty('--face-shift', (s.bass * 6 - 3).toFixed(2) + 'px')
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ref, drumsAnalyser, bassAnalyser, drumsMuted, bassMuted, playing])
}

export default function HomeAscii() {
  const {
    tracks, allLoaded, isPlaying, hasStarted, analysers,
    toggleMute, startPlaybackOnboarded, togglePlayback,
  } = useAudioEngine(STEM_URLS)

  const drumsAnalyser = analysers[DRUMS_IDX] ?? null
  const drumsMuted    = tracks[DRUMS_IDX]?.muted ?? false
  const mainAnalyser  = analysers[MAIN_IDX]  ?? null
  const voxAnalyser   = analysers[VOX_IDX]   ?? null
  const mainMuted     = tracks[MAIN_IDX]?.muted ?? false
  const voxMuted      = tracks[VOX_IDX]?.muted  ?? false

  const startPlayback = () =>
    startPlaybackOnboarded({ stepMs: ONBOARDING_STEP_MS, order: ONBOARDING_ORDER })

  const leftRef = useRef<HTMLElement>(null)
  const bassAnalyser = analysers[BASS_IDX] ?? null
  const bassMuted    = tracks[BASS_IDX]?.muted ?? false
  useFaceMotion(leftRef, drumsAnalyser, bassAnalyser, drumsMuted, bassMuted, isPlaying)

  return (
    <>
      <Link href="/explore" className="ha-back" aria-label="Back to explore index">
        ← explore
      </Link>

      <main className="ha-page" aria-label="9cups · Catching A Feeling (ASCII home variant)">
        <section className="ha-left" ref={leftRef}>
          <GlyphFace
            src={FACE_SRC}
            cropAnchorX={FACE_CROP_ANCHOR_X}
            cropAnchorY={FACE_CROP_ANCHOR_Y}
            cols={FACE_COLS}
            rows={FACE_ROWS}
            contrast={FACE_CONTRAST}
            analysers={analysers}
            tracks={tracks}
            playing={isPlaying}
            voxIdx={VOX_IDX}
            drumsIdx={DRUMS_IDX}
          />
          <div className="ha-cover" aria-hidden="true">
            <Image
              src="/covers/catching-a-feeling.webp"
              alt=""
              fill
              sizes="50vw"
              className="ha-cover-img"
              priority
            />
          </div>
        </section>

        <section className="ha-right">
          <div className="ha-hero">
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

            <div aria-live="polite" className="ha-cta">
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
        </section>

        {/* Full-viewport-width visualiser zone — terrain + strip overlaid in
            the same bottom 50vh, spanning both columns. */}
        <div className="ha-vis" id="stage" aria-hidden="true">
          <Terrain
            stems={RELEASE.stems}
            trackStates={tracks}
            analysers={analysers}
            playing={isPlaying}
            onToggle={toggleMute}
            activeKeys={['bass', 'drums']}
            segments={{ w: 90, d: 45 }}
            dpr={0.75}
          />
          <GlyphStrip
            mainAnalyser={mainAnalyser}
            voxAnalyser={voxAnalyser}
            mainMuted={mainMuted}
            voxMuted={voxMuted}
            playing={isPlaying}
          />
        </div>
      </main>

      {hasStarted && (
        <PlayControl isPlaying={isPlaying} onToggle={togglePlayback} />
      )}

      <GrainOverlay />
    </>
  )
}
