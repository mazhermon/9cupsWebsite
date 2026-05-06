'use client'

// /img-c4-hover — C4 with a CSS-only hover blend animation.
// Cover sits subtly at low opacity until the user hovers the portrait area;
// then it ramps up over 600ms ease-out and saturates. No JS, no rAF.

import EditorialHero from '@/components/ImageDemo/EditorialHero'
import DuotoneFilter from '@/components/ImageDemo/Duotone'
import HoverOverlay from '@/components/ImageDemo/HoverOverlay'

export default function ImgC4HoverPage() {
  return (
    <>
      <a href="/" className="variant-pill">C4 · Hover blend · back</a>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups · catching a feeling"
        imageFilter="url(#duotone-c4h) contrast(1.05)"
        svgFilters={<DuotoneFilter id="duotone-c4h" dark="#1F0F35" light="#A56AC9" />}
        overlaySlot={() => <HoverOverlay />}
      />
    </>
  )
}
