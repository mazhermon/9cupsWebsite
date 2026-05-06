// Temporary index — C4 picked as the main; iterations explore animated
// blends; the C-family colour duotones remain for reference; /fonts is the
// type comparison page.

import Link from 'next/link'
import Wordmark from '@/components/Wordmark/Wordmark'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

interface Variant {
  href: string
  badge: string
  title: string
  feel: string
  summary: string
  pinned?: boolean
}

const VARIANTS: Variant[] = [
  // ── The picked direction + animated iterations ──────────────────────
  {
    href: '/img-c4',
    badge: 'C4',
    title: 'Mixed · main',
    feel: 'Picked · double exposure',
    summary:
      'Portrait given a soft purple duotone, album cover overlaid via mix-blend-mode: overlay at 65% opacity. Static — the chosen direction.',
    pinned: true,
  },
  {
    href: '/img-c4-hover',
    badge: 'C4·H',
    title: 'C4 · hover blend',
    feel: 'CSS-only · interactive',
    summary:
      'Cover sits at 35% by default; hovering the portrait box ramps it to 90% + saturate(1.45) over 550ms ease-out. No JS — just `:hover` + transition.',
    pinned: true,
  },
  {
    href: '/img-c4-spotlight',
    badge: 'C4·S',
    title: 'C4 · cursor spotlight',
    feel: 'Cursor-tracked mask',
    summary:
      'Cover only reveals where the cursor is — a 220px soft circle radial mask follows mousemove. Mouse leaves: spotlight drifts back to centre.',
    pinned: true,
  },
  {
    href: '/img-c4-pulse',
    badge: 'C4·P',
    title: 'C4 · audio pulse',
    feel: 'Music-synced blend',
    summary:
      'Bass low-band drives sustained overlay opacity (more bass = more cover). Drum kicks spike opacity briefly. Main mid energy hue-rotates + saturates the cover.',
    pinned: true,
  },

  // ── Reference: colour duotones (no overlay) ────────────────────────
  {
    href: '/img-c',
    badge: 'C',
    title: 'BW · untouched',
    feel: 'Reference',
    summary:
      'Original BW headshot full-bleed in the left column. Reference baseline.',
  },
  {
    href: '/img-c2',
    badge: 'C2',
    title: 'Cover · in left column',
    feel: 'Reference · cover-only',
    summary:
      'Album cover takes the left column, cropped via object-fit. No portrait, no overlay.',
  },
  {
    href: '/img-c3',
    badge: 'C3',
    title: 'Duotone · brand purple',
    feel: '#3B1A6E → #CC2E90',
    summary:
      'BW portrait through SVG feColorMatrix duotone, brand canonical.',
  },
  {
    href: '/img-c5',
    badge: 'C5',
    title: 'Duotone · navy/pink',
    feel: '#0F1A3D → #FF1F8E',
    summary:
      'Electric / punk-club palette.',
  },
  {
    href: '/img-c6',
    badge: 'C6',
    title: 'Duotone · earth',
    feel: '#0F1A12 → #7A8A1A',
    summary:
      'Brand secondary (organic green).',
  },
  {
    href: '/img-c7',
    badge: 'C7',
    title: 'Duotone · sunset',
    feel: '#2A0F2D → #FF8466',
    summary:
      'Warm / golden-hour.',
  },

  // ── Type comparison ────────────────────────────────────────────────
  {
    href: '/fonts',
    badge: 'Aa',
    title: 'Font picks',
    feel: '9 display fonts',
    summary:
      'Static mocks of the wordmark in nine display fonts (current + 8 alternatives) over the live page composition.',
  },
]

export default function ChooseImgVariant() {
  const pinned = VARIANTS.filter(v => v.pinned)
  const reference = VARIANTS.filter(v => !v.pinned)

  return (
    <>
      <main className="variant-index" aria-label="9cups · pickers">
        <header className="variant-index-head">
          <Wordmark eyebrow="catching a feeling · pick the direction" />
          <p className="variant-index-blurb">
            C4 is the picked composition. The four pinned routes are the live candidates —
            static C4 + three animated blend treatments. The rest stay as colour-duotone
            references and the type picker.
          </p>
        </header>

        <h2 className="variant-section">Live candidates</h2>
        <ul className="variant-grid">
          {pinned.map((v) => (
            <li key={v.href}>
              <Link href={v.href} className="variant-card variant-card--pinned">
                <span className="variant-badge" aria-hidden="true">{v.badge}</span>
                <h3 className="variant-title">{v.title}</h3>
                <p className="variant-feel">{v.feel}</p>
                <p className="variant-summary">{v.summary}</p>
                <span className="variant-cta" aria-hidden="true">Open →</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="variant-section">Reference · colour & type</h2>
        <ul className="variant-grid">
          {reference.map((v) => (
            <li key={v.href}>
              <Link href={v.href} className="variant-card">
                <span className="variant-badge" aria-hidden="true">{v.badge}</span>
                <h3 className="variant-title">{v.title}</h3>
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
