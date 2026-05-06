'use client'

// Variant C — Editorial split (BW portrait, no filter)

import EditorialHero from '@/components/ImageDemo/EditorialHero'

export default function ImgCPage() {
  return (
    <>
      <a href="/" className="variant-pill">C · Editorial · back</a>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups"
      />
    </>
  )
}
