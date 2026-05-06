'use client'

// Variant C2 — Editorial split with the album cover instead of the portrait.
// Cover is square (1200×1200); object-fit:cover crops to fill the tall left
// column. The cover's leafy abstract content tolerates the crop well.

import EditorialHero from '@/components/ImageDemo/EditorialHero'

export default function ImgC2Page() {
  return (
    <>
      <a href="/" className="variant-pill">C2 · Editorial w/ cover · back</a>
      <EditorialHero
        imageSrc="/covers/catching-a-feeling.webp"
        imageAlt="Catching A Feeling album cover"
        imageObjectPosition="center center"
      />
    </>
  )
}
