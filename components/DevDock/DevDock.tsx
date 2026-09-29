'use client'

// Temporary dev-only navigation overlay for the home page. Lists every
// experiment route and visually marks the current focus of the iteration.
// Yellow "dev tape" border so it never gets mistaken for live UI.
//
// ─── How to update ────────────────────────────────────────────────────────
//   - CURRENT_FOCUS: the slug from ROUTES that should be highlighted
//   - CURRENT_TASK:  one-paragraph note about what's being worked on
//   - ROUTES:        add new experiments as they appear
//
// Remove the <DevDock /> render in app/page.tsx (and delete this file)
// when the live home should ship clean.

import Link from 'next/link'
import { useState } from 'react'

const CURRENT_FOCUS = 'ascii-overlay'

const CURRENT_TASK =
  'Combined ASCII visualiser at /explore/ascii-overlay — four canvas layers ' +
  '(BLOCK · MATRIX · EDGE · PARTICLES) stacked via mix-blend-mode: lighten. ' +
  'Each layer locked to one stem. Open question: is 4 layers right, or should ' +
  'we drop to 3 for clarity? Press play, mute stems one at a time to isolate.'

interface RouteRow {
  path: string
  label: string
  slug?: string
  blurb?: string
}

const ROUTES: RouteRow[] = [
  { path: '/review', label: '/review', blurb: 'full route index' },
  { path: '/explore', label: '/explore', blurb: 'iteration hub' },
  { path: '/explore/glyph-plot', label: '/explore/glyph-plot', blurb: '01 · original frequency plot' },
  { path: '/explore/home-ascii', label: '/explore/home-ascii', blurb: '02 · ASCII face + terrain + strip' },
  { path: '/explore/ascii-zoo', label: '/explore/ascii-zoo', blurb: '03 · six ASCII techniques side-by-side' },
  { path: '/explore/ascii-overlay', label: '/explore/ascii-overlay', slug: 'ascii-overlay', blurb: '04 · combined overlay (current)' },
]

export default function DevDock() {
  // Collapsed by default so it doesn't obscure the home composition. The
  // current focus slug is shown right on the toggle chip so the user can
  // always see what's being worked on without expanding.
  const [open, setOpen] = useState(false)

  return (
    <aside
      className="devdock"
      data-open={open}
      aria-label="Development navigation scratchpad"
    >
      <button
        type="button"
        className="devdock-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="devdock-tag">DEV</span>
        <span className="devdock-focus" aria-hidden>· {CURRENT_FOCUS}</span>
        <span className="devdock-toggle-icon" aria-hidden>{open ? '–' : '+'}</span>
      </button>

      {open && (
        <>
          <section className="devdock-section">
            <h3 className="devdock-h">Current focus</h3>
            <p className="devdock-task">{CURRENT_TASK}</p>
          </section>

          <section className="devdock-section">
            <h3 className="devdock-h">Routes</h3>
            <ul className="devdock-list">
              {ROUTES.map(r => {
                const isCurrent = r.slug === CURRENT_FOCUS
                return (
                  <li key={r.path} className="devdock-row" data-current={isCurrent}>
                    <Link href={r.path} className="devdock-link">
                      <span className="devdock-marker" aria-hidden>{isCurrent ? '►' : ' '}</span>
                      <span className="devdock-path">{r.label}</span>
                      {r.blurb && <span className="devdock-blurb">{r.blurb}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </aside>
  )
}
