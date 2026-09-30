import type { Metadata } from 'next'
import ReleaseList from '@/components/ReleaseList/ReleaseList'
import { MIXES } from '@/lib/releases'

export const metadata: Metadata = {
  title: 'Mixes · 9cups',
  description: 'DJ mixes and radio shows from 9cups. UK garage, bassline, 140 and house out of Wellington.',
}

export default function MixesPage() {
  return (
    <ReleaseList
      title="Mixes"
      lede="Long-form sets and radio shows. Players load when you press them, not before."
      releases={MIXES}
      emptyNote="No mixes up yet. They land here as they go out."
    />
  )
}
