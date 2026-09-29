'use client'

// Prototype 3 — Glyph plot.
// Brik.space influence: "weird internet" + text-as-image. An 80-column
// monospace ASCII frequency plot. Each row band paints one stem; glyph
// density on a 9-step ramp encodes amplitude.
//
// Perf: one DOM node (a <pre>), textContent updated each frame.

import { useEffect, useRef } from 'react'
import ExploreShell, { type StageContext } from './ExploreShell'

const COLS = 80
const ROWS = 24
const RAMP = ' ·∙∘○●◆▰█' // 9 levels

// Row → stem index (analyser order: 0=bass, 1=drums, 2=main, 3=vox).
const STEM_PER_ROW = new Array(ROWS).fill(0).map((_, r) => {
  if (r < 4) return 1   // drums (rows 1–4)
  if (r < 10) return 2  // main  (rows 5–10)
  if (r < 14) return 0  // bass  (rows 11–14)
  return 3              // vox   (rows 15–24)
})

const TITLE = 'Glyph plot'
const BLURB =
  'An 80-column ASCII frequency plot. Row bands paint each stem; a 9-step density ramp encodes amplitude. Weird-internet energy that prints on a t-shirt — and would render as a 2 KB DOM element if shipped.'
const TAGS = ['text effects', 'generative', 'monospace']

export default function GlyphPlot() {
  return (
    <ExploreShell slug="glyph-plot" title={TITLE} blurb={BLURB} tags={TAGS}>
      {(ctx) => <Stage {...ctx} />}
    </ExploreShell>
  )
}

function Stage({ analysers, tracks, playing }: StageContext) {
  const preRef = useRef<HTMLPreElement>(null)
  const bufsRef = useRef<(Uint8Array | null)[]>([null, null, null, null])
  const gridRef = useRef<string[][]>(
    Array.from({ length: ROWS }, () => new Array(COLS).fill(' '))
  )

  useEffect(() => {
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const pre = preRef.current
      if (!pre) return

      const amps: number[][] = [[], [], [], []]
      for (let si = 0; si < 4; si++) {
        const a = analysers[si]
        const t = tracks[si]
        if (!a || !playing || t?.muted) {
          amps[si] = new Array(COLS).fill(0)
          continue
        }
        let buf = bufsRef.current[si]
        if (!buf || buf.length !== a.frequencyBinCount) {
          buf = new Uint8Array(a.frequencyBinCount)
          bufsRef.current[si] = buf
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
        amps[si] = out
      }

      const grid = gridRef.current
      for (let r = 0; r < ROWS; r++) {
        const arr = amps[STEM_PER_ROW[r]]
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
  }, [analysers, tracks, playing])

  return (
    <div className="gp-stage">
      <pre ref={preRef} className="gp-plot" aria-hidden>
        {Array.from({ length: ROWS }).map(() => ' '.repeat(COLS)).join('\n')}
      </pre>
      <ul className="gp-legend" aria-hidden>
        <li><b>rows 1–4</b><span>drums</span></li>
        <li><b>rows 5–10</b><span>main</span></li>
        <li><b>rows 11–14</b><span>bass</span></li>
        <li><b>rows 15–24</b><span>vox</span></li>
      </ul>
    </div>
  )
}
