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
        title: 'Home',
        desc: 'Knockout video hero above the landing, sharing one audio transport. Side by side above 1600x800.',
        status: 'live',
      },
      {
        path: '/mixer',
        title: 'Mixer — Catching A Feeling',
        desc: 'Four-stem mixer. Left column is the haze video with the album-cover blend; right is wordmark, stamps, terrain, listen row.',
        status: 'live',
      },
    ],
  },
  {
    label: 'Explore — ASCII visualiser iterations',
    blurb: 'Unfinished, deliberately kept, not linked from the public site. Report at docs/research/2026-05-15-brik-space-explore.md.',
    routes: [
      { path: '/explore',               title: 'Explore index',                 desc: 'Iterations hub.',                                                  status: 'new' },
      { path: '/explore/glyph-plot',    title: '01 · Glyph plot',               desc: '80x24 ASCII frequency plot, 9-step density ramp.',                 status: 'new' },
      { path: '/explore/home-ascii',    title: '02 · Home (ASCII variant)',     desc: 'Full layout with an ASCII trace of the portrait plus glyph strip.', status: 'new' },
      { path: '/explore/ascii-zoo',     title: '03 · ASCII zoo',                desc: 'Six ASCII techniques side by side, no WebGL.',                     status: 'new' },
      { path: '/explore/ascii-overlay', title: '04 · ASCII overlay (combined)', desc: 'Four ASCII layers stacked via mix-blend-mode, one per stem.',       status: 'new' },
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

// Dev route index. Never a search result.
export const metadata = {
  title: 'Review · 9cups routes',
  robots: { index: false, follow: false },
}

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
