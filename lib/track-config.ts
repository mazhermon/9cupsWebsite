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

export interface PlatformLink {
  name: string
  href: string
  /** Optional inline svg path; if omitted, no glyph is shown */
  glyph?: string
}

export interface ReleaseConfig {
  title: string
  artist: string
  year: number
  stems: Stem[]
  platforms: PlatformLink[]
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
  // TODO: replace # with real platform URLs for "Catching A Feeling"
  platforms: [
    { name: 'Spotify',       href: '#' },
    { name: 'Apple Music',   href: '#' },
    { name: 'Bandcamp',      href: '#' },
    { name: 'SoundCloud',    href: '#' },
    { name: 'YouTube Music', href: '#' },
  ],
}
