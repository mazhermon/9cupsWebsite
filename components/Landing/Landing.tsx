'use client'

// The landing surface: play button, links out to every platform, a doorway
// into the mixer, bookings.
//
// Composition: terrain as the ground, content left-aligned above it —
// asymmetric rather than a centered stack (see DESIGN.md).
//
// The audio transport comes from <PlayerProvider>, not from a hook here, so the
// knockout hero's CTA and this page's play button drive the same <audio>.

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { usePlayer } from '@/components/Landing/PlayerProvider'
import { RELEASE, LINK_GROUPS, CONTACT_EMAIL } from '@/lib/track-config'
import Wordmark from '@/components/Wordmark/Wordmark'
import PlayControl from '@/components/PlayControl/PlayControl'
import LinkGroups from '@/components/Landing/LinkGroups'

const Terrain = dynamic(() => import('@/components/Terrain/Terrain'), { ssr: false })

export type LandingVariant =
  /** The whole page: owns the viewport and its own scroll, terrain fixed. */
  | 'standalone'
  /** A section inside a longer document, beneath the video hero. Normal block
   *  flow; the terrain is absolute within the section. This is what / uses. */
  | 'section'

export interface LandingProps {
  variant?: LandingVariant
  /** Renders as <main> by default. A page that already has a <main> hosting a
   *  hero above this should pass 'section', so there's only one. */
  as?: 'main' | 'section'
  /** DOM id for the hero CTA to scroll to. */
  id?: string
}

export default function Landing({
  variant = 'standalone',
  as = 'main',
  id = 'landing',
}: LandingProps) {
  const { buffering, isPlaying, error, analyser, toggle } = usePlayer()

  // The mix's low end carries the kick, so the wordmark's transient detector
  // still finds hits — the same glitch the mixer gets from its drums stem.
  // Passed only while playing so the ghosts settle when paused.
  const kickAnalyser = isPlaying ? analyser : null

  // "Loading…" only while genuinely waiting on data. Previously this showed
  // until `canplay` fired, which could be never — see useTrackPlayer.
  const hint = error
    ? 'Audio unavailable'
    : buffering
      ? 'Loading…'
      : isPlaying
        ? RELEASE.title
        : `Play ${RELEASE.title}`

  const Root = as

  return (
    <Root
      id={id}
      className={`landing landing--${variant}`}
      aria-label={`${RELEASE.artist} · ${RELEASE.title}`}
    >
      <Terrain
        className="terrain--landing"
        playing={isPlaying}
        singleAnalyser={analyser}
        // Full-bleed here, unlike the mixer's half-width column, so the plane
        // needs to be wider than the frame or its edges read as diagonal seams.
        planeScale={2.2}
      />

      {/* Softens the terrain under the foot content. The wireframe is at its
          densest and brightest right at the horizon, which is exactly where the
          mixer CTA and contact link sit. */}
      <div className="landing-scrim" aria-hidden="true" />

      <div className="landing-content" id="landing-content">
        <Wordmark
          eyebrow="UKG, Bassline, 140 &amp; House"
          // Under the hero, which already owns the page's single <h1>.
          level={variant === 'section' ? 2 : 1}
          kickAnalyser={kickAnalyser}
          playing={isPlaying}
        />

        <PlayControl
          className="play-control--inline"
          isPlaying={isPlaying}
          onToggle={toggle}
          // Enabled as soon as there's no error: calling play() is what
          // starts the download, so blocking until buffered strands the user.
          disabled={!!error}
          hint={hint}
        />

        <LinkGroups groups={LINK_GROUPS} />

        <div className="landing-foot">
          <Link href="/stems" className="landing-mixer-cta">
            <span className="landing-mixer-label">Play with the stems</span>
            <span className="landing-mixer-sub">
              Pull {RELEASE.title} apart, one stem at a time
            </span>
            <span className="landing-mixer-arrow" aria-hidden="true">&rarr;</span>
          </Link>

          <a className="landing-contact" href={`mailto:${CONTACT_EMAIL}`}>
            Bookings
          </a>
        </div>
      </div>
    </Root>
  )
}
