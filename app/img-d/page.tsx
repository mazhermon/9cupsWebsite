'use client'

// Variant D — Glitch reveal
// On every detected kick transient, the BW portrait flashes briefly at low
// opacity over the entire hero, then fades. Album cover sits next to the
// TrackTitle once playback starts (same as A, B, E).

import dynamic from 'next/dynamic'
import HeroPage from '@/components/Hero/HeroPage'
import InlineCover from '@/components/ImageDemo/InlineCover'
import KickGlitch from '@/components/ImageDemo/KickGlitch'

const Terrain = dynamic(() => import('@/components/Terrain/Terrain'), { ssr: false })

export default function ImgDPage() {
  return (
    <>
      <a href="/" className="variant-pill">D · Glitch reveal · back</a>
      <HeroPage
        Visualiser={Terrain}
        glitchOverlay={(props) => <KickGlitch {...props} />}
        trackTitleAside={<InlineCover size={88} />}
      />
    </>
  )
}
