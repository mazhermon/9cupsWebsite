'use client'

interface PlayControlProps {
  isPlaying: boolean
  onToggle: () => void
}

export default function PlayControl({ isPlaying, onToggle }: PlayControlProps) {
  return (
    <div className="play-control">
      <button
        type="button"
        className="play-btn"
        onClick={onToggle}
        aria-label={isPlaying ? 'Pause' : 'Resume'}
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M7 4.5 L19 12 L7 19.5 Z" />
          </svg>
        )}
      </button>
      <span className="play-hint" aria-hidden="true">
        Tap shapes to mute
      </span>
    </div>
  )
}
