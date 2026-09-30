'use client'

// /explore/ascii-zoo — 8 ASCII-art variations as audio visualisers.
//
// No WebGL anywhere. One shared audio engine, 8 canvas panels each running
// a different renderer. Goal: decide whether dropping the 3D mesh in favour
// of multiple ASCII surfaces is the right direction for the live home.

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { RELEASE } from '@/lib/track-config'
import StemToggles from '@/components/StemToggles/StemToggles'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'
import AsciiPanel from './zoo/AsciiPanel'
import {
  createClassic, createBlock, createEdge,
  createHalftone, createParticles, createMatrix,
} from './zoo/renderers'

const STEM_URLS = RELEASE.stems.map(s => s.url)
const BASS_IDX  = RELEASE.stems.findIndex(s => s.key === 'bass')
const DRUMS_IDX = RELEASE.stems.findIndex(s => s.key === 'drums')
const MAIN_IDX  = RELEASE.stems.findIndex(s => s.key === 'main')
const VOX_IDX   = RELEASE.stems.findIndex(s => s.key === 'vox')
const ONBOARDING_ORDER = [DRUMS_IDX, BASS_IDX, MAIN_IDX, VOX_IDX].filter(i => i >= 0)

const PORTRAIT = '/artist/maz-bw-wide.webp'
const FAMILY   = '/artist/9cups-fam.jpg'
const COVER    = '/covers/catching-a-feeling.webp'

interface PanelConfig {
  n: string
  title: string
  source: string
  technique: string
  cols: number
  rows: number
}

export default function AsciiZoo() {
  const {
    tracks, allLoaded, isPlaying, hasStarted, analysers,
    toggleMute, startPlaybackOnboarded, togglePlayback,
  } = useAudioEngine(STEM_URLS)

  // Build renderers once. They're stateful closures, so their identity has to
  // survive re-renders. useState with a lazy initialiser guarantees that and,
  // unlike reading a ref during render, is legal — useMemo is not a guarantee,
  // it's allowed to recompute.
  const [renderers] = useState(() => [
    createClassic(PORTRAIT),
    createBlock(COVER),
    createEdge(PORTRAIT),
    createHalftone(FAMILY),
    createParticles(PORTRAIT),
    createMatrix('9CUPS'),
  ])

  const panels: PanelConfig[] = useMemo(() => [
    { n: '01', title: 'CLASSIC',   source: 'maz-bw-wide',     technique: '9-step density ramp + drum-sparkle',     cols: 60, rows: 40 },
    { n: '02', title: 'BLOCK',     source: 'catching-a-feeling cover', technique: '▀▄█ half-blocks · vox glitch rows', cols: 60, rows: 40 },
    { n: '03', title: 'EDGE',      source: 'maz-bw-wide',     technique: 'Sobel detect · directional glyphs ─│╱╲',  cols: 60, rows: 40 },
    { n: '04', title: 'HALFTONE',  source: '9cups family',    technique: 'Floyd-Steinberg dither · 6-step dot ramp', cols: 60, rows: 40 },
    { n: '05', title: 'PARTICLES', source: 'maz-bw-wide',     technique: 'Faint base + drifting glyph particles',   cols: 60, rows: 40 },
    { n: '06', title: 'MATRIX',    source: '"9CUPS" wordmark', technique: 'Matrix rain through pre-rendered stencil', cols: 50, rows: 32 },
  ], [])

  const startPlayback = () =>
    startPlaybackOnboarded({ stepMs: 3000, order: ONBOARDING_ORDER })

  return (
    <>
      <Link href="/explore" className="ha-back" aria-label="Back to explore index">
        ← explore
      </Link>

      <main className="az-page">
        <header className="az-head">
          <p className="az-eyebrow">/explore/ascii-zoo · 8 variations · no WebGL</p>
          <h1 className="az-title">All ASCII. No mesh.</h1>
          <p className="az-blurb">
            Eight different ASCII techniques applied to our photos + the 9cups wordmark,
            all driven by the four-stem audio engine. The goal is to see if pure-ASCII
            visualisation reads as well as (or better than) the WebGL terrain — and at
            lower perf cost. Press play. Compare. Pick winners.
          </p>
        </header>

        <ul className="az-grid">
          {panels.map((p, i) => (
            <li key={p.n} className="az-card">
              <div className="az-card-meta">
                <span className="az-card-n">{p.n}</span>
                <h2 className="az-card-title">{p.title}</h2>
                <span className="az-card-source">{p.source}</span>
              </div>
              <div className="az-panel">
                <AsciiPanel
                  renderer={renderers[i]}
                  cols={p.cols}
                  rows={p.rows}
                  analysers={analysers}
                  tracks={tracks}
                  playing={isPlaying}
                  bassIdx={BASS_IDX}
                  drumsIdx={DRUMS_IDX}
                  mainIdx={MAIN_IDX}
                  voxIdx={VOX_IDX}
                />
              </div>
              <p className="az-card-tech">{p.technique}</p>
            </li>
          ))}
        </ul>

        <footer className="az-controls">
          {!hasStarted ? (
            <button
              type="button"
              className="az-press-play"
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
