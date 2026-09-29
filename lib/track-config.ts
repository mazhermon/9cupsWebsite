// Single source of truth for the home-page release. Swap one constant to feature a different track.

export type StemKey = 'bass' | 'drums' | 'main' | 'vox'

export interface Stem {
  key: StemKey
  url: string
  label: string
  /** CSS custom property name from globals.css */
  colorVar: string
  /** Resolved hex for SVG fills/strokes that can't read CSS vars */
  color: string
}

/** One outbound link. Used for streaming platforms, socials and press alike —
 *  they differ only by which group they sit in, not by shape. */
export interface LinkItem {
  name: string
  href: string
  /** Optional short caption, e.g. the publication a review ran in. */
  note?: string
}

export interface LinkGroup {
  label: string
  items: LinkItem[]
}

export interface ReleaseConfig {
  title: string
  artist: string
  year: number
  stems: Stem[]
}

export const RELEASE: ReleaseConfig = {
  title: 'Catching A Feeling',
  artist: 'DJ 9cups',
  year: 2026,
  stems: [
    {
      key: 'bass',
      url: '/audio/9cupsCatchingAFeelingWeb_bass.mp3',
      label: 'Bass',
      colorVar: '--color-primary-dark',
      color: '#3B1A6E',
    },
    {
      key: 'drums',
      url: '/audio/9cupsCatchingAFeelingWeb_drums.mp3',
      label: 'Drums',
      colorVar: '--color-accent-warm',
      color: '#B03060',
    },
    {
      key: 'main',
      url: '/audio/9cupsCatchingAFeelingWeb_main.mp3',
      label: 'Main',
      colorVar: '--color-primary-mid',
      color: '#8B3AC4',
    },
    {
      key: 'vox',
      url: '/audio/9cupsCatchingAFeelingWeb_vox.mp3',
      label: 'Vox',
      colorVar: '--color-accent-vivid',
      color: '#CC2E90',
    },
  ],
}

// ─── Outbound links ──────────────────────────────────────────────────────────
// Artist-profile links, not per-release URLs: more durable, and per-release
// URLs don't exist for every platform. Source: the brand skill's
// "9cups links to socials and what not.xlsx".
//
// Deliberately absent, so these don't get re-litigated:
//   - Apple Music     — no URL exists yet. Omitted rather than shipped dead.
//   - bit.ly/m/9cups  — the old Bitly link-in-bio hub. This site replaces it;
//                       linking there would send visitors in a circle.
// The Spotify URL is the clean artist link: the spreadsheet's copy carried a
// `?si=` share-tracking param from one old share, which is stripped here.

export const LISTEN_LINKS: LinkItem[] = [
  { name: 'Spotify',    href: 'https://open.spotify.com/artist/1VExMsPShzwuXk7zMDHbDJ' },
  { name: 'Bandcamp',   href: 'https://9cups.bandcamp.com/' },
  { name: 'SoundCloud', href: 'https://soundcloud.com/dj9cups' },
  { name: 'YouTube',    href: 'https://www.youtube.com/@DJ9Cups' },
  { name: 'Tidal',      href: 'https://tidal.com/artist/55881504' },
]

export const FOLLOW_LINKS: LinkItem[] = [
  { name: 'Instagram', href: 'https://www.instagram.com/dj9cups' },
  { name: 'TikTok',    href: 'https://www.tiktok.com/@dj9cups' },
]

export const PRESS_LINKS: LinkItem[] = [
  {
    name: 'Tee Time 9pm',
    href: 'https://www.emptyspaces.co.nz/9cups-tee-time-9pm/',
    note: 'Empty Spaces',
  },
]

/** Grouped view for the landing page. The arrays above stay individually
 *  exported so consumers that want one group (e.g. the mixer's listen row)
 *  don't have to search this list by label. */
export const LINK_GROUPS: LinkGroup[] = [
  { label: 'Listen', items: LISTEN_LINKS },
  { label: 'Follow', items: FOLLOW_LINKS },
  { label: 'Press',  items: PRESS_LINKS  },
]

export const CONTACT_EMAIL = 'dj9cups@gmail.com'

/** Single summed mixdown of the four stems, for the landing page's play button.
 *  660KB vs 4.4MB of stems. Currently a 28-second loop — dropping a mastered
 *  full-length mp3 at this path needs no code change. */
export const LANDING_TRACK_URL = '/audio/9cupsCatchingAFeelingWeb_mix.mp3'
