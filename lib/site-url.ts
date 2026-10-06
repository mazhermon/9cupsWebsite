/** The site's own origin, used for canonical URLs, Open Graph images, the
 *  sitemap and JSON-LD.
 *
 *  Absolute URLs are not optional for any of those: a relative og:image is
 *  ignored by every scraper, and a relative canonical is worse than none.
 *  Next needs `metadataBase` to resolve them, and it cannot infer the public
 *  hostname at build time.
 *
 *  Set NEXT_PUBLIC_SITE_URL in the production environment to the real origin,
 *  with no trailing slash:
 *
 *      NEXT_PUBLIC_SITE_URL=https://9cups.co.nz
 *
 *  On Vercel, NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL is set automatically to
 *  the project's production domain, so a deploy works before the custom domain
 *  is attached. The localhost fallback is last and is only right in
 *  development — if it ever reaches production, canonicals point at localhost,
 *  so prefer setting the variable explicitly.
 *
 *  Both variables are deliberately NEXT_PUBLIC_. This module is imported by
 *  server code (metadata, robots, sitemap, JSON-LD) *and* by a client
 *  component (the preferred-source link inside the client-side Landing). Next
 *  only inlines NEXT_PUBLIC_-prefixed vars into the client bundle, so a bare
 *  VERCEL_PROJECT_PRODUCTION_URL would read correctly on the server and come
 *  back undefined in the browser — the two would render different hrefs and
 *  React would report a hydration mismatch.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`

  return 'http://localhost:3000'
}

export const SITE_URL = resolveSiteUrl()

/** Bare hostname, e.g. "9cups.co.nz". Google's preferred-sources deeplink
 *  takes a domain rather than a full URL. */
export const SITE_DOMAIN = (() => {
  try {
    return new URL(SITE_URL).host
  } catch {
    return '9cups.co.nz'
  }
})()
