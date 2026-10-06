import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

/** Public routes only. `/explore` and `/review` are omitted on purpose — see
 *  app/robots.ts.
 *
 *  This is the single-surface site as it stands on `main`. When the content
 *  pages land (/mixes, /originals, /about, /stems) they each need an entry
 *  here, or they will be discovered only by crawling the nav. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/mixer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}
