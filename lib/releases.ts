// Mixes and originals.
//
// HOW TO ADD ONE
// --------------
// Every platform gives you an embed snippet containing an <iframe src="...">.
// Copy that src verbatim into `embedUrl`. That way any platform works without
// this file needing to know how each one builds its URLs.
//
//   SoundCloud  Share > Embed > copy the src from the snippet
//   Bandcamp    Share/Embed > Embed this album > copy the src
//   Mixcloud    Share > Embed > copy the src
//
// `href` is the ordinary public page — used for the "open on <platform>" link
// and as the fallback if someone blocks third-party iframes.

export type EmbedSource = 'soundcloud' | 'bandcamp' | 'mixcloud'

export interface Release {
  /** Stable slug, used as the React key and the DOM id. */
  id: string
  title: string
  /** ISO date, e.g. '2026-08-14'. Rendered as a readable date and in <time>. */
  date: string
  source: EmbedSource
  /** The `src` from the platform's embed snippet. */
  embedUrl: string
  /** The normal public URL for this item. */
  href: string
  /** Optional artwork in /public. Without it the card falls back to a
   *  typographic tile rather than a broken image. */
  artwork?: string
  /** One or two sentences. Optional. */
  blurb?: string
}

export const SOURCE_LABEL: Record<EmbedSource, string> = {
  soundcloud: 'SoundCloud',
  bandcamp: 'Bandcamp',
  mixcloud: 'Mixcloud',
}

/** DJ mixes and radio shows. */
export const MIXES: Release[] = [
  // Example of the shape — delete this comment and add real entries:
  // {
  //   id: 'tee-time-9pm',
  //   title: 'Tee Time 9pm',
  //   date: '2026-05-15',
  //   source: 'soundcloud',
  //   embedUrl: 'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/000000000',
  //   href: 'https://soundcloud.com/dj9cups/tee-time-9pm',
  //   artwork: '/covers/tee-time-9pm.webp',
  //   blurb: 'Two hours of garage and bassline, recorded live.',
  // },
]

/** 9cups originals and releases. */
export const ORIGINALS: Release[] = [
  // Same shape as MIXES.
]
