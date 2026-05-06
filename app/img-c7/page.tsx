'use client'

// Variant C7 — Duotone "sunset": deep plum → warm coral.
// Warmer than C3, lower contrast than C5, gives the portrait a "golden hour"
// feel without breaking from the purple-led palette.

import EditorialHero from '@/components/ImageDemo/EditorialHero'
import DuotoneFilter from '@/components/ImageDemo/Duotone'

export default function ImgC7Page() {
  return (
    <>
      <a href="/" className="variant-pill">C7 · Duotone sunset · back</a>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups"
        imageFilter="url(#duotone-c7) contrast(1.06) brightness(1.04)"
        svgFilters={<DuotoneFilter id="duotone-c7" dark="#2A0F2D" light="#FF8466" />}
      />
    </>
  )
}
