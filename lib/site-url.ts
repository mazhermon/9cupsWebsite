/** The site's own origin, used for canonical URLs, Open Graph images, the
 *  sitemap and JSON-LD.
 *
 *  Absolute URLs are not optional for any of those: a relative og:image is
 *  ignored by every scraper, and a relative canonical is worse than none.
 *  Next needs `metadataBase` to resolve them, and it cannot infer the public
 *  hostname at build time.
 *
 *  Resolution order: NEXT_PUBLIC_SITE_URL, then localhost in development, then
 *  the hardcoded production origin below. Nothing else is needed — the site
 *  works with no environment configuration at all, and setting the variable is
 *  only required to point a deploy somewhere other than production.
 *
 *      NEXT_PUBLIC_SITE_URL=https://staging.example.com
 *
 *  The variable is deliberately NEXT_PUBLIC_. This module is imported by server
 *  code (metadata, robots, sitemap, JSON-LD) *and* by a client component (the
 *  preferred-source link inside the client-side Landing). Next only inlines
 *  NEXT_PUBLIC_-prefixed vars into the client bundle, so a bare server-only var
 *  would read correctly on the server and come back undefined in the browser:
 *  the two would render different hrefs and React would report a hydration
 *  mismatch.
 *
 *  Vercel preview deploys intentionally resolve to the production origin rather
 *  than their own generated URL, so a preview cannot be indexed as a duplicate
 *  of the live site.
 */
/** The intended production origin.
 *
 *  Hardcoded as the last resort rather than falling back to localhost, because
 *  the failure modes are not symmetrical: a missed env var that yields
 *  localhost puts `<link rel="canonical" href="http://localhost:3000">` on the
 *  live site and tells Google the canonical copy is unreachable. A hardcoded
 *  default is wrong only if the domain changes, which is a code change anyway.
 *
 *  Subdomain of an owned apex, chosen over a dedicated domain deliberately.
 *  See docs/SEO.md for the trade-off. */
const PRODUCTION_ORIGIN = 'https://9cups.mazhermon.com'

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  // Only development gets localhost, and only when nothing else is configured.
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000'

  return PRODUCTION_ORIGIN
}

export const SITE_URL = resolveSiteUrl()

/** Bare hostname, e.g. "9cups.mazhermon.com". Google's preferred-sources
 *  deeplink takes a domain rather than a full URL. */
export const SITE_DOMAIN = (() => {
  try {
    return new URL(SITE_URL).host
  } catch {
    return new URL(PRODUCTION_ORIGIN).host
  }
})()
