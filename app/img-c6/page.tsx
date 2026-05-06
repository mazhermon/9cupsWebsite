'use client'

// Variant C6 — Duotone "earth": ground-dark → accent-organic.
// Pulls from the brand's secondary palette — the green/olive end. Earthy,
// natural, warmer than the purples. Tonally closer to the album cover's
// foliage than the portrait's portraiture vibe.

import EditorialHero from '@/components/ImageDemo/EditorialHero'
import DuotoneFilter from '@/components/ImageDemo/Duotone'

export default function ImgC6Page() {
  return (
    <>
      <a href="/" className="variant-pill">C6 · Duotone earth · back</a>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups"
        imageFilter="url(#duotone-c6) contrast(1.05) brightness(1.02)"
        svgFilters={<DuotoneFilter id="duotone-c6" dark="#0F1A12" light="#7A8A1A" />}
      />
    </>
  )
}
