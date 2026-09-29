'use client'

// Slim glyph-plot variant — ASCII frequency strip wired to MAIN + VOX
// only. Designed to sit above the wireframe terrain, sharing the same
// "lower-right visualiser zone". Drums + bass keep going to the mesh.
//
// Layout: 96 columns × 8 rows. Top 4 = main, bottom 4 = vox. Same 9-step
// density ramp as the original glyph-plot.

import { useEffect, useRef } from 'react'

const COLS = 96
const ROWS = 8
const RAMP = ' ·∙∘○●◆▰█'

interface GlyphStripProps {
  mainAnalyser: AnalyserNode | null
  voxAnalyser: AnalyserNode | null
  mainMuted: boolean
  voxMuted: boolean
  playing: boolean
}

export default function GlyphStrip({
  mainAnalyser, voxAnalyser, mainMuted, voxMuted, playing,
}: GlyphStripProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const bufsRef = useRef<{ main: Uint8Array | null; vox: Uint8Array | null }>({ main: null, vox: null })
  const gridRef = useRef<string[][]>(
    Array.from({ length: ROWS }, () => new Array(COLS).fill(' '))
  )

  useEffect(() => {
    let raf = 0
    let frame = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const pre = preRef.current
      if (!pre) return
      // Throttle: rebuild every other frame (30fps). The strip is fine at
      // half-rate visually and this cuts the per-frame cost roughly in half.
      if ((frame++ & 1) === 1) return

      const read = (
        a: AnalyserNode | null,
        muted: boolean,
        key: 'main' | 'vox',
      ): number[] => {
        if (!a || !playing || muted) return new Array<number>(COLS).fill(0)
        let buf = bufsRef.current[key]
        if (!buf || buf.length !== a.frequencyBinCount) {
          buf = new Uint8Array(a.frequencyBinCount)
          bufsRef.current[key] = buf
        }
        a.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
        const max = Math.floor(buf.length * 0.55)
        const slice = max / COLS
        const out = new Array<number>(COLS)
        for (let c = 0; c < COLS; c++) {
          const lo = Math.floor(c * slice)
          const hi = Math.min(buf.length, lo + Math.ceil(slice))
          let sum = 0
          for (let i = lo; i < hi; i++) sum += buf[i]
          out[c] = sum / Math.max(1, (hi - lo) * 255)
        }
        return out
      }

      const mainAmps = read(mainAnalyser, mainMuted, 'main')
      const voxAmps = read(voxAnalyser, voxMuted, 'vox')
      const half = ROWS / 2

      const grid = gridRef.current
      for (let r = 0; r < ROWS; r++) {
        const arr = r < half ? mainAmps : voxAmps
        const row = grid[r]
        for (let c = 0; c < COLS; c++) {
          const e = arr[c]
          const idx = Math.min(RAMP.length - 1, Math.max(0, Math.floor(e * RAMP.length)))
          row[c] = RAMP[idx]
        }
      }

      let out = ''
      for (let r = 0; r < ROWS; r++) {
        out += grid[r].join('')
        if (r < ROWS - 1) out += '\n'
      }
      pre.textContent = out
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mainAnalyser, voxAnalyser, mainMuted, voxMuted, playing])

  return (
    <pre ref={preRef} className="ha-strip" aria-hidden="true">
      {Array.from({ length: ROWS }).map(() => ' '.repeat(COLS)).join('\n')}
    </pre>
  )
}
