'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import TrackShape, { ShapeType } from '@/components/TrackShape/TrackShape'
import LoadingScreen from '@/components/LoadingScreen/LoadingScreen'
import Toolbar from '@/components/Toolbar/Toolbar'

// ─── Config ───────────────────────────────────────────────────────────────────
// Place your mp3 files in /public/audio/ as track1.mp3, track2.mp3, etc.
const TRACK_URLS = [
  '/audio/9cupsCatchingAFeelingWeb_bass.mp3',
  '/audio/9cupsCatchingAFeelingWeb_drums.mp3',
  '/audio/9cupsCatchingAFeelingWeb_main.mp3',
  '/audio/9cupsCatchingAFeelingWeb_vox.mp3',
]

const TRACK_COLORS: string[] = ['#FF2D78', '#00D4FF', '#C8FF00', '#9B4DFF']
const TRACK_SHAPES: ShapeType[] = ['circle', 'hexagon', 'diamond', 'blob']
const TRACK_LABELS: string[] = ['Track 1', 'Track 2', 'Track 3', 'Track 4']
// ──────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const { tracks, allLoaded, isPlaying, hasStarted, analysers, toggleMute, startPlayback, togglePlayback } =
    useAudioEngine(TRACK_URLS)

  const [showLoading, setShowLoading] = useState(true)

  const handleStart = () => {
    startPlayback()
    setShowLoading(false)
  }

  return (
    <>
      {/* Skip-to-content link for keyboard/screen reader users */}
      <a href="#stage" className="skip-link">
        Skip to mixer
      </a>

      <AnimatePresence>
        {showLoading && (
          <LoadingScreen
            tracks={tracks}
            allLoaded={allLoaded}
            onStart={handleStart}
          />
        )}
      </AnimatePresence>

      <main className="app-root" aria-label="9cups DJ mixer">
        {/* Stage — 4 track shapes in a row */}
        <section
          id="stage"
          className="stage"
          aria-label="Track mixer — click a shape to mute or unmute its track"
        >
          {tracks.map((track, i) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: hasStarted ? 1 : 0.4, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <TrackShape
                track={track}
                color={TRACK_COLORS[i]}
                shape={TRACK_SHAPES[i]}
                label={TRACK_LABELS[i]}
                analyser={analysers[i]}
                onToggle={() => toggleMute(i)}
              />
            </motion.div>
          ))}
        </section>

        {/* Sidebar toolbar */}
        {hasStarted && (
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
            aria-label="Playback controls"
          >
            <Toolbar isPlaying={isPlaying} onTogglePlayback={togglePlayback} />
          </motion.aside>
        )}
      </main>
    </>
  )
}
