'use client'

// /img-c4-spotlight — C4 with a cursor-tracked radial reveal.
// Cover only shows where the cursor is via a soft circular mask. Move the
// cursor over the portrait, the cover follows. Mouse leave drifts the
// spotlight back to centre.

import EditorialHero from '@/components/ImageDemo/EditorialHero'
import DuotoneFilter from '@/components/ImageDemo/Duotone'
import SpotlightOverlay from '@/components/ImageDemo/SpotlightOverlay'

export default function ImgC4SpotlightPage() {
  return (
    <>
      <a href="/" className="variant-pill">C4 · Spotlight · back</a>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups · catching a feeling"
        imageFilter="url(#duotone-c4s) contrast(1.05)"
        svgFilters={<DuotoneFilter id="duotone-c4s" dark="#1F0F35" light="#A56AC9" />}
        overlaySlot={() => <SpotlightOverlay />}
      />
    </>
  )
}
