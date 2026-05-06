// Temporary index for image-treatment A–E comparison. Once you pick a
// variant the chosen route's content takes over `/` and this index goes away.

import Link from 'next/link'
import Wordmark from '@/components/Wordmark/Wordmark'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

const VARIANTS = [
  {
    href: '/img-a',
    badge: 'A',
    title: 'Sky portrait',
    feel: 'Backdrop · duotone',
    summary:
      'BW headshot fades in as a duotone-purple backdrop in the upper half, behind the wordmark; album cover slips into the TrackTitle once playback starts. Artist (sky) → wordmark (horizon) → terrain (ground).',
  },
  {
    href: '/img-b',
    badge: 'B',
    title: 'Press-play preview',
    feel: 'Foreground · cover-as-button',
    summary:
      'Album cover replaces "Press Play to Enter" — clickable square with a play glyph overlay. Tiny BW avatar joins the eyebrow as a persistent identity mark. Cover stays in TrackTitle after start.',
  },
  {
    href: '/img-c',
    badge: 'C',
    title: 'Editorial split',
    feel: '2-column · magazine',
    summary:
      'Hero becomes a 50/50: BW headshot fills the left, wordmark + toggles + cover live on the right with the terrain underneath. Less hero, more release-page.',
  },
  {
    href: '/img-d',
    badge: 'D',
    title: 'Glitch reveal',
    feel: 'Audio-sync · transient flash',
    summary:
      'BW portrait is invisible until a kick fires — each transient flashes the headshot at low opacity with a small translate jitter, then fades. Surprising, beat-locked, possibly aggressive.',
  },
  {
    href: '/img-e',
    badge: 'E',
    title: 'Watermark',
    feel: 'Subtle · always present',
    summary:
      'BW headshot sits as a 12% opacity background behind everything (including the terrain). No filter, no animation. Quiet artist presence without competing for attention.',
  },
]

export default function ChooseImgVariant() {
  return (
    <>
      <main className="variant-index" aria-label="9cups image-treatment variants">
        <header className="variant-index-head">
          <Wordmark eyebrow="catching a feeling · pick an image treatment" />
          <p className="variant-index-blurb">
            Five ways to bring the album cover and the artist photo into the page.
            Open each, hit Press Play, watch the layered intro. Tell me which lands.
          </p>
        </header>

        <ul className="variant-grid">
          {VARIANTS.map((v) => (
            <li key={v.href}>
              <Link href={v.href} className="variant-card">
                <span className="variant-badge" aria-hidden="true">{v.badge}</span>
                <h2 className="variant-title">{v.title}</h2>
                <p className="variant-feel">{v.feel}</p>
                <p className="variant-summary">{v.summary}</p>
                <span className="variant-cta" aria-hidden="true">Open →</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <GrainOverlay />
    </>
  )
}
