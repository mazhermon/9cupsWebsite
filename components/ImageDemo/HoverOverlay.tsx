'use client'

// Pure-CSS hover overlay for /img-c4-hover.
// Cover sits at low opacity by default; on hover over the editorial portrait
// box, opacity ramps up + saturation increases over a soft 600ms ease-out.
// `pointer-events: none` so the cursor still hovers the underlying image.

import Image from 'next/image'

export default function HoverOverlay() {
  return (
    <div className="hover-overlay" aria-hidden="true">
      <Image
        src="/covers/catching-a-feeling.webp"
        alt=""
        fill
        sizes="50vw"
        className="hover-overlay-img"
      />
    </div>
  )
}
