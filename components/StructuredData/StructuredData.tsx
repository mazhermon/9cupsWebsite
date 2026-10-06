// JSON-LD for the 9cups entity.
//
// Why this matters more than the meta tags: search engines and AI answer
// engines resolve "who is 9cups" by matching an entity across sources. The
// `sameAs` array is the join — it ties this domain to the Spotify, Bandcamp,
// SoundCloud, YouTube, Tidal, Instagram and TikTok profiles that already
// exist, so the site is read as the artist's own home rather than as an
// unrelated page that mentions them. Without it a brand-new domain has no
// claim on the name at all.
//
// Genre and location are stated explicitly because the page itself is almost
// entirely canvas, audio and image: there is very little body text for a
// crawler to infer either from.

import { RELEASE, LISTEN_LINKS, FOLLOW_LINKS, CONTACT_EMAIL } from '@/lib/track-config'
import { SITE_URL } from '@/lib/site-url'

/** Every profile that is demonstrably the same artist. Press links are
 *  deliberately excluded: they are third-party coverage, not 9cups' own
 *  profiles, and sameAs means "this is the same entity". */
const SAME_AS = [...LISTEN_LINKS, ...FOLLOW_LINKS].map(l => l.href)

const ARTIST_ID = `${SITE_URL}/#artist`

const graph = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MusicGroup',
      '@id': ARTIST_ID,
      name: '9cups',
      alternateName: ['DJ 9cups', 'DJ 9Cups', '9 Cups'],
      url: SITE_URL,
      image: `${SITE_URL}/og.png`,
      email: CONTACT_EMAIL,
      description:
        'DJ and beat maker from Wellington, Aotearoa New Zealand, playing UK Garage, bassline, 140 and house.',
      genre: ['UK Garage', 'Bassline', 'House', '140', 'Electronic'],
      foundingLocation: {
        '@type': 'Place',
        name: 'Wellington, Aotearoa New Zealand',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Wellington',
          addressCountry: 'NZ',
        },
      },
      sameAs: SAME_AS,
    },
    {
      '@type': 'MusicRecording',
      '@id': `${SITE_URL}/#catching-a-feeling`,
      name: RELEASE.title,
      byArtist: { '@id': ARTIST_ID },
      datePublished: String(RELEASE.year),
      genre: ['UK Garage', 'Bassline', 'House'],
      url: SITE_URL,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: '9cups',
      inLanguage: 'en-NZ',
      publisher: { '@id': ARTIST_ID },
    },
  ],
}

export default function StructuredData() {
  return (
    <script
      type="application/ld+json"
      // Escaping `<` stops a value that happened to contain "</script>" from
      // closing the tag early. Everything here is static today, but the data
      // comes from track-config, which is edited per release.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, '\\u003c'),
      }}
    />
  )
}
