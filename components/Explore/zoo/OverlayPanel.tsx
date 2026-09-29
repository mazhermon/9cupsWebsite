'use client'

// Single-stem ASCII canvas — designed to be stacked with others via CSS
// mix-blend-mode. Reads ONE analyser. Renderers receive a simple
// { energy, attack, playing } audio context so they don't know or care
// which stem they're driven by.
//
// The host (AsciiOverlay) decides the mapping by passing the right
// analyser/band/colour per panel.

import { useEffect, useRef } from 'react'
import { bandEnergy, lerpToward } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

const CHAR_W = 0.6
const LINE_H = 0.95
const FONT_STACK = `ui-monospace, 'JetBrains Mono', Menlo, monospace`
const DPR_CAP = 1.5
// 30fps per layer × 4 layers = 120 renderer-frames/sec total. Canvas ops
// are cheap enough that this stays well under budget while giving snappier
// response to percussive content.
const FRAME_SKIP = 2

export interface OverlayAudio {
  /** Smoothed band energy 0..1. Tracks sustained loudness. */
  energy: number
  /** Peak/decay envelope. Fast attack, slow decay — a "recent burst" signal. */
  attack: number
  /** True on the frame a transient was detected (kick-style event).
   *  Only meaningful for percussive stems; for others it fires on any sharp
   *  energy spike. Used by renderers for one-shot bursts. */
  kicked: boolean
  playing: boolean
}

export interface OverlayRenderCtx {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  cellW: number
  cellH: number
  fontSize: number
  cols: number
  rows: number
  audio: OverlayAudio
  frame: number
  img: HTMLImageElement | null
  /** Renderer's brand colour (already includes alpha if applicable). */
  color: string
}

export interface OverlayRenderer {
  src?: string
  onResize?: (ctx: OverlayRenderCtx) => void
  onFrame: (ctx: OverlayRenderCtx) => void
}

interface OverlayPanelProps {
  renderer: OverlayRenderer
  cols: number
  rows: number
  /** Analyser for this layer's stem. */
  analyser: AnalyserNode | null
  /** True if the stem is muted (forces energy to 0). */
  muted: boolean
  /** Master playback flag. */
  playing: boolean
  /** Frequency-bin range to read for the energy/attack envelope. */
  band: [number, number]
  /** Hex colour for the renderer's marks. */
  color: string
  /** CSS class for the canvas (used for layer-specific blending/positioning). */
  className?: string
}

export default function OverlayPanel({
  renderer, cols, rows, analyser, muted, playing, band, color, className = '',
}: OverlayPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const ctxRef = useRef<OverlayRenderCtx | null>(null)
  const propsRef = useRef({ analyser, muted, playing, band, color })
  propsRef.current = { analyser, muted, playing, band, color }

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

      const rc: OverlayRenderCtx = {
        canvas, ctx,
        width: cw, height: ch,
        cellW, cellH, fontSize, cols, rows,
        audio: { energy: 0, attack: 0, kicked: false, playing: false },
        frame: 0,
        img: imgRef.current,
        color: propsRef.current.color,
      }
      ctxRef.current = rc
      renderer.onResize?.(rc)
    }

    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [cols, rows, renderer])

  useEffect(() => {
    let raf = 0
    let frame = 0
    let buf: Uint8Array | null = null
    const s = { energy: 0, attack: 0 }
    // Transient detector — fires `true` on sharp energy spikes (kicks, hits).
    // Tunable: lower threshold = more sensitive, higher cooldown = fewer
    // double-fires. Values chosen to match the Wordmark's drum-glitch feel.
    const detector = new TransientDetector({ threshold: 1.35, cooldownFrames: 4, windowSize: 8 })

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const rc = ctxRef.current
      if (!rc) return
      frame++
      if (frame % FRAME_SKIP !== 0) return

      const p = propsRef.current
      let e = 0
      if (p.playing && p.analyser && !p.muted) {
        if (!buf || buf.length !== p.analyser.frequencyBinCount) {
          buf = new Uint8Array(p.analyser.frequencyBinCount)
        }
        p.analyser.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
        e = bandEnergy(buf, p.band[0], p.band[1])
      }
      // Snappier energy lerp — was 0.12 (too smooth to follow rhythm). 0.30
      // reaches ~95% of a step in ~10 frames (≈330ms at 30fps cadence).
      s.energy = lerpToward(s.energy, e, 0.30)
      // Attack envelope: instant peak, fast decay → reads as "recent burst".
      if (e > s.attack) s.attack = e
      s.attack = lerpToward(s.attack, 0, 0.30)
      // Transient (one-shot kicked event).
      const kicked = detector.push(e, frame)

      rc.audio.energy = s.energy
      rc.audio.attack = s.attack
      rc.audio.kicked = kicked
      rc.audio.playing = p.playing
      rc.color = p.color
      rc.frame++
      renderer.onFrame(rc)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [renderer])

  return <canvas ref={canvasRef} className={`ao-canvas ${className}`} aria-hidden="true" />
}

export { FONT_STACK }
