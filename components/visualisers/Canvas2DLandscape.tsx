'use client'

// Option C: pure Canvas2D, no WebGL. Stack of contour lines that wave with
// audio + frequency bars at the bottom. Designed to run at 60fps on a 2018
// phone. CPU-bound but the operation count is tiny (~30 line strokes per
// frame, ~60 fillRects).

import { useEffect, useRef } from 'react'
import type { VisualiserProps } from '@/components/Hero/HeroPage'
import { bandEnergy, lerpToward, useReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

const CONTOUR_COUNT = 22       // horizontal sonar lines stacked top → bottom
const SAMPLES_PER_LINE = 96    // points per line
const BAR_COUNT = 32

interface BandSnapshot {
  low: number
  mid: number
  kick: number
  high: number
}

export default function Canvas2DLandscape({ stems, trackStates, analysers, playing }: VisualiserProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reducedMotion = useReducedMotion()
  const detector = useRef(new TransientDetector({ threshold: 1.32, cooldownFrames: 5, windowSize: 8 }))
  const dataRefs = useRef<(Uint8Array | null)[]>([null, null, null, null])
  const bandsRef = useRef<BandSnapshot>({ low: 0, mid: 0, kick: 0, high: 0 })
  const kickPulse = useRef(0)
  const frameIdx = useRef(0)
  const timeRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  // Latest props in refs so the rAF loop reads fresh values without re-binding.
  const playingRef = useRef(playing)
  const stemsRef = useRef(stems)
  const tracksRef = useRef(trackStates)
  const analysersRef = useRef(analysers)
  useEffect(() => { playingRef.current = playing }, [playing])
  useEffect(() => { stemsRef.current = stems }, [stems])
  useEffect(() => { tracksRef.current = trackStates }, [trackStates])
  useEffect(() => { analysersRef.current = analysers }, [analysers])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let lastT = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const rect = canvas.getBoundingClientRect()
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick)
      const delta = Math.min(0.05, (now - lastT) / 1000)
      lastT = now

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = canvas.width / dpr
      const h = canvas.height / dpr

      ctx.clearRect(0, 0, w, h)

      if (reducedMotion || document.hidden) return
      timeRef.current += delta

      // ── Audio read ─────────────────────────────────────────────────
      if (playingRef.current) {
        const stemsLocal = stemsRef.current
        const tracksLocal = tracksRef.current
        const analysersLocal = analysersRef.current

        const idxByKey: Record<string, number> = {}
        stemsLocal.forEach((s, i) => { idxByKey[s.key] = i })

        const readBand = (idx: number | undefined, lo: number, hi: number) => {
          if (idx == null) return 0
          if (tracksLocal[idx]?.muted) return 0
          const a = analysersLocal[idx]
          if (!a) return 0
          const cur = dataRefs.current[idx]
          const buf = (!cur || cur.length !== a.frequencyBinCount)
            ? (dataRefs.current[idx] = new Uint8Array(a.frequencyBinCount))
            : cur
          a.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)
          return bandEnergy(buf, lo, hi)
        }

        const low  = readBand(idxByKey.bass,  1, 14)
        const kick = readBand(idxByKey.drums, 2, 8)
        const mid  = readBand(idxByKey.main, 14, 95)
        const high = readBand(idxByKey.vox,  95, 280)

        const kicked = idxByKey.drums != null && detector.current.push(kick, frameIdx.current)
        frameIdx.current++

        bandsRef.current.low  = lerpToward(bandsRef.current.low,  low,  0.55)
        bandsRef.current.mid  = lerpToward(bandsRef.current.mid,  mid,  0.50)
        bandsRef.current.high = lerpToward(bandsRef.current.high, high, 0.55)
        bandsRef.current.kick = kick
        if (kicked) kickPulse.current = 1
        kickPulse.current = lerpToward(kickPulse.current, 0, 0.12)
      } else {
        // Gentle drift when not playing so it's not dead.
        const b = bandsRef.current
        b.low = b.mid = b.high = b.kick = 0
        kickPulse.current = 0
      }

      const t = timeRef.current
      const { low, mid, high } = bandsRef.current
      const kick = kickPulse.current

      // ── Contour lines (the topographic body) ─────────────────────────
      // Lines stacked from horizon (top) to foreground (bottom). Each line is
      // a horizontal wave whose amplitude grows with bass and rides the mid
      // wave field; kick adds a transient bump centred on the line.
      const top = h * 0.18      // start of contour band (below the wordmark/buttons)
      const bottom = h * 0.92   // bars sit below
      const bandH = bottom - top

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      for (let i = 0; i < CONTOUR_COUNT; i++) {
        const norm = i / (CONTOUR_COUNT - 1)        // 0 horizon → 1 foreground
        const y0 = top + bandH * norm
        const lineDepth = norm                       // 0 far, 1 near
        const lineW = w * (0.55 + 0.45 * lineDepth)  // narrower at horizon
        const x0 = (w - lineW) / 2

        // Amplitude: mostly bass-driven, with a foreground emphasis (lines closer to camera move more)
        const ampLow  = (5 + 22 * low)  * lineDepth
        const ampMid  = (3 + 12 * mid)  * lineDepth
        const ampHigh = (1 + 4 * high)  * lineDepth
        const kickBump = 12 * kick * Math.exp(-Math.pow(norm - 0.55, 2) * 8.0)

        ctx.beginPath()
        for (let s = 0; s <= SAMPLES_PER_LINE; s++) {
          const u = s / SAMPLES_PER_LINE
          const x = x0 + u * lineW
          // Combined wave: low (slow, large) + mid (medium) + high (fast, fine) + kick centre bump
          const yy = y0
            - ampLow  * Math.sin(u * 4.0 + t * 0.7  + norm * 1.6)
            - ampMid  * Math.sin(u * 9.0 + t * 1.4  + norm * 2.2)
            - ampHigh * Math.sin(u * 19.0 + t * 3.5 + norm * 3.0)
            - kickBump * Math.sin(u * 6.0 + t * 4.0)
          if (s === 0) ctx.moveTo(x, yy)
          else ctx.lineTo(x, yy)
        }
        // Brighter / wider toward foreground
        const alpha = 0.18 + 0.62 * lineDepth
        ctx.strokeStyle = `rgba(204, 46, 144, ${alpha.toFixed(3)})`
        ctx.lineWidth = 0.5 + 1.2 * lineDepth
        ctx.stroke()
      }

      // ── Frequency bars at the bottom ────────────────────────────────
      // Reads the BASS analyser as the spectrum source (full-spectrum on bass
      // stem covers most of the song's energy). Cheap to draw 32 fillRects.
      const bassAnalyser = analysersRef.current[
        stemsRef.current.findIndex(s => s.key === 'bass')
      ]
      if (bassAnalyser && playingRef.current) {
        const cur = dataRefs.current[0]
        const buf = (!cur || cur.length !== bassAnalyser.frequencyBinCount)
          ? (dataRefs.current[0] = new Uint8Array(bassAnalyser.frequencyBinCount))
          : cur
        bassAnalyser.getByteFrequencyData(buf as Uint8Array<ArrayBuffer>)

        const barAreaY = bottom + 4
        const barAreaH = h - barAreaY - 6
        const barGap = 2
        const totalGap = barGap * (BAR_COUNT - 1)
        const barW = (w * 0.7 - totalGap) / BAR_COUNT
        const barX0 = (w - (BAR_COUNT * barW + totalGap)) / 2

        // Sample the bins logarithmically across 50–14000 Hz
        const minBin = 2
        const maxBin = Math.min(buf.length - 1, 600)
        ctx.fillStyle = 'rgba(204, 46, 144, 0.85)'
        for (let b = 0; b < BAR_COUNT; b++) {
          const t01 = b / (BAR_COUNT - 1)
          // Logarithmic mapping
          const bin = Math.round(minBin * Math.pow(maxBin / minBin, t01))
          const v = buf[bin] / 255
          const bh = Math.max(2, v * barAreaH)
          const x = barX0 + b * (barW + barGap)
          const y = barAreaY + (barAreaH - bh)
          ctx.fillRect(x, y, barW, bh)
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [reducedMotion])

  return (
    <section
      id="stage"
      className="stage stage--full"
      aria-label="Stem mixer. Mute or unmute each stem from the buttons above."
    >
      <canvas ref={canvasRef} className="canvas2d-landscape" aria-hidden="true" />
    </section>
  )
}
