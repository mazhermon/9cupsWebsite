import Link from 'next/link'

const DIRECTIONS = [
  {
    n: '01',
    slug: 'glyph-plot',
    title: 'Glyph plot',
    blurb:
      'The original — an 80-column ASCII frequency plot. Row bands paint stems; a 9-step density ramp draws amplitude. Lightest possible audio-reactive visual on the page.',
    tags: ['text effects', 'weird internet'],
  },
  {
    n: '02',
    slug: 'home-ascii',
    title: 'Home (ASCII variant)',
    blurb:
      'Iteration 2 — full home layout. Left panel: ASCII trace of maz-bw-wide with the cover overlaid (hover to reveal the face). Right panel: hero on top, then a slim main+vox glyph strip stacked over a bass+drums-only wireframe terrain.',
    tags: ['ASCII', 'home variant', 'stem split'],
  },
  {
    n: '03',
    slug: 'ascii-zoo',
    title: 'ASCII zoo (no WebGL)',
    blurb:
      'Iteration 3 — comparison grid. Six ASCII techniques in one page: classic ramp, half-block pixels, Sobel edges, Floyd-Steinberg halftone, drifting particles, Matrix rain over the wordmark.',
    tags: ['ASCII', 'no WebGL', 'comparison'],
  },
  {
    n: '04',
    slug: 'ascii-overlay',
    title: 'ASCII overlay (combined)',
    blurb:
      'Iteration 4 — combined visualiser. Four canvas layers stacked via mix-blend-mode: BLOCK (cover/bass), MATRIX (wordmark/drums), EDGE (portrait/main), PARTICLES (portrait/vox). Each layer is one stem, one brand colour, GPU-composited.',
    tags: ['ASCII', 'overlay', 'mix-blend-mode'],
  },
] as const

export default function ExploreIndex() {
  return (
    <main className="ex-index">
      <header className="ex-index-head">
        <p className="ex-index-eyebrow">EXPLORE · ASCII visualiser iterations · brik.space study</p>
        <h1 className="ex-index-title">
          Iterating on the<br />glyph-plot direction.
        </h1>
        <p className="ex-index-blurb">
          The original brik.space prototype set had four directions. After review we kept
          one — <strong>glyph plot</strong> — and started iterating on it. The next step is
          tracing actual images (portrait, cover) into ASCII while keeping the audio-reactive
          animation. Field notes live at <code>docs/research/2026-05-15-brik-space-explore.md</code>.
        </p>
      </header>

      <ul className="ex-index-grid">
        {DIRECTIONS.map(d => (
          <li key={d.slug} className={`ex-card ex-card-${d.slug}`}>
            <Link href={`/explore/${d.slug}`} className="ex-card-link" aria-label={`Open prototype: ${d.title}`}>
              <div className="ex-card-preview" aria-hidden>
                <Preview slug={d.slug} />
              </div>
              <div className="ex-card-body">
                <div className="ex-card-row">
                  <span className="ex-card-n">{d.n}</span>
                  <h2 className="ex-card-title">{d.title}</h2>
                </div>
                <p className="ex-card-blurb">{d.blurb}</p>
                <ul className="ex-card-tags">
                  {d.tags.map(t => <li key={t}>{t}</li>)}
                </ul>
                <span className="ex-card-cta">Open prototype →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <footer className="ex-index-footer">
        <p className="ex-index-footer-label">Discarded</p>
        <p>
          First-pass directions <code>living-type</code>, <code>grid-cells</code>,
          and <code>holo-card</code> were dropped. The cover-bleed-through{' '}
          <code>glyph-portrait</code> experiment was also dropped — replaced by
          the new <code>home-ascii</code> direction which splits the visualiser
          across stems.
        </p>
        <Link href="/review" className="ex-index-footer-link">→ /review — full route index</Link>
      </footer>
    </main>
  )
}

function Preview({ slug }: { slug: string }) {
  if (slug === 'glyph-plot') {
    return (
      <pre className="ex-prev ex-prev-gp">{`█▰◆●○∘∙·  ·∙∘○●◆▰█
▰●◆▰█▰◆●▰  ●▰◆●▰●◆▰
∘○●◆▰█▰◆  ◆▰█▰◆●○∘
·∙∘○●◆▰█  █▰◆●○∘∙·`}</pre>
    )
  }
  if (slug === 'ascii-zoo') {
    return (
      <div className="ex-prev" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '4px', padding: 'var(--space-3)', width: '100%' }}>
        {['⠿','░','▓','╲','◉','*','01','▆'].map(t => (
          <div key={t} style={{
            display: 'grid', placeItems: 'center',
            background: 'rgb(196 126 232 / 0.08)',
            color: 'var(--color-primary-light)',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.9rem',
            borderRadius: 2,
          }}>{t}</div>
        ))}
      </div>
    )
  }
  // home-ascii — two halves: ASCII face on the left, glyph strip on the right
  return (
    <div className="ex-prev ex-prev-ha">
      <div className="ex-prev-ha-half">
        <pre>{`    ·.....·
   ·:-+##+-·
  -+#%@@@%#+:
 :+%@@@@@@%+
 -%@@@@@@@@%
  +#%@@@@%#
   ·-+##+:`}</pre>
      </div>
      <div className="ex-prev-ha-half ex-prev-ha-strip">
        <pre>{`▰●◆▰█▰●◆
●▰●◆▰●◆●
∘○●▰●◆●▰
··∘○●◆▰`}</pre>
      </div>
    </div>
  )
}
