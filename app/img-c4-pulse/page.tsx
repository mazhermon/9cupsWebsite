'use client'

// /img-c4-pulse — C4 with audio-driven blend animation.
// - Bass low-band drives sustained overlay opacity (more bass = more cover)
// - Drum kick transients spike opacity briefly (lock to the beat)
// - Main mid energy modulates a CSS hue-rotate + saturate on the cover

import EditorialHero from '@/components/ImageDemo/EditorialHero'
import DuotoneFilter from '@/components/ImageDemo/Duotone'
import PulseOverlay from '@/components/ImageDemo/PulseOverlay'

export default function ImgC4PulsePage() {
  return (
    <>
      <a href="/" className="variant-pill">C4 · Audio pulse · back</a>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups · catching a feeling"
        imageFilter="url(#duotone-c4p) contrast(1.05)"
        svgFilters={<DuotoneFilter id="duotone-c4p" dark="#1F0F35" light="#A56AC9" />}
        overlaySlot={(ctx) => <PulseOverlay {...ctx} />}
      />
    </>
  )
}
