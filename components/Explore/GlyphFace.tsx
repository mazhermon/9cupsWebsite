'use client'

// Generic ASCII portrait — renders an image into a monospace text grid
// using <canvas> (not <pre>) so per-frame character animation is cheap.
//
// ─── How to swap the source image ─────────────────────────────────────────
//   <GlyphFace src="/artist/some-other-photo.webp" cropAnchorY={0.5} />
//
// Props:
//   src           — path to the image (anything <img> can load)
//   cropAnchorY   — 0..1 vertical bias of the centre-crop (0.35 = upper third)
//   cols / rows   — grid density
//   analysers/... — optional audio props. When provided + playing, the face
//                   sparkles characters in subject areas:
//                     vox energy → continuous sparkle baseline
//                     drums kick → burst of extra sparkles
//                   Each sparkle lives ~14 frames then restores to base.
//
// ─── Performance design ───────────────────────────────────────────────────
//   - <canvas> (NOT <pre>): no DOM text layout cost per redraw.
//   - Partial redraws only: per frame we clear + redraw maybe 30-80 cells
//     (the active sparkles + expiring ones). The static base remains
//     painted from the initial drawFull() call.
//   - rAF throttled to 30fps.
//   - DPR capped at 1.5 to keep fragment count down.
//
//   This replaces the previous `<pre>` + textContent approach, which forced
//   the browser to re-layout a multi-thousand-char text element every frame
//   and tanked fps to ~20.
//
// ─── If perf ever isn't enough ────────────────────────────────────────────
//   Move the per-frame work to a Web Worker via canvas.transferControlToOffscreen()
//   (OffscreenCanvas). Worker runs the rAF + canvas drawing, main thread
//   stays free. The component would then receive analyser snapshots via
//   postMessage. Not needed yet.

import { useEffect, useRef } from 'react'
import { bandEnergy, lerpToward } from '@/lib/audio-reactive'

const RAMP = ' .·:-=+*#'  // 9 chars, sparse → dense, no solid blocks
const CHAR_W = 0.6
const LINE_H = 0.92
const BG = '#120824'        // matches --color-surface-deeper
const FG = '#C47EE8'        // matches --color-primary-light
const SPARKLE_LIFE = 14     // frames at 30fps cadence ≈ 470ms
const DPR_CAP = 1.5

interface GlyphFaceProps {
  src: string
  /** Vertical centre-crop bias, 0..1. 0=top of source, 1=bottom, 0.5=centre.
   *  Only matters when the source image is TALLER than the grid aspect. */
  cropAnchorY?: number
  /** Horizontal centre-crop bias, 0..1. 0=left, 1=right, 0.5=centre.
   *  Only matters when the source image is WIDER than the grid aspect. */
  cropAnchorX?: number
  cols?: number
  rows?: number
  /** Luminance contrast multiplier applied before mapping to ramp. Default 1.0.
   *  Low-contrast photos (bright sky + mid-tone subjects) need ≥1.4 to read. */
  contrast?: number
  analysers?: (AnalyserNode | null)[]
  tracks?: Array<{ muted: boolean }>
  playing?: boolean
  voxIdx?: number
  drumsIdx?: number
}

interface Sparkle {
  c: number
  r: number
  age: number
  char: string
}

