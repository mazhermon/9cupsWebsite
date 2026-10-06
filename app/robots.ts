import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

/** `/explore` and `/review` are kept in the repo deliberately but are not
 *  public surfaces: /review is a dev route index and /explore holds unfinished
 *  visualiser experiments. They are blocked here AND carry `noindex` on the
 *  pages themselves, because robots.txt only stops crawling — a URL that is
 *  linked from elsewhere can still be indexed from the link alone, and a
 *  disallowed page can never be crawled to discover its noindex. The two
 *  controls do different jobs, so both are needed. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/explore', '/explore/', '/review'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
