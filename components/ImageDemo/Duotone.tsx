'use client'

// Duotone helpers — generate an SVG `feColorMatrix` filter that maps an
// input image's luminance to a custom 2-colour palette.
//
// Math:
//   L     = 0.299 R + 0.587 G + 0.114 B           (NTSC luminance)
//   out_c = darkC + L * (lightC - darkC)          (per channel, c ∈ {R,G,B})
//
// The matrix below interleaves the per-channel coefficients so a single
// `feColorMatrix` does the whole thing in one pass on the GPU.

function hexToRgb01(hex: string): [number, number, number] {
  const m = hex.replace('#', '')
  return [
    parseInt(m.slice(0, 2), 16) / 255,
    parseInt(m.slice(2, 4), 16) / 255,
    parseInt(m.slice(4, 6), 16) / 255,
  ]
}

function fmt(n: number) {
  // 4 decimal places is plenty — keeps the SVG attribute compact.
  return Number(n.toFixed(4)).toString()
}

export function duotoneMatrix(darkHex: string, lightHex: string): string {
  const [Dr, Dg, Db] = hexToRgb01(darkHex)
  const [Lr, Lg, Lb] = hexToRgb01(lightHex)
  const dr = Lr - Dr, dg = Lg - Dg, db = Lb - Db
  return [
    `${fmt(dr * 0.299)} ${fmt(dr * 0.587)} ${fmt(dr * 0.114)} 0 ${fmt(Dr)}`,
    `${fmt(dg * 0.299)} ${fmt(dg * 0.587)} ${fmt(dg * 0.114)} 0 ${fmt(Dg)}`,
    `${fmt(db * 0.299)} ${fmt(db * 0.587)} ${fmt(db * 0.114)} 0 ${fmt(Db)}`,
    `0 0 0 1 0`,
  ].join('\n')
}

interface DuotoneFilterProps {
  /** SVG `id` attribute — referenced from CSS via `filter: url(#…)` */
  id: string
  /** Hex colour mapped to source black. */
  dark: string
  /** Hex colour mapped to source white. */
  light: string
}

export default function DuotoneFilter({ id, dark, light }: DuotoneFilterProps) {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: 'absolute', overflow: 'hidden' }}
    >
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={duotoneMatrix(dark, light)} />
        </filter>
      </defs>
    </svg>
  )
}
