'use client'

// Variant E — Persistent watermark
// BW headshot sits as a low-opacity full-page background behind everything,
// no filter, no animation. The terrain wireframe and foreground content
// render on top. Album cover appears in TrackTitle (same as A, B, D).

import dynamic from 'next/dynamic'
import HeroPage from '@/components/Hero/HeroPage'
import InlineCover from '@/components/ImageDemo/InlineCover'

const Terrain = dynamic(() => import('@/components/Terrain/Terrain'), { ssr: false })

export default function ImgEPage() {
  return (
    <>
      <a href="/" className="variant-pill">E · Watermark · back</a>
      <HeroPage
        Visualiser={Terrain}
        backdropSlot={<div className="watermark-bg" aria-hidden="true" />}
        trackTitleAside={<InlineCover size={88} />}
      />
    </>
  )
}
