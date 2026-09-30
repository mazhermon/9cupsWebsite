import { describe, it, expect } from 'vitest'
import {
  LISTEN_LINKS,
  FOLLOW_LINKS,
  PRESS_LINKS,
  LINK_GROUPS,
  CONTACT_EMAIL,
  LANDING_TRACK_URL,
  RELEASE,
} from '@/lib/track-config'

const ALL_LINK_GROUPS = [
  { name: 'LISTEN_LINKS', items: LISTEN_LINKS },
  { name: 'FOLLOW_LINKS', items: FOLLOW_LINKS },
  { name: 'PRESS_LINKS', items: PRESS_LINKS },
]

describe('track-config links', () => {
  it('has no empty link groups (sanity check before deeper assertions)', () => {
    for (const { items } of ALL_LINK_GROUPS) {
      expect(items.length).toBeGreaterThan(0)
    }
  })

  for (const { name, items } of ALL_LINK_GROUPS) {
    it(`every href in ${name} is an absolute https:// URL, not a placeholder`, () => {
      for (const item of items) {
        expect(item.href).not.toBe('#')
        expect(item.href.startsWith('https://')).toBe(true)
        expect(() => new URL(item.href)).not.toThrow()
      }
    })

    it(`every link in ${name} has a non-empty name`, () => {
      for (const item of items) {
        expect(item.name.trim().length).toBeGreaterThan(0)
      }
    })
  }

  it('has unique hrefs across all link groups', () => {
    const allHrefs = ALL_LINK_GROUPS.flatMap((g) => g.items.map((i) => i.href))
    expect(new Set(allHrefs).size).toBe(allHrefs.length)
  })

  it('LINK_GROUPS contains exactly the three expected groups, in order', () => {
    expect(LINK_GROUPS.map((g) => g.label)).toEqual(['Listen', 'Follow', 'Press'])
    expect(LINK_GROUPS).toHaveLength(3)
  })

  it('LINK_GROUPS items are the same array references as the individual exports', () => {
    expect(LINK_GROUPS.find((g) => g.label === 'Listen')?.items).toBe(LISTEN_LINKS)
    expect(LINK_GROUPS.find((g) => g.label === 'Follow')?.items).toBe(FOLLOW_LINKS)
    expect(LINK_GROUPS.find((g) => g.label === 'Press')?.items).toBe(PRESS_LINKS)
  })
})

describe('CONTACT_EMAIL', () => {
  it('looks like an email address', () => {
    expect(CONTACT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })
})

describe('LANDING_TRACK_URL', () => {
  it('points at an mp3 file under /audio/', () => {
    expect(LANDING_TRACK_URL.startsWith('/audio/')).toBe(true)
    expect(LANDING_TRACK_URL.endsWith('.mp3')).toBe(true)
  })
})

describe('RELEASE.stems', () => {
  it('has exactly 4 stems', () => {
    expect(RELEASE.stems).toHaveLength(4)
  })

  it('has unique stem keys', () => {
    const keys = RELEASE.stems.map((s) => s.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('each stem has a url, label and hex color', () => {
    for (const stem of RELEASE.stems) {
      expect(stem.url.trim().length).toBeGreaterThan(0)
      expect(stem.label.trim().length).toBeGreaterThan(0)
      expect(stem.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})
