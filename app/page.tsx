// Temporary index for the C-family image-treatment comparison. Once a
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
    feel: 'Untouched',
    summary:
      'Original editorial split: BW headshot full-bleed in the left column, music elements on the right. No filter, no overlay — clean and journalistic.',
  },
  {
    href: '/img-c2',
    badge: 'C2',
    title: 'Editorial · cover',
    feel: 'Album cover replaces portrait',
    summary:
      'Same layout, but the album cover takes the left column. The square crops via object-fit to fill the tall column; the leafy purple texture handles the crop well.',
  },
  {
    href: '/img-c3',
    badge: 'C3',
    title: 'Duotone · purple/magenta',
    feel: 'Brand palette · primary',
    summary:
      'BW portrait through SVG feColorMatrix duotone. Blacks → primary-dark (#3B1A6E), highlights → accent-vivid (#CC2E90). The canonical brand-purple treatment.',
  },
  {
    href: '/img-c4',
    badge: 'C4',
    title: 'Mixed · portrait × cover',
    feel: 'Layered · mix-blend-mode',
    summary:
      'BW portrait with a soft purple duotone underneath, album cover overlaid via mix-blend-mode: overlay at 65% opacity. Two photos at once — the artist plus the leafy texture of the cover melded.',
  },
  {
    href: '/img-c5',
    badge: 'C5',
    title: 'Duotone · navy/pink',
    feel: 'Electric · punk-club',
    summary:
      'Near-black navy (#0F1A3D) → hot pink (#FF1F8E). Cooler than C3, punchier highlights — feels more electric than brand-canonical.',
  },
  {
    href: '/img-c6',
    badge: 'C6',
    title: 'Duotone · earth',
    feel: 'Brand secondary · organic green',
    summary:
      'Ground-dark (#0F1A12) → accent-organic (#7A8A1A). Pulls from the brand\'s green/olive secondaries. Tonally rhymes with the foliage in the album cover.',
  },
  {
    href: '/img-c7',
    badge: 'C7',
    title: 'Duotone · sunset',
    feel: 'Warm · golden-hour',
    summary:
      'Deep plum (#2A0F2D) → warm coral (#FF8466). Warmer than C3, lower contrast than C5 — golden-hour feel without leaving the purple-led palette entirely.',
  },
]

export default function ChooseImgVariant() {
  return (
    <>
      <main className="variant-index" aria-label="9cups · editorial variants">
        <header className="variant-index-head">
          <Wordmark eyebrow="catching a feeling · pick the editorial treatment" />
          <p className="variant-index-blurb">
            Seven takes on the editorial split. C / C2 = base layouts;
            C3 / C5 / C6 / C7 = SVG duotones in different palettes; C4 = portrait + cover layered.
            Open each, hit Press Play, and tell me which lands.
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
