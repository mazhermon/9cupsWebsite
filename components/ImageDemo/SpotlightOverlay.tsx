'use client'

// Cursor-driven spotlight overlay for /img-c4-spotlight.
// The cover image is masked by a soft radial gradient centred on the
// cursor — so the cover only "reveals" where the cursor is. Move the cursor
// across the portrait, the cover follows. On mouse leave the spotlight
// drifts back to centre.
//
// CSS variables `--spot-x` / `--spot-y` are mutated on the wrapper in a
// `mousemove` listener; CSS reads them inside the mask-image gradient.

import { useEffect, useRef } from 'react'
import Image from 'next/image'

export default function SpotlightOverlay() {
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    // The portrait box is the parent — listen to its events so cursor
    // tracking covers the whole left column, not just the overlay rect.
    const target = el.parentElement ?? el

    const onMove = (e: MouseEvent) => {
      const rect = target.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      el.style.setProperty('--spot-x', `${x}%`)
      el.style.setProperty('--spot-y', `${y}%`)
    }
    const onLeave = () => {
      el.style.setProperty('--spot-x', `50%`)
      el.style.setProperty('--spot-y', `50%`)
    }
    target.addEventListener('mousemove', onMove)
    target.addEventListener('mouseleave', onLeave)
    return () => {
      target.removeEventListener('mousemove', onMove)
      target.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div ref={wrapRef} className="spotlight-overlay" aria-hidden="true">
      <Image
        src="/covers/catching-a-feeling.webp"
        alt=""
        fill
        sizes="50vw"
        className="spotlight-overlay-img"
      />
    </div>
  )
}
