'use client'

// Site navigation. The first persistent chrome on the site, so it has two jobs
// that pull against each other: stay legible over the home page's full-bleed
// video hero, and not dim that hero while doing it.
//
// Solution: transparent at the top of the page, fading in a scrim once you
// scroll. On routes without a hero it carries the scrim from the start.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { NAV_LINKS } from '@/lib/site-config'

export default function Nav() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // The home page is the only route with a hero behind the bar, so it is the
  // only one that starts transparent.
  const overHero = pathname === '/'

  useEffect(() => {
    if (!overHero) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [overHero])

  // Route change closes the menu. Without this, tapping a link on mobile
  // navigates and leaves the panel sitting open over the new page.
  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus() }
    }
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (!panelRef.current?.contains(t) && !toggleRef.current?.contains(t)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  const isCurrent = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="nav" data-solid={!overHero || scrolled} data-open={open}>
      <Link href="/" className="nav-brand" aria-label="9cups, home">9cups</Link>

      <button
        ref={toggleRef}
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="nav-panel"
        onClick={() => setOpen(o => !o)}
      >
        <span className="nav-toggle-bars" aria-hidden="true"><i /><i /><i /></span>
        {open ? 'Close' : 'Menu'}
      </button>

      <div className="nav-panel" id="nav-panel" ref={panelRef}>
        <nav aria-label="Main">
          <ul className="nav-list">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link"
                  aria-current={isCurrent(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
