'use client'

import type { Stem } from '@/lib/track-config'
import type { TrackState } from '@/hooks/useAudioEngine'

interface StemTogglesProps {
  stems: Stem[]
  trackStates: TrackState[]
  onToggle: (id: number) => void
  /** Disable until stems have loaded so users don't get stuck pre-toggling silence. */
  disabled?: boolean
}

export default function StemToggles({ stems, trackStates, onToggle, disabled }: StemTogglesProps) {
  return (
    <nav className="stem-toggles" aria-label="Stem mute controls">
      <ul>
        {stems.map((stem, i) => {
          const muted = trackStates[i]?.muted ?? false
          return (
            <li key={stem.key}>
              <button
                type="button"
                className="stem-stamp"
                onClick={() => onToggle(i)}
                aria-pressed={muted}
                aria-label={`${stem.label} stem: ${muted ? 'unmute' : 'mute'}`}
                data-muted={muted}
                disabled={disabled}
                style={{ '--stem-color': stem.color } as React.CSSProperties}
              >
                <span className="stem-stamp-label">{stem.label}</span>
                <span className="stem-stamp-state" aria-hidden="true">{muted ? 'OFF' : 'ON'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
