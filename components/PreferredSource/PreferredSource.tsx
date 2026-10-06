import { SITE_DOMAIN } from '@/lib/site-url'

/** Google "preferred sources" opt-in link.
 *
 *  Google documents three implementations. The recommended one loads
 *  `news.google.com/swg/js/v1/publisher.js` and renders their own button. We
 *  use the documented no-JS deeplink instead, for two reasons:
 *
 *  1. It is a third-party script on every page load, which is exactly what
 *     this codebase avoids elsewhere (the embedded players are facades for the
 *     same reason). It would hand Google a request from every visitor before
 *     anyone has asked for anything.
 *  2. The button's only job is to open this URL. The script buys styling, not
 *     capability.
 *
 *  What it actually does: a reader who clicks it can mark 9cups as a preferred
 *  source, which makes 9cups content more prominent *for that reader* in Top
 *  Stories and can earn a "preferred" badge in AI Mode and AI Overviews. It is
 *  a per-user preference, not a ranking signal, and Google is explicit that it
 *  guarantees no placement. It also does nothing until the domain is indexed
 *  and appears in google.com/preferences/source.
 *
 *  Docs: https://developers.google.com/search/docs/appearance/preferred-sources
 */
export default function PreferredSource({ className }: { className?: string }) {
  return (
    <a
      className={className}
      href={`https://www.google.com/preferences/source?q=${encodeURIComponent(SITE_DOMAIN)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      Follow on Google
    </a>
  )
}
