'use client'

// Variant C3 — Editorial split with a duotone'd portrait.
// Brand palette: primary-dark → accent-vivid (purple → magenta).

import EditorialHero from '@/components/ImageDemo/EditorialHero'
import DuotoneFilter from '@/components/ImageDemo/Duotone'

export default function ImgC3Page() {
  return (
    <>
      <a href="/" className="variant-pill">C3 · Duotone purple/magenta · back</a>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups"
        imageFilter="url(#duotone-c3) contrast(1.05) brightness(1.02)"
        svgFilters={<DuotoneFilter id="duotone-c3" dark="#3B1A6E" light="#CC2E90" />}
      />
    </>
  )
}
