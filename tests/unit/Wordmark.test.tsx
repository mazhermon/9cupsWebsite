import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Wordmark from '@/components/Wordmark/Wordmark'

describe('Wordmark', () => {
  it('renders an h1 by default', () => {
    render(<Wordmark playing={false} />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.tagName).toBe('H1')
  })

  it('renders an h2 when level={2} (page-level heading regression guard)', () => {
    render(<Wordmark playing={false} level={2} />)

    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading.tagName).toBe('H2')
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
  })

  it('renders the eyebrow when passed', () => {
    render(<Wordmark playing={false} eyebrow="New release" />)

    expect(screen.getByText('New release')).toBeInTheDocument()
  })

  it('omits the eyebrow when not passed', () => {
    const { container } = render(<Wordmark playing={false} />)

    expect(container.querySelector('.wordmark-eyebrow')).toBeNull()
  })

  it('shows the visible word "9cups"', () => {
    render(<Wordmark playing={false} />)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading.querySelector('.wordmark-main')).toHaveTextContent('9cups')
  })

  it('hides the three ghost copies from the accessible name, so it is not "9cups" repeated', () => {
    render(<Wordmark playing={false} />)

    const heading = screen.getByRole('heading', { level: 1 })

    // The three decorative ghosts must be aria-hidden.
    const ghosts = heading.querySelectorAll('.wordmark-ghost')
    expect(ghosts).toHaveLength(3)
    for (const ghost of ghosts) {
      expect(ghost).toHaveAttribute('aria-hidden', 'true')
    }

    // Accessible name only picks up the one visible "9cups", not four copies.
    expect(heading).toHaveAccessibleName('9cups')
  })
})
