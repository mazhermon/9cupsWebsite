// Temporary index for visualiser A/B/C comparison. Pick a candidate, then
// the winning route's content takes over `/` and this index goes away.

import Link from 'next/link'
import Wordmark from '@/components/Wordmark/Wordmark'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

const VARIANTS = [
  {
    href: '/vis-a',
    badge: 'A',
    title: 'Unified terrain',
    summary:
      'Single wireframe topographic plane. All four stems feed one vertex shader: bass = rolling hills, drums = radial pulses, main = wave field, vox = fine ripples. One mesh, one render pass.',
    feel: '3D · single hero',
  },
  {
    href: '/vis-b',
    badge: 'B',
    title: 'HUD meters + 3D',
    summary:
      'Per-stem CSS meters do the precise audio-visual sync. Behind them, a simpler bass/kick wireframe terrain provides atmospheric depth. Splits the work: 2D for lock-tight sync, 3D for mood.',
    feel: '2D + 3D · analytical',
  },
  {
    href: '/vis-c',
    badge: 'C',
    title: 'Canvas2D landscape',
    summary:
      'Pure Canvas2D. Stack of contour lines waving with bass and mid; spectrum bars at the bottom. Built to run at 60fps on a 2018 phone. No WebGL.',
    feel: '2D only · classic',
  },
]

export default function ChooseVariant() {
  return (
    <>
      <main className="variant-index" aria-label="9cups visualiser variants">
        <header className="variant-index-head">
          <Wordmark eyebrow="catching a feeling · pick a build" />
          <p className="variant-index-blurb">
            Three variants of the visualiser, each behind its own route. Open them, play the
            track, listen for sync, watch the framerate. Tell me which lands and we ship it.
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
