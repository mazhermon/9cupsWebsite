'use client'

// 9cups · Catching A Feeling — home page.
// Picked: editorial split (left = duotone'd portrait + album cover overlay,
// right = wordmark + stem toggles + terrain + listen-on). The cover sits at
// full blend by default; hovering the portrait pulls it back to reveal the
// artist underneath.

import EditorialHero from '@/components/ImageDemo/EditorialHero'
import DuotoneFilter from '@/components/ImageDemo/Duotone'
import HoverOverlay from '@/components/ImageDemo/HoverOverlay'

export default function Home() {
  return (
    <EditorialHero
      imageSrc="/artist/maz-bw-wide.webp"
      imageAlt="DJ 9cups · catching a feeling"
      imageFilter="url(#duotone-9cups) contrast(1.05)"
      svgFilters={<DuotoneFilter id="duotone-9cups" dark="#1F0F35" light="#A56AC9" />}
      overlaySlot={() => <HoverOverlay />}
    />
  )
}
