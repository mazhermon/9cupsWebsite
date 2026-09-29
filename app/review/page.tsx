import Link from 'next/link'
import DevDock from '@/components/DevDock/DevDock'
import './review.css'

// Single-page index of every route currently in the repo. Use this when you've
// lost track of which experiments are open. Status badges map to the cleanup
// plan in docs/progress/2026-05-07-state.md.

type Status = 'live' | 'picked' | 'new' | 'clean'

interface Route {
  path: string
  title: string
  desc: string
  status: Status
}

interface Section {
  label: string
  blurb: string
  routes: Route[]
}

const SECTIONS: Section[] = [
  {
    label: 'Live',
    blurb: 'What the public site renders right now.',
    routes: [
      {
        path: '/',
        title: 'Home — Catching A Feeling',
        desc: 'Editorial split, picked: C4-hover with reversed cover/portrait blend, drums-led onboarding, kick-glitch wordmark, wireframe terrain.',
        status: 'live',
      },
    ],
  },
  {
    label: 'Explore — ASCII visualiser iterations (started 2026-05-15)',
    blurb: 'Started as a 4-direction brik.space study. After review we kept glyph-plot and started iterating on it — tracing real images, adding audio overlay. Report at docs/research/2026-05-15-brik-space-explore.md.',
    routes: [
      { path: '/explore',                title: 'Explore index',         desc: 'Iterations hub. Two cards now: glyph-plot and home-ascii.',                                                   status: 'new' },
      { path: '/explore/glyph-plot',     title: '01 · Glyph plot',       desc: 'Original — 80×24 ASCII frequency plot. One <pre>, 9-step density ramp.',                                       status: 'new' },
      { path: '/explore/home-ascii',     title: '02 · Home (ASCII variant)', desc: 'Full home layout. Left = ASCII trace of maz-bw-wide + cover overlay. Right = main+vox glyph strip over bass+drums terrain.', status: 'new' },
      { path: '/explore/ascii-zoo',      title: '03 · ASCII zoo (no WebGL)', desc: 'Six ASCII variations on one page: classic, block, edge, halftone, particles, matrix. (waveform + braille dropped after review.)', status: 'new' },
      { path: '/explore/ascii-overlay',  title: '04 · ASCII overlay (combined)', desc: 'Four ASCII layers stacked via mix-blend-mode: BLOCK/cover/bass, MATRIX/wordmark/drums, EDGE/portrait/main, PARTICLES/portrait/vox.', status: 'new' },
    ],
  },
  {
    label: 'C-family image composition variants',
    blurb: 'Demo routes from the cover/portrait composition pass. C4-hover was promoted to / — the rest are slated for deletion in the next cleanup commit.',
    routes: [
      { path: '/img-c',           title: 'C · Editorial',                desc: 'Plain BW portrait, no filter.',                                          status: 'clean' },
      { path: '/img-c2',          title: 'C2 · Editorial w/ cover',      desc: 'Album cover in the portrait slot (square cropped to fill).',             status: 'clean' },
      { path: '/img-c3',          title: 'C3 · Duotone purple/magenta',  desc: 'Duotone(primary-dark → accent-vivid).',                                  status: 'clean' },
      { path: '/img-c4',          title: 'C4 · Mixed (portrait × cover)', desc: 'Portrait under, cover overlaid via mix-blend-mode at 65%.',             status: 'clean' },
      { path: '/img-c4-hover',    title: 'C4 · Hover blend  (PICKED)',   desc: 'CSS-only hover blend — the basis for the live home page.',                status: 'picked' },
      { path: '/img-c4-pulse',    title: 'C4 · Audio pulse',             desc: 'Bass + kick drive the cover-overlay opacity.',                            status: 'clean' },
      { path: '/img-c4-spotlight', title: 'C4 · Spotlight',              desc: 'Cursor-tracked radial reveal of the cover.',                              status: 'clean' },
      { path: '/img-c5',          title: 'C5 · Duotone navy/pink',       desc: 'Electric punk-club palette.',                                            status: 'clean' },
      { path: '/img-c6',          title: 'C6 · Duotone earth',           desc: 'Olive/green secondary palette.',                                          status: 'clean' },
      { path: '/img-c7',          title: 'C7 · Duotone sunset',          desc: 'Plum → coral, golden-hour feel.',                                         status: 'clean' },
    ],
  },
  {
    label: 'Font work',
    blurb: 'Display-font picker rounds. Caprasimo won; these routes can go in the cleanup commit.',
    routes: [
      { path: '/fonts',      title: 'Fonts v2 picker', desc: '10 editorial display serifs + 1 variable wildcard (Tilt Warp).',     status: 'clean' },
      { path: '/playground', title: 'Playground',      desc: '9-font wordmark comparison playground from round 1.',                 status: 'clean' },
    ],
  },
]

const STATUS_COPY: Record<Status, string> = {
  live: 'LIVE',
  picked: 'PICKED',
  new: 'NEW',
  clean: 'CLEAN-PENDING',
}

const TOTAL_ROUTES = SECTIONS.reduce((n, s) => n + s.routes.length, 0)
const COUNT_CLEAN = SECTIONS.flatMap(s => s.routes).filter(r => r.status === 'clean').length

export const metadata = { title: 'Review · 9cups routes' }

export default function ReviewPage() {
  return (
    <main className="rv">
      <header className="rv-head">
        <p className="rv-eyebrow">REVIEW · 9cups · {TOTAL_ROUTES} routes</p>
        <h1 className="rv-title">Everything currently in the repo.</h1>
        <p className="rv-blurb">
          Single-page index of every <code>app/*/page.tsx</code> in the tree. Bookmark this page if
          you keep losing track. {COUNT_CLEAN} of these are marked{' '}
          <span className="rv-badge rv-badge-clean">CLEAN-PENDING</span> per the cleanup plan in{' '}
          <code>docs/progress/2026-05-07-state.md</code> — they can be deleted in a single commit
          once you&apos;ve confirmed nothing of value will be lost.
        </p>
      </header>

      {SECTIONS.map(section => (
        <section key={section.label} className="rv-section">
          <header className="rv-section-head">
            <h2 className="rv-section-title">{section.label}</h2>
            <p className="rv-section-blurb">{section.blurb}</p>
          </header>

          <ul className="rv-list">
            {section.routes.map(r => (
              <li key={r.path} className={`rv-row rv-row-${r.status}`}>
                <Link href={r.path} className="rv-row-link">
                  <span className={`rv-badge rv-badge-${r.status}`}>{STATUS_COPY[r.status]}</span>
                  <span className="rv-path">{r.path}</span>
                  <span className="rv-meta">
                    <span className="rv-row-title">{r.title}</span>
                    <span className="rv-row-desc">{r.desc}</span>
                  </span>
                  <span className="rv-open" aria-hidden>open →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className="rv-footer">
        <p>
          To delete every <span className="rv-badge rv-badge-clean">CLEAN-PENDING</span> route in
          one shot, see the rm block in <code>docs/progress/2026-05-07-state.md §Pending cleanup</code>.
        </p>
      </footer>

      {/* Dev nav lives here now, not on the public landing page. */}
      <DevDock />
    </main>
  )
}
