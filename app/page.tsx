// Temporary index for the C / C2 / C3 image-treatment comparison. Once a
// variant is picked, that route's content takes over `/` and this index
// goes away.

import Link from 'next/link'
import Wordmark from '@/components/Wordmark/Wordmark'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

const VARIANTS = [
  {
    href: '/img-c',
    badge: 'C',
    title: 'Editorial · BW',
    feel: 'Original · monochrome',
    summary:
      'BW headshot fills the left column full-bleed; wordmark + toggles + cover + listen-on live on the right with the terrain underneath. Untouched source — clean, journalistic.',
  },
  {
    href: '/img-c2',
    badge: 'C2',
    title: 'Editorial · cover',
    feel: 'Album cover replaces portrait',
    summary:
      'Same layout, but the album cover takes the left column. Square cover crops via object-fit to fill the tall column — its leafy-purple texture tolerates the crop. The cover IS the artist statement here.',
  },
  {
    href: '/img-c3',
    badge: 'C3',
    title: 'Editorial · duotone',
    feel: 'BW colourised · brand palette',
    summary:
      'BW headshot run through an SVG feColorMatrix duotone: blacks map to primary-dark (#3B1A6E), highlights to accent-vivid (#CC2E90). Smooth purple-to-magenta gradient mapping, brand-locked, modern CSS.',
  },
]

export default function ChooseImgVariant() {
  return (
    <>
      <main className="variant-index" aria-label="9cups · editorial variants">
        <header className="variant-index-head">
          <Wordmark eyebrow="catching a feeling · pick the editorial treatment" />
          <p className="variant-index-blurb">
            Three takes on the editorial split. Open each, hit Press Play, watch the
            layered intro fire. Tell me which lands and the rest goes away.
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
