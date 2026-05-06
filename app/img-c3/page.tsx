'use client'

// Variant C3 — Editorial split with a duotone'd portrait.
//
// Colourisation via SVG `feColorMatrix`: each input pixel's luminance is used
// to interpolate between two brand colours.
//   black  → #3B1A6E (primary-dark)
//   white  → #CC2E90 (accent-vivid)
// Mid-tones bridge between, giving the photo a smooth purple-to-magenta
// gradient mapping that echoes the brand palette without recolouring the
// source.
//
// Math notes (precomputed coefficients in the matrix below):
//   Lr = 0.299 R + 0.587 G + 0.114 B (standard NTSC luminance)
//   Rout = darkR + Lr * (lightR - darkR), etc.
//
// Modern alternatives (left as comments for future tuning):
//   - background-blend-mode (multiply / screen / overlay) on a CSS gradient
//     layered over the image. Cheaper, less precise, harder to tune.
//   - CSS filter chain: `grayscale(1) sepia(1) hue-rotate() saturate()`. Gets
//     close but the hue/saturation never quite lands on a custom palette.

import EditorialHero from '@/components/ImageDemo/EditorialHero'

const Duotone9cupsFilter = () => (
  <svg
    width="0"
    height="0"
    aria-hidden="true"
    style={{ position: 'absolute', overflow: 'hidden' }}
  >
    <defs>
      <filter id="duotone-9cups" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="
            0.170 0.334 0.065 0 0.231
            0.023 0.046 0.009 0 0.102
            0.040 0.079 0.015 0 0.431
            0     0     0     1 0
          "
        />
      </filter>
    </defs>
  </svg>
)

export default function ImgC3Page() {
  return (
    <>
      <a href="/" className="variant-pill">C3 · Editorial duotone · back</a>
      <EditorialHero
        imageSrc="/artist/maz-bw-wide.webp"
        imageAlt="DJ 9cups"
        imageFilter="url(#duotone-9cups) contrast(1.1) brightness(1.05)"
        svgFilters={<Duotone9cupsFilter />}
      />
    </>
  )
}
