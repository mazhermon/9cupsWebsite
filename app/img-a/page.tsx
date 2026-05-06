'use client'

// Variant A — Sky portrait, ground terrain
// BW headshot fades in as a duotone'd backdrop in the upper-right of the
// hero; album cover appears as a thumbnail next to TrackTitle once playback
// starts.

import dynamic from 'next/dynamic'
import HeroPage from '@/components/Hero/HeroPage'
import InlineCover from '@/components/ImageDemo/InlineCover'

const Terrain = dynamic(() => import('@/components/Terrain/Terrain'), { ssr: false })

export default function ImgAPage() {
  return (
    <>
      <a href="/" className="variant-pill">A · Sky portrait · back</a>
      <HeroPage
        Visualiser={Terrain}
        backdropSlot={<div className="sky-portrait" aria-hidden="true" />}
        trackTitleAside={<InlineCover size={88} />}
      />
    </>
  )
}
