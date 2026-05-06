'use client'

// Variant B — Press-play preview
// The album cover replaces the "Press Play to Enter" button; clicking it
// starts the onboarding sequence. A small headshot avatar sits next to the
// "DJ 9cups presents" eyebrow as a persistent identity mark.

import dynamic from 'next/dynamic'
import Image from 'next/image'
import HeroPage from '@/components/Hero/HeroPage'
import InlineCover from '@/components/ImageDemo/InlineCover'

const Terrain = dynamic(() => import('@/components/Terrain/Terrain'), { ssr: false })

export default function ImgBPage() {
  return (
    <>
      <a href="/" className="variant-pill">B · Press-play preview · back</a>
      <HeroPage
        Visualiser={Terrain}
        eyebrowAside={
          <Image
            src="/artist/maz-bw-portrait.webp"
            alt="DJ 9cups portrait"
            width={32}
            height={32}
            className="eyebrow-avatar"
          />
        }
        renderPressPlay={({ allLoaded, startPlayback }) => (
          <button
            type="button"
            className="cover-press-play"
            onClick={startPlayback}
            disabled={!allLoaded}
            aria-label="Press play"
          >
            <Image
              src="/covers/catching-a-feeling.webp"
              alt="Catching A Feeling — press to play"
              width={240}
              height={240}
              className="cover-press-play-img"
              priority
            />
            <span className="cover-press-play-glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="34" height="34">
                <polygon points="6,4 20,12 6,20" fill="currentColor" />
              </svg>
            </span>
            <span className="cover-press-play-caption">
              {allLoaded ? 'Press play' : 'Loading…'}
            </span>
          </button>
        )}
        trackTitleAside={<InlineCover size={88} />}
      />
    </>
  )
}
