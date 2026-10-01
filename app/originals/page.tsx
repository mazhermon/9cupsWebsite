import type { Metadata } from 'next'
import Link from 'next/link'
import ReleaseList from '@/components/ReleaseList/ReleaseList'
import { ORIGINALS } from '@/lib/releases'

export const metadata: Metadata = {
  title: 'Originals · 9cups',
  description: 'Original tracks and releases by 9cups. UK garage, bassline, 140 and house out of Wellington.',
}

export default function OriginalsPage() {
  return (
    <>
      <ReleaseList
        title="Originals"
        lede="Tracks and releases. Players load when you press them, not before."
        releases={ORIGINALS}
        emptyNote="No originals up here yet. Catching A Feeling is playable on the home page, and you can pull it apart in the mixer."
      />
      <aside className="page-aside">
        <Link href="/stems" className="landing-mixer-cta">
          <span className="landing-mixer-label">Play with the stems</span>
          <span className="landing-mixer-sub">
            Take Catching A Feeling apart, one stem at a time
          </span>
          <span className="landing-mixer-arrow" aria-hidden="true">&rarr;</span>
        </Link>
      </aside>
    </>
  )
}