export default function GlyphFace(props: GlyphFaceProps) {
  const { src, cropAnchorX = 0.5, cropAnchorY = 0.35, cols = 56, rows = 72, contrast = 1.0 } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const baseRef = useRef<Uint8Array | null>(null)
  const dimsRef = useRef({ cellW: 0, cellH: 0, fontSize: 0 })
  const propsRef = useRef(props)
  propsRef.current = props

  // Draw the static base into the canvas — every cell from the base grid.
  // Called on initial load, on resize, and after the source image changes.
  const drawFull = () => {
    const canvas = canvasRef.current
    const base = baseRef.current
    if (!canvas || !base) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const { cellW, cellH, fontSize } = dimsRef.current
    if (!cellW || !cellH || !fontSize) return

    // Clear full canvas (using bg colour so sparkles can repaint against it).
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, cols * cellW, rows * cellH)

    ctx.font = `${fontSize}px ui-monospace, 'JetBrains Mono', Menlo, monospace`
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    ctx.fillStyle = FG

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const ix = base[r * cols + c]
        if (ix === 0) continue
        ctx.fillText(RAMP[ix], c * cellW, r * cellH)
      }
    }
  }

  // ── 1) Image → ramp index grid (re-runs on src/crop/density change)
  useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      const sampleH = rows * 2
      const sampleW = cols

      const canvas = document.createElement('canvas')
      canvas.width = sampleW
      canvas.height = sampleH
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dstAspect = sampleW / sampleH
      const srcAspect = img.width / img.height
      let sx = 0, sy = 0, sw = img.width, sh = img.height
      if (srcAspect > dstAspect) {
        // Source is wider than grid → crop horizontally with the X anchor.
        sw = img.height * dstAspect
        sx = (img.width - sw) * cropAnchorX
      } else {
        // Source is taller than grid → crop vertically with the Y anchor.
        sh = img.width / dstAspect
        sy = (img.height - sh) * cropAnchorY
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sampleW, sampleH)

      const data = ctx.getImageData(0, 0, sampleW, sampleH).data
      const rampLen = RAMP.length
      const grid = new Uint8Array(cols * rows)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const topI = ((r * 2) * sampleW + c) * 4
          const botI = ((r * 2 + 1) * sampleW + c) * 4
          const lT = 0.299 * data[topI] + 0.587 * data[topI + 1] + 0.114 * data[topI + 2]
          const lB = 0.299 * data[botI] + 0.587 * data[botI + 1] + 0.114 * data[botI + 2]
          let lum = (lT + lB) / 510
          // Contrast curve around 0.5: stretches mid-tones so low-contrast
          // photos show subject vs background more clearly.
          lum = Math.min(1, Math.max(0, (lum - 0.5) * contrast + 0.5))
          const ix = Math.min(rampLen - 1, Math.max(0, Math.floor((1 - lum) * rampLen)))
          grid[r * cols + c] = ix
        }
      }
      baseRef.current = grid
      drawFull()
    }
    img.onerror = () => console.warn('[glyph-face] image failed to load:', src)
  }, [src, cropAnchorX, cropAnchorY, cols, rows, contrast])

  // ── 2) ResizeObserver — fit canvas to parent and recompute cell metrics
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const fit = () => {
      const { width, height } = parent.getBoundingClientRect()
      if (!width || !height) return
      const fontByWidth = width / (cols * CHAR_W)
      const fontByHeight = height / (rows * LINE_H)
      const fontSize = Math.min(fontByWidth, fontByHeight)
      const cellW = fontSize * CHAR_W
      const cellH = fontSize * LINE_H

      const cw = cols * cellW
      const ch = rows * cellH
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)

      canvas.width = Math.floor(cw * dpr)
      canvas.height = Math.floor(ch * dpr)
      canvas.style.width = cw + 'px'
      canvas.style.height = ch + 'px'

      const ctx = canvas.getContext('2d')
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      dimsRef.current = { cellW, cellH, fontSize }
      drawFull()
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [cols, rows])

  // ── 3) rAF — character animation via partial redraws
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    let frame = 0
    const bufs: { drums: Uint8Array | null; vox: Uint8Array | null } = { drums: null, vox: null }
    const s = { kick: 0, vox: 0 }
    const sparkles: Sparkle[] = []

    const restoreCell = (ctx: CanvasRenderingContext2D, c: number, r: number) => {
      const base = baseRef.current
      if (!base) return
      const { cellW, cellH } = dimsRef.current
      const ix = base[r * cols + c]
      ctx.fillStyle = BG
      ctx.fillRect(c * cellW, r * cellH, cellW + 0.6, cellH + 0.6)
      if (ix > 0) {
        ctx.fillStyle = FG
        ctx.fillText(RAMP[ix], c * cellW, r * cellH)
      }
    }

    const paintCell = (ctx: CanvasRenderingContext2D, c: number, r: number, ch: string) => {
      const { cellW, cellH } = dimsRef.current
      ctx.fillStyle = BG
      ctx.fillRect(c * cellW, r * cellH, cellW + 0.6, cellH + 0.6)
      ctx.fillStyle = FG
      ctx.fillText(ch, c * cellW, r * cellH)
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      if ((frame++ & 1) === 1) return // 30fps cadence
      const base = baseRef.current
      if (!base) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { fontSize } = dimsRef.current
      if (!fontSize) return

      const p = propsRef.current
      let kickE = 0, voxE = 0
      if (p.playing && p.analysers && p.tracks) {
        if (p.drumsIdx != null) {
          const a = p.analysers[p.drumsIdx]
          if (a && !p.tracks[p.drumsIdx]?.muted) {
            let buf = bufs.drums
            if (!buf || buf.length !== a.frequencyBinCount) {
              buf = new Uint8Array(a.frequencyBinCount); bufs.drums = buf
            }
            a.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
            kickE = bandEnergy(buf, 2, 8)
          }
        }
        if (p.voxIdx != null) {
          const a = p.analysers[p.voxIdx]
          if (a && !p.tracks[p.voxIdx]?.muted) {
            let buf = bufs.vox
            if (!buf || buf.length !== a.frequencyBinCount) {
              buf = new Uint8Array(a.frequencyBinCount); bufs.vox = buf
            }
            a.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
            voxE = bandEnergy(buf, 80, 256)
          }
        }
      }

      if (kickE > s.kick) s.kick = kickE
      s.kick = lerpToward(s.kick, 0, 0.20)
      s.vox = lerpToward(s.vox, voxE, 0.15)

      ctx.font = `${fontSize}px ui-monospace, 'JetBrains Mono', Menlo, monospace`
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'

      // Age + retire existing sparkles. We restore each retired cell to its
      // base character so the face is non-destructive.
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sp = sparkles[i]
        sp.age++
        if (sp.age >= SPARKLE_LIFE) {
          restoreCell(ctx, sp.c, sp.r)
          sparkles.splice(i, 1)
        }
      }

      // Target sparkle count: continuous baseline from vox, plus a burst on
      // each kick. Capped so we don't spam the canvas.
      const continuous = Math.floor(s.vox * 50)
      const burst = Math.floor(s.kick * 90)
      const target = Math.min(180, continuous + burst)
      const want = Math.max(0, target - sparkles.length)
      const cellCount = cols * rows

      for (let i = 0; i < want; i++) {
        // Pick a random subject-area cell (denser base = inside the face).
        let idx = -1
        for (let tries = 0; tries < 6; tries++) {
          const cand = Math.floor(Math.random() * cellCount)
          if (base[cand] >= 4) { idx = cand; break }
        }
        if (idx < 0) continue
        const c = idx % cols
        const r = (idx / cols) | 0
        // Sparkle char: a few steps lighter than the base — reads as a flash.
        const lighter = Math.max(0, base[idx] - 2 - Math.floor(Math.random() * 2))
        const ch = RAMP[lighter]
        sparkles.push({ c, r, age: 0, char: ch })
        paintCell(ctx, c, r, ch)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [cols, rows])

  return <canvas ref={canvasRef} className="ha-face" aria-hidden="true" />
}
