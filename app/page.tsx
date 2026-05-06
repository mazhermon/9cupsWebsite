'use client'

import dynamic from 'next/dynamic'
import HeroPage from '@/components/Hero/HeroPage'

// R3F can't SSR — bail out. The HeroPage shell itself renders fine on the
// server; only the Terrain visualiser slot needs the no-SSR boundary.
const Terrain = dynamic(
  () => import('@/components/Terrain/Terrain'),
  { ssr: false },
)

export default function Home() {
  return <HeroPage Visualiser={Terrain} />
}
