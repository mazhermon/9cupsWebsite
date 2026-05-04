'use client'

import dynamic from 'next/dynamic'
import HeroPage from '@/components/Hero/HeroPage'

const HudMeters3D = dynamic(
  () => import('@/components/visualisers/HudMeters3D'),
  { ssr: false },
)

export default function VisBPage() {
  return <HeroPage Visualiser={HudMeters3D} variantLabel="B · HUD meters + 3D" />
}
