import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import LinkGroups from '@/components/Landing/LinkGroups'
import { LINK_GROUPS } from '@/lib/track-config'
import type { LinkGroup } from '@/lib/track-config'

// Small fixture, independent of the real data, so this suite doesn't churn
// whenever links.ts changes.
const FIXTURE_GROUPS: LinkGroup[] = [
  {
    label: 'Listen',
    items: [
      { name: 'Spotify', href: 'https://example.com/spotify' },
      { name: 'Bandcamp', href: 'https://example.com/bandcamp' },
    ],
  },
  {
    label: 'Press',
    items: [
      { name: 'Some Blog', href: 'https://example.com/blog', note: 'Empty Spaces' },
    ],
  },
]

describe('LinkGroups', () => {
  it('renders one nav per group and one row per item', () => {
    render(<LinkGroups groups={FIXTURE_GROUPS} />)

    const navs = screen.getAllByRole('navigation')
    expect(navs).toHaveLength(FIXTURE_GROUPS.length)

    const listenNav = screen.getByRole('navigation', { name: 'Listen' })
    expect(within(listenNav).getAllByRole('link')).toHaveLength(2)

    const pressNav = screen.getByRole('navigation', { name: 'Press' })
    expect(within(pressNav).getAllByRole('link')).toHaveLength(1)
  })

  it('gives every anchor the correct href, target and rel (security regression guard)', () => {
    render(<LinkGroups groups={FIXTURE_GROUPS} />)

    const spotify = screen.getByRole('link', { name: /spotify/i })
    expect(spotify).toHaveAttribute('href', 'https://example.com/spotify')
    expect(spotify).toHaveAttribute('target', '_blank')
    const rel = spotify.getAttribute('rel') ?? ''
    expect(rel).toContain('noreferrer')
    expect(rel).toContain('noopener')
  })

  it('labels each nav by its own visible heading via aria-labelledby matching the h2 id', () => {
    render(<LinkGroups groups={FIXTURE_GROUPS} />)

    for (const group of FIXTURE_GROUPS) {
      const heading = screen.getByRole('heading', { level: 2, name: group.label })
      const nav = heading.closest('nav')
      expect(nav).not.toBeNull()
      expect(nav).toHaveAttribute('aria-labelledby', heading.id)
      expect(heading.id).toBeTruthy()
    }
  })

  it('renders the h2 text as the group label', () => {
    render(<LinkGroups groups={FIXTURE_GROUPS} />)

    expect(screen.getByRole('heading', { level: 2, name: 'Listen' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Press' })).toBeInTheDocument()
  })

  it('renders an item note when present and omits it when absent', () => {
    render(<LinkGroups groups={FIXTURE_GROUPS} />)

    // Press item has a note.
    expect(screen.getByText('Empty Spaces')).toBeInTheDocument()

    // Listen items have no note.
    const spotify = screen.getByRole('link', { name: /spotify/i })
    expect(spotify.querySelector('.linkrow-note')).toBeNull()
  })

  it('renders the real LINK_GROUPS with target and rel set on every anchor', () => {
    render(<LinkGroups groups={LINK_GROUPS} />)

    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      const rel = link.getAttribute('rel') ?? ''
      expect(rel).toContain('noreferrer')
      expect(rel).toContain('noopener')
      expect(link.getAttribute('href')).toBeTruthy()
    }
  })
})
