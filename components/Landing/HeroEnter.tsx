'use client'

// The hero's single call to action: starts the track and moves the visitor to
// the landing section below.
//
// It shares the transport with the landing's play button via PlayerProvider, so
// pressing either leaves the other showing the same state.
//
// On the side-by-side layout (very large screens) both sections are already on
// screen, so there is nothing to scroll to. The button drops the scroll and the
// "then scroll" half of its label.

import { useCallback } from 'react'
import { usePlayer } from '@/components/Landing/PlayerProvider'
import { RELEASE } from '@/lib/track-config'

interface HeroEnterProps {
  /** Element id to reveal after starting playback. */
  targetId: string
}

export default function HeroEnter({ targetId }: HeroEnterProps) {
  const { buffering, isPlaying, error, toggle } = usePlayer()

  const onClick = useCallback(() => {
    // Start audio first: this runs inside the user gesture, which is what the
    // browser's autoplay policy requires. Scrolling afterwards is fine.
    if (!isPlaying) toggle()

    const target = document.getElementById(targetId)
    if (!target) return

    // Side-by-side layout: both halves are already visible, so a scroll would
    // do nothing but look broken. CSS also hides this button at that size, so
    // this branch is normally unreachable — it still matters if the viewport
    // crosses the breakpoint between render and click (a resize, or rotating
    // a tablet).
    const splitLayout = window.matchMedia('(min-width: 1600px) and (min-height: 800px)').matches
    if (splitLayout) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }, [isPlaying, toggle, targetId])

  const label = error
    ? 'Audio unavailable'
    : buffering
      ? 'Loading…'
      : isPlaying
        ? `Playing · ${RELEASE.title}`
        : 'Press play to enter'

  return (
    <button
      type="button"
      className="hero-enter"
      onClick={onClick}
      disabled={!!error}
      // Not aria-pressed: this is an entry action, not a toggle. The landing's
      // PlayControl is the transport toggle and carries that state.
      aria-describedby="hero-enter-state"
    >
      <span className="hero-enter-icon" aria-hidden="true">
        {isPlaying ? (
          <svg viewBox="0 0 24 24" focusable="false">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M7 4.5 L19 12 L7 19.5 Z" />
          </svg>
        )}
      </span>
      <span className="hero-enter-label">{label}</span>
      <span id="hero-enter-state" className="sr-only" aria-live="polite">
        {isPlaying ? 'Playing' : 'Not playing'}
      </span>
    </button>
  )
}
