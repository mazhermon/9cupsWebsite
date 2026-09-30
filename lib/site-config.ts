// Site-wide navigation and page-level content that isn't tied to one release.
// Release data (stems, links, the landing track) lives in track-config.ts.

export interface NavLink {
  href: string
  label: string
}

export const NAV_LINKS: NavLink[] = [
  { href: '/',          label: 'Home' },
  { href: '/mixes',     label: 'Mixes' },
  { href: '/originals', label: 'Originals' },
  { href: '/mixer',     label: 'Mixer' },
  { href: '/about',     label: 'About' },
]

/** Press pack. Hosted off-site so it can be updated without a deploy.
 *  TODO: replace with the real Drive/Dropbox share URL. */
export const PRESS_PACK_URL = ''
