import type { Metadata } from 'next'
import { Recursive } from 'next/font/google'
import './explore.css'

// Recursive is variable: wght by default, plus CASL / slnt / MONO / CRSV axes.
// LivingType uses wght + CASL + slnt.
const recursive = Recursive({
  subsets: ['latin'],
  axes: ['CASL', 'CRSV', 'MONO', 'slnt'],
  display: 'swap',
  variable: '--font-recursive',
})

export const metadata: Metadata = {
  title: 'Explore · 9cups visualiser directions',
  description:
    'Prototype directions for the 9cups audio visualiser inspired by brik.space — text effects, generative grids, glyph plots, and dynamic brand toolkits.',
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <div className={recursive.variable}>{children}</div>
}
