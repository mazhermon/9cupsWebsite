'use client'

interface PlayControlProps {
  isPlaying: boolean
  onToggle: () => void
  /** Small caption under the button. Defaults to the mixer's copy; the landing
   *  page passes its own because it has no shapes to tap. Pass null for none. */
  hint?: string | null
  /** Disable while audio isn't ready, or when loading failed. */
  disabled?: boolean
  /** Extra class on the wrapper, for hosts that place the control in the
   *  content flow rather than the default fixed corner position. */
  className?: string
}

export default function PlayControl({
  isPlaying,
  onToggle,
  hint = 'Tap shapes to mute',
  disabled,
  className,
}: PlayControlProps) {
  return (
    <div className={className ? `play-control ${className}` : 'play-control'}>
      <button
        type="button"
        className="play-btn"
        onClick={onToggle}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause' : 'Play'}
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
      {/* State announced in text, not just by the icon swap, so screen-reader
          users hear the change without inspecting the button. */}
      <span className="sr-only" aria-live="polite">
        {isPlaying ? 'Playing' : 'Paused'}
      </span>
      {hint && (
        <span className="play-hint" aria-hidden="true">
          {hint}
        </span>
      )}
    </div>
  )
}
