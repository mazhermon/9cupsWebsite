'use client'

// 9cups · Catching A Feeling — the stem mixer.
//
// This was the home page until 2026-09-29, when / became a lighter landing
// page and the mixer moved here. The composition is unchanged: the picked
// editorial split (left = duotone'd portrait with the album cover blended
// over it, right = wordmark + stem toggles + terrain + listen-on). The cover
// sits at full blend by default; hovering the portrait pulls it back to
// reveal the artist underneath.

import Link from 'next/link'
import EditorialHero from '@/components/ImageDemo/EditorialHero'
import DuotoneFilter from '@/components/ImageDemo/Duotone'
import HoverOverlay from '@/components/ImageDemo/HoverOverlay'

export default function MixerPage() {
  return (
    <>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups · catching a feeling"
        imageFilter="url(#duotone-9cups) contrast(1.05)"
        svgFilters={<DuotoneFilter id="duotone-9cups" dark="#1F0F35" light="#A56AC9" />}
        overlaySlot={() => <HoverOverlay />}
      />
      <Link href="/" className="mixer-back">
        <span aria-hidden="true">&larr;</span> 9cups
      </Link>
    </>
  )
}
