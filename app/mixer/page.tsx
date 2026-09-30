'use client'

// 9cups · Catching A Feeling — the stem mixer.
//
// This was the home page until 2026-09-29, when / became a lighter landing
// page and the mixer moved here. The composition is unchanged: the picked
// editorial split (left = duotone'd portrait with the album cover blended
// over it, right = wordmark + stem toggles + terrain + listen-on). The cover
// sits at full blend by default; hovering the portrait pulls it back to
// reveal the artist underneath.

import Link from 'next/link'
import EditorialHero from '@/components/ImageDemo/EditorialHero'
import HoverOverlay from '@/components/ImageDemo/HoverOverlay'

export default function MixerPage() {
  return (
    <>
      <EditorialHero
        // The portrait column is the looping haze video now — 9cups is in the
        // footage, so the still photo would be saying the same thing twice.
        // The album-cover blend (the dappled light) stays on top of it.
        videoName="haze"
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups · catching a feeling"
        overlaySlot={() => <HoverOverlay />}
      />
      <Link href="/" className="mixer-back">
        <span aria-hidden="true">&larr;</span> 9cups
      </Link>
    </>
  )
}
