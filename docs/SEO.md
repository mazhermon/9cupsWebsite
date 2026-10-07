# SEO

What is implemented, the conventions to follow, and the work `content-pages`
still needs. Written 2026-10-07.

## The domain

**`9cups.mazhermon.com`**, a subdomain of an already-owned apex, chosen over a
dedicated domain to avoid a second registration fee.

The usual objection to subdomains is that Google treats them as semi-separate
sites, so they inherit less authority than a subdirectory would. That only
matters if the parent has authority to inherit; `mazhermon.com` has no
significant ranking history, so there is nothing to inherit either way and the
cost is theoretical. Identity here is established by the `sameAs` entity graph
(see below), which works identically on any hostname.

The real costs are brand, not search: it is long to say and type, it puts a
second name in the artist's URL, and it reads as a side project rather than an
artist's home. Accepted deliberately. If 9cups outgrows it, buy the domain
then and 301 everything; the longer that is left, the more indexing history
has to be carried across.

`PRODUCTION_ORIGIN` in `lib/site-url.ts` is the single source of truth. It is
hardcoded rather than env-only on purpose: a missing env var that falls back to
localhost would publish `<link rel="canonical" href="http://localhost:3000">`
on the live site. `NEXT_PUBLIC_SITE_URL` overrides it for staging.

Vercel preview deploys resolve to the production origin rather than their own
generated URL, so a preview cannot be indexed as a duplicate.

## What is implemented on `main`

| Thing | Where |
|---|---|
| `metadataBase`, canonical, title template | `app/layout.tsx` |
| Open Graph + Twitter card, 1200x630 image | `app/layout.tsx`, `public/og.png` |
| JSON-LD entity graph | `components/StructuredData/StructuredData.tsx` |
| robots.txt | `app/robots.ts` |
| sitemap.xml | `app/sitemap.ts` |
| Favicon set + web manifest | `app/favicon.ico`, `public/` |
| Google preferred-source opt-in | `components/PreferredSource/PreferredSource.tsx` |

### The entity graph is the important part

`MusicGroup` + `MusicRecording` + `WebSite`, with a `sameAs` array tying this
origin to the seven profiles that already exist (Bandcamp, SoundCloud,
YouTube, Tidal, Spotify, Instagram, TikTok).

A new domain has no claim on the name "9cups" on its own, and the term competes
with the tarot card. `sameAs` is what lets search engines and AI answer engines
resolve this site as the same entity as the profiles that already rank. It is
worth more than every meta tag combined.

`sameAs` means "this is the same entity", so it carries 9cups' own profiles
only. Press coverage is third-party and belongs in `PRESS_LINKS`, not here.

## Conventions

- **One source of truth for the origin.** Import `SITE_URL` from
  `lib/site-url.ts`. Never write the hostname into a component.
- **Accent rationing applies to SEO affordances too.** The preferred-source
  link is the quietest thing in the landing foot, because Bookings is the real
  call to action there.
- **No third-party script for an SEO feature.** The preferred-source button
  uses Google's documented plain-link deeplink, not their `publisher.js`
  button, for the same reason the embedded players are facades.
- **Every new public route needs a sitemap entry.** `app/sitemap.ts` is a hand
  maintained list, not a crawl. A route missing from it is discoverable only by
  following the nav.
- **Non-public routes need both controls.** `/explore` and `/review` carry a
  robots.txt `Disallow` *and* a `noindex` meta. They do different jobs:
  robots.txt stops crawling but not indexing from inbound links, and a
  disallowed page can never be crawled to discover its noindex.

## Work `content-pages` needs before it merges

The SEO foundations on `main` are site-wide and will merge cleanly, since
`content-pages` does not touch `app/layout.tsx` metadata, `lib/site-url.ts`,
`app/robots.ts` or `app/sitemap.ts`. What that branch adds is four new
indexable routes, and routes need per-page work.

### 1. Sitemap entries (required, trivial)

`app/sitemap.ts` currently lists `/` and `/mixer`. On that branch it must
become `/`, `/stems`, `/mixes`, `/originals`, `/about`. Drop `/mixer`: it is a
308 redirect there, and listing a redirect in a sitemap is a crawl error.

`/todo` must never appear. It is gated on `NINECUPS_PRIVATE` and 404s in
production, but it should also carry a `noindex` for the same belt-and-braces
reason as `/explore`.

### 2. Per-page metadata (required)

Every route needs its own `title` and `description`. The root layout sets a
title template, so a page exports the short form and the brand is appended:

```ts
export const metadata: Metadata = {
  title: 'About',                      // renders "About · 9cups"
  description: '...',
  alternates: { canonical: '/about' }, // required, or every page
}                                      // canonicalises to the homepage
```

The `alternates.canonical` line is the one that is easy to forget and most
damaging to omit: without it, inner pages inherit the layout's `canonical: '/'`
and tell Google they are all duplicates of the homepage.

Suggested angles, keeping the terms real people search:

| Route | Title | Carries |
|---|---|---|
| `/about` | `About` | The only page with room for real prose. Wellington, Aotearoa, UK Garage, bassline, 140, house, DJ, beat maker. |
| `/mixes` | `DJ Mixes` | Genre and setting per mix. |
| `/originals` | `Original Tracks` | Release names and years. |
| `/stems` | `Stem Player` | What it is, in words, for a crawler that cannot run the audio. |

### 3. Schema for the content pages (high value, not required for launch)

- `/about` deserves the `MusicGroup` node moved or extended onto it, since that
  is where the biography will live.
- `/mixes` and `/originals`: each entry is a `MusicRecording`, and the list is
  an `ItemList`. Worth doing once `MIXES` and `ORIGINALS` in `lib/releases.ts`
  have real entries. Pointless while both are empty.
- Any gig listed on `/about` is a schema.org `Event` with `location` and
  `startDate`. This is the single best way to appear for "9cups wellington" and
  for event queries, and it is the one structured-data type on this site that
  can produce a rich result.

### 4. The actual content problem

This is the part no markup fixes. `main` serves roughly 400 characters of body
text; the page is canvas, audio and image by design. That is a good design
decision and a bad crawling one.

`/about` is the only surface on either branch with room for prose, and it is
currently blocked on the artist for a biography. Until that copy exists, the
site can rank for brand queries ("9cups", "dj 9cups", "9cups wellington") and
will not rank for category queries ("dj nz", "ukg nz"), which are dominated by
directories, listings and Wikipedia.

Do not write that biography to fill the gap. `docs/STATE.md` records the
standing rule: the artist supplies content, and the About page asserts no
venue, label, year or collaborator because none of it is verifiable from this
repo.

## Off-site, and more important than any of the above

Not code, and the highest-impact item available:

1. **Put the URL in every profile bio** — Bandcamp, SoundCloud, Spotify,
   YouTube, Instagram, TikTok. `sameAs` claims the relationship from this side;
   those links confirm it from the other. A new domain with neither is
   effectively invisible.
2. **Google Search Console.** Verify, submit `/sitemap.xml`, request indexing
   of the homepage. Bing Webmaster Tools takes the same sitemap.
3. The preferred-source link does nothing until the domain is indexed and
   appears in `google.com/preferences/source`, and its value depends on
   publishing regularly. Expect it to sit quiet on a static brand site.
