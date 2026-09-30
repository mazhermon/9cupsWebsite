'use client'

// A third-party player, loaded only when asked for.
//
// Why a facade rather than the iframe directly: each SoundCloud, Bandcamp or
// Mixcloud embed pulls in that platform's JavaScript, sets their cookies and
// adds real weight. A page of ten is slow, and it hands every visitor's IP to
// three companies before anyone has pressed anything.
//
// So we render our own card from our own data, and swap in the real iframe on
// click. One iframe at a time, and no third-party contact until a visitor asks
// for it.

import Image from 'next/image'
import { useState } from 'react'
import { SOURCE_LABEL, type Release } from '@/lib/releases'

function formatDate(iso: string) {
  const d = new Date(iso + 'T00:00:00Z')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', timeZone: 'UTC' })
}

export default function EmbedPlayer({ release }: { release: Release }) {
  const [loaded, setLoaded] = useState(false)
  const label = SOURCE_LABEL[release.source]

  return (
    <article className="rel" id={release.id}>
      <div className="rel-media">
        {loaded ? (
          <iframe
            className="rel-frame"
            src={release.embedUrl}
            title={`${release.title} — player on ${label}`}
            loading="lazy"
            allow="autoplay; encrypted-media; fullscreen"
            // Third-party content: no same-origin access, no top-level
            // navigation, no popups without a user gesture.
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          />
        ) : (
          <button
            type="button"
            className="rel-facade"
            onClick={() => setLoaded(true)}
            aria-label={`Load the ${label} player for ${release.title}`}
          >
            {release.artwork ? (
              <Image
                src={release.artwork}
                alt=""
                fill
                sizes="(max-width: 760px) 100vw, 420px"
                className="rel-art"
              />
            ) : (
              <span className="rel-art rel-art--blank" aria-hidden="true">
                {release.title.slice(0, 1)}
              </span>
            )}
            <span className="rel-play" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false"><path d="M7 4.5 L19 12 L7 19.5 Z" /></svg>
            </span>
            <span className="rel-src">{label}</span>
          </button>
        )}
      </div>

      <div className="rel-body">
        <h3 className="rel-title">{release.title}</h3>
        <p className="rel-meta">
          <time dateTime={release.date}>{formatDate(release.date)}</time>
          <span aria-hidden="true"> · </span>
          <span>{label}</span>
        </p>
        {release.blurb && <p className="rel-blurb">{release.blurb}</p>}
        <a className="rel-out" href={release.href} target="_blank" rel="noreferrer noopener">
          Open on {label} <span aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </article>
  )
}
