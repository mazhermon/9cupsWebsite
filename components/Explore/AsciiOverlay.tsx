'use client'

// /explore/ascii-overlay — four ASCII renderers stacked into one visualiser.
//
// Architecture:
//   - 4 transparent <canvas> layers stacked in the same position
//   - Each layer = one renderer, one stem, one brand colour
//   - CSS `mix-blend-mode: screen` combines them on the GPU
//   - No WebGL anywhere
//
// Each stem feeds exactly one renderer:
//   BASS  → BLOCK   (cover image as half-blocks, primary-light)
//   DRUMS → MATRIX  (rain through "9CUPS" wordmark, accent-warm)
//   MAIN  → EDGE    (Sobel outline of portrait, primary-pale)
//   VOX   → PARTICLES (drifting glyphs, accent-vivid)

import { useMemo } from 'react'
import Link from 'next/link'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { RELEASE } from '@/lib/track-config'
import StemToggles from '@/components/StemToggles/StemToggles'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'
import OverlayPanel from './zoo/OverlayPanel'
import {
  createOverlayBlock, createOverlayMatrix,
  createOverlayEdge, createOverlayParticles,
} from './zoo/overlay-renderers'

const STEM_URLS = RELEASE.stems.map(s => s.url)
const BASS_IDX  = RELEASE.stems.findIndex(s => s.key === 'bass')
const DRUMS_IDX = RELEASE.stems.findIndex(s => s.key === 'drums')
const MAIN_IDX  = RELEASE.stems.findIndex(s => s.key === 'main')
const VOX_IDX   = RELEASE.stems.findIndex(s => s.key === 'vox')
const ONBOARDING_ORDER = [DRUMS_IDX, BASS_IDX, MAIN_IDX, VOX_IDX].filter(i => i >= 0)

const PORTRAIT = '/artist/maz-bw-wide.webp'
const COVER    = '/covers/catching-a-feeling.webp'

// Frequency bands per stem.
const BAND_BASS:  [number, number] = [1, 14]
const BAND_DRUMS: [number, number] = [2, 60]   // kick + body combined
const BAND_MAIN:  [number, number] = [8, 60]
const BAND_VOX:   [number, number] = [80, 256]

// Brand-palette colours per layer. Tuned for mix-blend-mode: lighten —
// each colour stays as itself unless a brighter pixel overlays at the
// same point. Brightened the magenta-warm so MATRIX reads on dark.
const COL_BLOCK     = '#9252B8'  // dimmer purple — base wash, won't dominate
const COL_MATRIX    = '#FF5A8F'  // bright warm pink — drums rain
const COL_EDGE      = '#E8C9F5'  // very pale lilac — line work pops
const COL_PARTICLES = '#FFCFEF'  // near-white pink — sparkles

export default function AsciiOverlay() {
  const {
    tracks, allLoaded, isPlaying, hasStarted, analysers,
    toggleMute, startPlaybackOnboarded, togglePlayback,
  } = useAudioEngine(STEM_URLS)

  const renderers = useMemo(() => ({
    block: createOverlayBlock(COVER),
    matrix: createOverlayMatrix('9CUPS'),
    edge: createOverlayEdge(PORTRAIT),
    particles: createOverlayParticles(PORTRAIT),
  }), [])

  const startPlayback = () =>
    startPlaybackOnboarded({ stepMs: 3000, order: ONBOARDING_ORDER })

  return (
    <>
      <Link href="/explore" className="ha-back" aria-label="Back to explore index">
        ← explore
      </Link>

      <main className="ao-page">
        <header className="ao-head">
          <p className="ao-eyebrow">/explore/ascii-overlay · 4 stems · 4 layers · no WebGL</p>
          <h1 className="ao-title">One visualiser, four layers.</h1>
          <p className="ao-blurb">
            Four ASCII renderers stacked with <code>mix-blend-mode: screen</code> on
            transparent canvases. Each layer is wired to exactly one stem and
            uses one brand colour. The mesh is gone.
          </p>
          <ul className="ao-legend">
            <li><b style={{ color: COL_BLOCK }}>BLOCK</b><span>bass</span><span>cover image, half-blocks</span></li>
            <li><b style={{ color: COL_MATRIX }}>MATRIX</b><span>drums</span><span>rain through 9CUPS</span></li>
            <li><b style={{ color: COL_EDGE }}>EDGE</b><span>main</span><span>portrait outlines, Sobel</span></li>
            <li><b style={{ color: COL_PARTICLES }}>PARTICLES</b><span>vox</span><span>drifting glyphs</span></li>
          </ul>
        </header>

        <div className="ao-stage">
          {/* Render order = stacking order. BLOCK at the back, PARTICLES on top. */}
          <OverlayPanel
            renderer={renderers.block}
            cols={70} rows={44}
            analyser={analysers[BASS_IDX] ?? null}
            muted={tracks[BASS_IDX]?.muted ?? false}
            playing={isPlaying}
            band={BAND_BASS}
            color={COL_BLOCK}
            className="ao-layer ao-layer-block"
          />
          <OverlayPanel
            renderer={renderers.matrix}
            cols={60} rows={28}
            analyser={analysers[DRUMS_IDX] ?? null}
            muted={tracks[DRUMS_IDX]?.muted ?? false}
            playing={isPlaying}
            band={BAND_DRUMS}
            color={COL_MATRIX}
            className="ao-layer ao-layer-matrix"
          />
          <OverlayPanel
            renderer={renderers.edge}
            cols={70} rows={44}
            analyser={analysers[MAIN_IDX] ?? null}
            muted={tracks[MAIN_IDX]?.muted ?? false}
            playing={isPlaying}
            band={BAND_MAIN}
            color={COL_EDGE}
            className="ao-layer ao-layer-edge"
          />
          <OverlayPanel
            renderer={renderers.particles}
            cols={70} rows={44}
            analyser={analysers[VOX_IDX] ?? null}
            muted={tracks[VOX_IDX]?.muted ?? false}
            playing={isPlaying}
            band={BAND_VOX}
            color={COL_PARTICLES}
            className="ao-layer ao-layer-particles"
          />
        </div>

        <footer className="ao-controls">
          {!hasStarted ? (
            <button
              type="button"
              className="ao-press-play"
              onClick={startPlayback}
              disabled={!allLoaded}
            >
              {allLoaded ? '[ PRESS PLAY ]' : '[ LOADING ]'}
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
      </main>

      {hasStarted && <PlayControl isPlaying={isPlaying} onToggle={togglePlayback} />}
      <GrainOverlay />
    </>
  )
}
