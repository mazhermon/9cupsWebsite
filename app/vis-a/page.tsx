'use client'

import dynamic from 'next/dynamic'
import HeroPage from '@/components/Hero/HeroPage'

// R3F can't SSR — bail out. The HeroPage itself is fine to render on the
// server; only the visualiser slot needs the no-SSR boundary.
const UnifiedTerrain = dynamic(
  () => import('@/components/visualisers/UnifiedTerrain'),
  { ssr: false },
)

export default function VisAPage() {
  return <HeroPage Visualiser={UnifiedTerrain} variantLabel="A · Unified terrain" />
}
