'use client'

import dynamic from 'next/dynamic'
import HeroPage from '@/components/Hero/HeroPage'

// Canvas2D doesn't strictly need ssr:false but keeping the boundary for
// consistency with vis-a / vis-b and to avoid the audio engine attempting
// to construct an AudioContext on the server.
const Canvas2DLandscape = dynamic(
  () => import('@/components/visualisers/Canvas2DLandscape'),
  { ssr: false },
)

export default function VisCPage() {
  return <HeroPage Visualiser={Canvas2DLandscape} variantLabel="C · Canvas2D" />
}
