'use client'

// Generic ASCII visualisation panel. Sets up a canvas, fits it to the
// parent container, optionally loads an image, then runs the renderer
// on a throttled rAF loop driven by the shared audio analysers.

import { useEffect, useRef } from 'react'
import { bandEnergy, lerpToward } from '@/lib/audio-reactive'
import type { Renderer, RenderCtx, ZooAudio } from './types'

const CHAR_W = 0.6
const LINE_H = 0.95
const FONT_STACK = `ui-monospace, 'JetBrains Mono', Menlo, monospace`
const DPR_CAP = 1.5
// Each panel renders at half-rate — 8 panels at 30fps would saturate; 15fps
// per panel keeps total work manageable while still reading as animation.
const FRAME_SKIP = 3

interface AsciiPanelProps {
  renderer: Renderer
  cols: number
  rows: number
  analysers?: (AnalyserNode | null)[]
  tracks?: Array<{ muted: boolean }>
  playing?: boolean
  bassIdx?: number
  drumsIdx?: number
  mainIdx?: number
  voxIdx?: number
  fg?: string  // text colour
  bg?: string  // background colour
}

export default function AsciiPanel({
  renderer, cols, rows,
  analysers, tracks, playing = false,
  bassIdx, drumsIdx, mainIdx, voxIdx,
  fg = '#C47EE8', bg = '#120824',
}: AsciiPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const ctxRef = useRef<RenderCtx | null>(null)
  const propsRef = useRef({ analysers, tracks, playing, bassIdx, drumsIdx, mainIdx, voxIdx, fg, bg })
  propsRef.current = { analysers, tracks, playing, bassIdx, drumsIdx, mainIdx, voxIdx, fg, bg }

  // Image load
  useEffect(() => {
    if (!renderer.src) return
    const img = new Image()
    img.src = renderer.src
    img.onload = () => {
      imgRef.current = img
      if (ctxRef.current) {
        ctxRef.current.img = img
        renderer.onResize?.(ctxRef.current)
      }
    }
  }, [renderer])

  // Resize + initial setup
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
      if (!ctx) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const renderCtx: RenderCtx = {
        canvas, ctx,
        width: cw, height: ch,
        cellW, cellH, fontSize,
        cols, rows,
        audio: { bass: 0, drums: 0, kick: 0, main: 0, vox: 0, playing: false },
        frame: 0,
        img: imgRef.current,
      }
      ctxRef.current = renderCtx
      renderer.onResize?.(renderCtx)
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [cols, rows, renderer])

  // rAF
  useEffect(() => {
    let raf = 0
    let frame = 0
    const bufs: { [k: string]: Uint8Array | null } = { bass: null, drums: null, main: null, vox: null }
    const s = { bass: 0, drums: 0, kick: 0, main: 0, vox: 0 }

    const readBand = (idx: number | undefined, key: string, lo: number, hi: number): number => {
      const p = propsRef.current
      if (idx == null || !p.analysers || !p.tracks) return 0
      const a = p.analysers[idx]
      if (!a || p.tracks[idx]?.muted) return 0
      let buf = bufs[key]
      if (!buf || buf.length !== a.frequencyBinCount) {
        buf = new Uint8Array(a.frequencyBinCount); bufs[key] = buf
      }
      a.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
      return bandEnergy(buf, lo, hi)
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const rc = ctxRef.current
      if (!rc) return
      frame++
      if (frame % FRAME_SKIP !== 0) return

      const p = propsRef.current
      let bassE = 0, kickE = 0, midE = 0, voxE = 0
      if (p.playing) {
        bassE = readBand(p.bassIdx, 'bass', 1, 14)
        kickE = readBand(p.drumsIdx, 'drums', 2, 8)
        midE  = readBand(p.mainIdx, 'main', 8, 60)
        voxE  = readBand(p.voxIdx, 'vox', 80, 256)
      }
      // Drums band energy combines kick + body; expose both.
      const drumsBodyE = readBand(p.drumsIdx, 'drumsBody', 9, 60)
      const drumsCombined = Math.max(kickE, drumsBodyE)
      if (kickE > s.kick) s.kick = kickE
      s.kick = lerpToward(s.kick, 0, 0.20)
      s.bass = lerpToward(s.bass, bassE, 0.12)
      s.drums = lerpToward(s.drums, drumsCombined, 0.18)
      s.main = lerpToward(s.main, midE, 0.10)
      s.vox = lerpToward(s.vox, voxE, 0.18)

      const audio: ZooAudio = { ...s, playing: p.playing ?? false }
      rc.audio = audio
      rc.frame++
      renderer.onFrame(rc)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [renderer])

  return (
    <canvas
      ref={canvasRef}
      className="az-canvas"
      style={{ background: bg, color: fg }}
      aria-hidden="true"
    />
  )
}

export { FONT_STACK }
