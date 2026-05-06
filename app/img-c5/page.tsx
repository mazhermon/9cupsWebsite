'use client'

// Variant C5 — Duotone "electric": near-black navy → hot magenta-pink.
// Cool/electric vibe — punchier than C3, less brand-purple, more punk-club.

import EditorialHero from '@/components/ImageDemo/EditorialHero'
import DuotoneFilter from '@/components/ImageDemo/Duotone'

export default function ImgC5Page() {
  return (
    <>
      <a href="/" className="variant-pill">C5 · Duotone navy/pink · back</a>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups"
        imageFilter="url(#duotone-c5) contrast(1.08)"
        svgFilters={<DuotoneFilter id="duotone-c5" dark="#0F1A3D" light="#FF1F8E" />}
      />
    </>
  )
}
