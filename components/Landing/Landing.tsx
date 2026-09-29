'use client'

// The landing page: 9cups' front door.
//
// Deliberately lighter than the mixer at /mixer. One play button on a single
// summed mixdown (660KB, streamed) drives the wireframe terrain; everything
// else is links out to the platforms. The mixer is one click away for anyone
// who wants to pull the track apart.
//
// Composition: terrain as the ground across the bottom, content left-aligned
// above it — asymmetric rather than a centered stack (see DESIGN.md).

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTrackPlayer } from '@/hooks/useTrackPlayer'
import {
  RELEASE,
  LINK_GROUPS,
  CONTACT_EMAIL,
  LANDING_TRACK_URL,
} from '@/lib/track-config'
import Wordmark from '@/components/Wordmark/Wordmark'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'
import LinkGroups from '@/components/Landing/LinkGroups'

const Terrain = dynamic(() => import('@/components/Terrain/Terrain'), { ssr: false })

export default function Landing() {
  const { ready, isPlaying, error, analyser, toggle } = useTrackPlayer(LANDING_TRACK_URL)

  // The mix's low end carries the kick, so the wordmark's transient detector
  // still finds hits — the same glitch the mixer gets from its drums stem.
  // Passed only while playing so the ghosts settle when paused.
  const kickAnalyser = isPlaying ? analyser : null

  const hint = error
    ? 'Audio unavailable'
    : !ready
      ? 'Loading…'
      : isPlaying
        ? RELEASE.title
        : `Play ${RELEASE.title}`

  return (
    <>
      <a href="#landing-content" className="skip-link">Skip to links</a>

      <main className="landing" aria-label={`${RELEASE.artist} · ${RELEASE.title}`}>
        <Terrain
          className="terrain--landing"
          playing={isPlaying}
          singleAnalyser={analyser}
          // Full-bleed here, unlike the mixer's half-width column, so the
          // plane needs to be wider than the frame or its edges read as
          // diagonal seams at the sides.
          planeScale={2.2}
        />

        {/* Softens the terrain under the foot content. The wireframe is at its
            densest and brightest right at the horizon, which is exactly where
            the mixer CTA and contact link sit. */}
        <div className="landing-scrim" aria-hidden="true" />

        <div className="landing-content" id="landing-content">
          {/* Not the artist name — that's the wordmark immediately below, and
              repeating it makes the <h1> announce "DJ 9cups 9cups". First-touch
              visitors get genre + place instead, which is the one thing the
              page can't convey through the music alone. */}
          <Wordmark
            eyebrow="House &amp; UK garage · Wellington"
            kickAnalyser={kickAnalyser}
            playing={isPlaying}
          />

          <PlayControl
            className="play-control--inline"
            isPlaying={isPlaying}
            onToggle={toggle}
            disabled={!ready || !!error}
            hint={hint}
          />

          <LinkGroups groups={LINK_GROUPS} />

          <div className="landing-foot">
            <Link href="/mixer" className="landing-mixer-cta">
              <span className="landing-mixer-label">Play with the stems</span>
              <span className="landing-mixer-sub">
                Pull {RELEASE.title} apart, one stem at a time
              </span>
              <span className="landing-mixer-arrow" aria-hidden="true">&rarr;</span>
            </Link>

            <a className="landing-contact" href={`mailto:${CONTACT_EMAIL}`}>
              Get in touch
            </a>
          </div>
        </div>
      </main>

      <GrainOverlay />
    </>
  )
}
