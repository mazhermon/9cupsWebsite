'use client'

// Owns the landing page's single audio transport and publishes it to every
// consumer on the page.
//
// Why a provider rather than the hook inside <Landing>: the knockout hero's
// CTA and the landing's play button have to be the *same* transport — pressing
// either must leave the other showing the same state. Calling useTrackPlayer in
// both would create two independent <audio> elements playing over each other.

import { createContext, useContext, type ReactNode } from 'react'
import { useTrackPlayer, type TrackPlayerReturn } from '@/hooks/useTrackPlayer'
import { LANDING_TRACK_URL } from '@/lib/track-config'

const PlayerContext = createContext<TrackPlayerReturn | null>(null)

export function PlayerProvider({
  url = LANDING_TRACK_URL,
  children,
}: {
  url?: string
  children: ReactNode
}) {
  const player = useTrackPlayer(url)
  return <PlayerContext.Provider value={player}>{children}</PlayerContext.Provider>
}

/** Throws outside a provider rather than returning a dead transport — a silent
 *  no-op play button is far harder to diagnose than a boot-time error. */
export function usePlayer(): TrackPlayerReturn {
  const ctx = useContext(PlayerContext)
  if (!ctx) {
    throw new Error('usePlayer must be used inside <PlayerProvider>')
  }
  return ctx
}
