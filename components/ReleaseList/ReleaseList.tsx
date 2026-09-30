// Shared list surface for /mixes and /originals. Same component, different
// data — the only thing that differs between the two pages is the content.

import EmbedPlayer from '@/components/Player/EmbedPlayer'
import type { Release } from '@/lib/releases'

interface ReleaseListProps {
  title: string
  lede: string
  releases: Release[]
  /** Shown when there is nothing to list yet. */
  emptyNote: string
}

export default function ReleaseList({ title, lede, releases, emptyNote }: ReleaseListProps) {
  return (
    <main className="page-shell" id="main">
      <header className="page-head">
        <h1 className="page-title">{title}</h1>
        <p className="page-lede">{lede}</p>
      </header>

      {releases.length > 0 ? (
        <div className="rel-grid">
          {releases.map(r => <EmbedPlayer key={r.id} release={r} />)}
        </div>
      ) : (
        <p className="page-empty">{emptyNote}</p>
      )}
    </main>
  )
}
