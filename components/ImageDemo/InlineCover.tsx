'use client'

// Small album-cover thumbnail — used as the `trackTitleAside` slot in several
// image variants so the cover appears next to the track title once playback
// starts.

import Image from 'next/image'

interface InlineCoverProps {
  size?: number
}

export default function InlineCover({ size = 88 }: InlineCoverProps) {
  return (
    <Image
      src="/covers/catching-a-feeling.webp"
      alt="Catching A Feeling album cover"
      width={size}
      height={size}
      className="inline-cover"
    />
  )
}
