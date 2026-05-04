'use client'

import { forwardRef, type ReactNode } from 'react'
import type { StemKey } from '@/lib/track-config'

interface CellProps {
  stemKey: StemKey
  label: string
  color: string
  muted: boolean
  loaded: boolean
  onToggle: () => void
  /** Children render INSIDE the cell, behind the label, with pointer-events: none. */
  children?: ReactNode
}

const Cell = forwardRef<HTMLButtonElement, CellProps>(function Cell(
  { stemKey, label, color, muted, loaded, onToggle, children },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`cell cell--${stemKey}`}
      onClick={onToggle}
      disabled={!loaded}
      data-muted={muted}
      aria-label={`${label} stem: ${muted ? 'unmute' : 'mute'}`}
      aria-pressed={muted}
      style={{ '--shape-color': color } as React.CSSProperties}
    >
      {children}
      <span className="cell-label" aria-hidden="true">
        {label}
        {muted && <span className="muted-suffix">muted</span>}
      </span>
    </button>
  )
})

export default Cell
