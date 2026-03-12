'use client'

import { motion } from 'motion/react'

interface ToolbarProps {
  isPlaying: boolean
  onTogglePlayback: () => void
}

export default function Toolbar({ isPlaying, onTogglePlayback }: ToolbarProps) {
  return (
    <nav
      className="toolbar"
      aria-label="Playback controls"
    >
      <motion.button
        className="toolbar-btn"
        onClick={onTogglePlayback}
        aria-label={isPlaying ? 'Pause all tracks' : 'Resume all tracks'}
        aria-pressed={isPlaying}
        whileTap={{ scale: 0.92 }}
        transition={{ duration: 0.1 }}
      >
        {isPlaying ? (
          // Pause icon
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false">
            <rect x="4" y="3" width="4" height="14" rx="1" />
            <rect x="12" y="3" width="4" height="14" rx="1" />
          </svg>
        ) : (
          // Play icon
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M5 3.5l13 6.5-13 6.5V3.5z" />
          </svg>
        )}
        <span className="toolbar-btn-label">{isPlaying ? 'Pause' : 'Play'}</span>
      </motion.button>

      <div className="toolbar-divider" aria-hidden="true" />

      <p className="toolbar-hint" aria-hidden="true">
        Click shapes to mute
      </p>
    </nav>
  )
}
