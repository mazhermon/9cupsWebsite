import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayControl from '@/components/PlayControl/PlayControl'

describe('PlayControl', () => {
  it('shows a Play label and aria-pressed=false when not playing', () => {
    render(<PlayControl isPlaying={false} onToggle={vi.fn()} />)

    const btn = screen.getByRole('button', { name: 'Play' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows a Pause label and aria-pressed=true when playing', () => {
    render(<PlayControl isPlaying={true} onToggle={vi.fn()} />)

    const btn = screen.getByRole('button', { name: 'Pause' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onToggle exactly once per click', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<PlayControl isPlaying={false} onToggle={onToggle} />)

    await user.click(screen.getByRole('button', { name: 'Play' }))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('defaults the hint to "Tap shapes to mute" when not passed', () => {
    render(<PlayControl isPlaying={false} onToggle={vi.fn()} />)

    expect(screen.getByText('Tap shapes to mute')).toBeInTheDocument()
  })

  it('renders a custom hint when passed', () => {
    render(<PlayControl isPlaying={false} onToggle={vi.fn()} hint="Custom hint" />)

    expect(screen.getByText('Custom hint')).toBeInTheDocument()
    expect(screen.queryByText('Tap shapes to mute')).not.toBeInTheDocument()
  })

  it('renders no hint when hint is null', () => {
    const { container } = render(<PlayControl isPlaying={false} onToggle={vi.fn()} hint={null} />)

    expect(container.querySelector('.play-hint')).toBeNull()
  })

  it('disables the button and prevents onToggle firing on click when disabled', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    render(<PlayControl isPlaying={false} onToggle={onToggle} disabled />)

    const btn = screen.getByRole('button', { name: 'Play' })
    expect(btn).toBeDisabled()

    await user.click(btn)

    expect(onToggle).not.toHaveBeenCalled()
  })

  it('reads "Playing" in the live region when isPlaying is true', () => {
    const { container } = render(<PlayControl isPlaying={true} onToggle={vi.fn()} />)

    const live = container.querySelector('[aria-live="polite"]')
    expect(live).not.toBeNull()
    expect(live).toHaveTextContent('Playing')
  })

  it('reads "Paused" in the live region when isPlaying is false', () => {
    const { container } = render(<PlayControl isPlaying={false} onToggle={vi.fn()} />)

    const live = container.querySelector('[aria-live="polite"]')
    expect(live).not.toBeNull()
    expect(live).toHaveTextContent('Paused')
  })

  it('applies a custom className alongside the base class on the wrapper', () => {
    const { container } = render(
      <PlayControl isPlaying={false} onToggle={vi.fn()} className="my-extra" />
    )

    const wrapper = container.firstElementChild
    expect(wrapper).toHaveClass('play-control')
    expect(wrapper).toHaveClass('my-extra')
  })
})
