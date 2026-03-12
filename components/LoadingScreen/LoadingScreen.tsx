'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { TrackState } from '@/hooks/useAudioEngine'

interface LoadingScreenProps {
  tracks: TrackState[]
  allLoaded: boolean
  onStart: () => void
}

const TRACK_COLORS = ['#FF2D78', '#00D4FF', '#C8FF00', '#9B4DFF']
const TRACK_LABELS = ['Track 1', 'Track 2', 'Track 3', 'Track 4']

export default function LoadingScreen({ tracks, allLoaded, onStart }: LoadingScreenProps) {
  const allTracksReady = tracks.every(t => t.loaded || t.error !== null)
  const hasErrors = tracks.some(t => t.error !== null)

  return (
    <AnimatePresence>
      <motion.div
        className="loading-overlay"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        role="status"
        aria-live="polite"
        aria-label="Loading audio tracks"
      >
        <div className="loading-inner">
          <h1 className="loading-title">9cups</h1>
          <p className="loading-subtitle" aria-live="polite">
            {allTracksReady
              ? hasErrors
                ? 'Some tracks failed to load'
                : 'Ready'
              : 'Loading tracks…'}
          </p>

          <div className="loading-tracks" role="list">
            {tracks.map((track, i) => {
              const color = TRACK_COLORS[i]
              const label = TRACK_LABELS[i]
              const isError = track.error !== null

              return (
                <div
                  key={track.id}
                  className="loading-track-row"
                  role="listitem"
                  aria-label={`${label}: ${isError ? 'error' : track.loaded ? 'ready' : `${track.loadProgress}%`}`}
                >
                  <span className="loading-track-label" style={{ color }}>
                    {label}
                  </span>

                  <div className="loading-bar-bg" aria-hidden="true">
                    <motion.div
                      className="loading-bar-fill"
                      style={{ backgroundColor: color }}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: isError ? 1 : track.loadProgress / 100 }}
                      transition={{ ease: 'easeOut', duration: 0.3 }}
                    />
                  </div>

                  <span className="loading-track-status" aria-hidden="true">
                    {isError ? '✕' : track.loaded ? '✓' : `${track.loadProgress}%`}
                  </span>
                </div>
              )
            })}
          </div>

          {allTracksReady && !hasErrors && (
            <motion.button
              className="start-btn"
              onClick={onStart}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              aria-label="Start playback"
            >
              Start
            </motion.button>
          )}

          {hasErrors && (
            <p className="loading-error" role="alert">
              Place MP3 files in <code>/public/audio/</code> as track1.mp3–track4.mp3
              nah Ive renamed these 9cupsCatchingAFeelingWeb_vox etc
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
