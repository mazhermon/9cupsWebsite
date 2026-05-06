'use client'

// Variant C4 — Mixed: BW portrait under, album cover overlaid via
// mix-blend-mode. The portrait provides the human silhouette; the cover's
// leafy purple texture blends in for the colour and atmosphere. The portrait
// gets a soft brand-purple duotone underneath so the blend has more colour
// to chew on (pure BW + overlay tends to read as muddy).

import EditorialHero from '@/components/ImageDemo/EditorialHero'
import DuotoneFilter from '@/components/ImageDemo/Duotone'

export default function ImgC4Page() {
  return (
    <>
      <a href="/" className="variant-pill">C4 · Mixed (portrait × cover) · back</a>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups · catching a feeling"
        imageFilter="url(#duotone-c4-base) contrast(1.05)"
        svgFilters={<DuotoneFilter id="duotone-c4-base" dark="#1F0F35" light="#A56AC9" />}
        overlayImageSrc="/covers/catching-a-feeling.webp"
        overlayBlendMode="overlay"
        overlayOpacity={0.65}
      />
    </>
  )
}
