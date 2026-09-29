// Eight ASCII renderers. Each is a Renderer (see types.ts) — a small bundle
// of (optional) image src, onResize, onFrame. Self-contained: they hold
// any state they need via closure when constructed.
//
// All renderers share the same RenderCtx (canvas + audio + frame counter).
// The AsciiPanel sets up the canvas and feeds them per frame.

import type { Renderer, RenderCtx } from './types'

const FONT_STACK = `ui-monospace, 'JetBrains Mono', Menlo, monospace`

// ─── Helpers ──────────────────────────────────────────────────────────────

// Sample an image into a luminance grid [cols * rows], 0..1.
function sampleImage(
  img: HTMLImageElement,
  cols: number,
  rowsSamp: number,
  cropAnchorX = 0.5,
  cropAnchorY = 0.5,
  contrast = 1.0,
): Float32Array {
  const sampleW = cols
  const sampleH = rowsSamp
  const canvas = document.createElement('canvas')
  canvas.width = sampleW
  canvas.height = sampleH
  const ctx = canvas.getContext('2d')!
  const dstAspect = sampleW / sampleH
  const srcAspect = img.width / img.height
  let sx = 0, sy = 0, sw = img.width, sh = img.height
  if (srcAspect > dstAspect) {
    sw = img.height * dstAspect
    sx = (img.width - sw) * cropAnchorX
  } else {
    sh = img.width / dstAspect
    sy = (img.height - sh) * cropAnchorY
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sampleW, sampleH)
  const data = ctx.getImageData(0, 0, sampleW, sampleH).data
  const out = new Float32Array(cols * rowsSamp)
  for (let i = 0; i < cols * rowsSamp; i++) {
    const o = i * 4
    let l = (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) / 255
    l = Math.min(1, Math.max(0, (l - 0.5) * contrast + 0.5))
    out[i] = l
  }
  return out
}

function clear(rc: RenderCtx, bg = '#120824') {
  rc.ctx.fillStyle = bg
  rc.ctx.fillRect(0, 0, rc.width, rc.height)
}

function setFont(rc: RenderCtx, size = rc.fontSize, color = '#C47EE8') {
  rc.ctx.font = `${size}px ${FONT_STACK}`
  rc.ctx.textBaseline = 'top'
  rc.ctx.textAlign = 'left'
  rc.ctx.fillStyle = color
}

// ─── 01 · CLASSIC ────────────────────────────────────────────────────────
// Density ramp portrait, drums-driven sparkles flicker over subject cells.

export function createClassic(src: string): Renderer {
  const RAMP = ' .·:-=+*#'
  let base: Uint8Array | null = null
  const sparkles: { c: number, r: number, age: number, ch: string }[] = []
  const SPARKLE_LIFE = 8

  return {
    src,
    onResize(rc) {
      if (!rc.img) return
      const lum = sampleImage(rc.img, rc.cols, rc.rows * 2, 0.5, 0.35, 1.0)
      const grid = new Uint8Array(rc.cols * rc.rows)
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const l = (lum[(r * 2) * rc.cols + c] + lum[(r * 2 + 1) * rc.cols + c]) / 2
          grid[r * rc.cols + c] = Math.min(RAMP.length - 1, Math.floor((1 - l) * RAMP.length))
        }
      }
      base = grid
      // Initial full draw
      clear(rc)
      setFont(rc)
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const ix = grid[r * rc.cols + c]
          if (ix === 0) continue
          rc.ctx.fillText(RAMP[ix], c * rc.cellW, r * rc.cellH)
        }
      }
    },
    onFrame(rc) {
      if (!base) return
      const { ctx, cellW, cellH } = rc
      setFont(rc)
      // Retire old sparkles
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const sp = sparkles[i]
        sp.age++
        if (sp.age >= SPARKLE_LIFE) {
          ctx.fillStyle = '#120824'
          ctx.fillRect(sp.c * cellW, sp.r * cellH, cellW + 0.6, cellH + 0.6)
          const ix = base[sp.r * rc.cols + sp.c]
          if (ix > 0) {
            ctx.fillStyle = '#C47EE8'
            ctx.fillText('  .·:-=+*#'[ix] ?? ' ', sp.c * cellW, sp.r * cellH)
          }
          sparkles.splice(i, 1)
        }
      }
      // Spawn new
      const target = Math.floor(rc.audio.vox * 30 + rc.audio.kick * 50)
      const want = Math.max(0, target - sparkles.length)
      for (let i = 0; i < want; i++) {
        const idx = (Math.random() * rc.cols * rc.rows) | 0
        if (base[idx] < 4) continue
        const c = idx % rc.cols
        const r = (idx / rc.cols) | 0
        const ch = '*+'[(Math.random() * 2) | 0]
        sparkles.push({ c, r, age: 0, ch })
        ctx.fillStyle = '#120824'
        ctx.fillRect(c * cellW, r * cellH, cellW + 0.6, cellH + 0.6)
        ctx.fillStyle = '#FFCFEF'
        ctx.fillText(ch, c * cellW, r * cellH)
      }
    },
  }
}

// ─── 02 · BRAILLE ────────────────────────────────────────────────────────
// Each braille char is a 2×4 sub-grid of dots → 8× horizontal × 4× vertical
// effective resolution over the visible char grid. Audio drives a threshold
// sweep so the portrait "develops" and "fades" with the music.
//
// Braille bit order (codepoint = 0x2800 + bitmask):
//   0 3      1<<0  1<<3
//   1 4  =   1<<1  1<<4
//   2 5      1<<2  1<<5
//   6 7      1<<6  1<<7

export function createBraille(src: string): Renderer {
  let lum: Float32Array | null = null  // [subCols * subRows]
  let subCols = 0, subRows = 0

  return {
    src,
    onResize(rc) {
      if (!rc.img) return
      subCols = rc.cols * 2
      subRows = rc.rows * 4
      lum = sampleImage(rc.img, subCols, subRows, 0.5, 0.35, 1.3)
    },
    onFrame(rc) {
      if (!lum) return
      clear(rc)
      setFont(rc, rc.fontSize * 1.05, '#C47EE8')
      // Threshold sweeps with bass (heavier subject) and kick gives a quick punch.
      const threshold = 0.5 - rc.audio.bass * 0.18 - rc.audio.kick * 0.12
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const sc = c * 2
          const sr = r * 4
          let mask = 0
          // Left column dots: rows 0,1,2,6 → bit positions 0,1,2,6
          if (lum[(sr + 0) * subCols + sc + 0] < threshold) mask |= 1
          if (lum[(sr + 1) * subCols + sc + 0] < threshold) mask |= 2
          if (lum[(sr + 2) * subCols + sc + 0] < threshold) mask |= 4
          if (lum[(sr + 3) * subCols + sc + 0] < threshold) mask |= 64
          // Right column dots: rows 0,1,2,6 → bits 3,4,5,7
          if (lum[(sr + 0) * subCols + sc + 1] < threshold) mask |= 8
          if (lum[(sr + 1) * subCols + sc + 1] < threshold) mask |= 16
          if (lum[(sr + 2) * subCols + sc + 1] < threshold) mask |= 32
          if (lum[(sr + 3) * subCols + sc + 1] < threshold) mask |= 128
          if (mask === 0) continue
          rc.ctx.fillText(String.fromCodePoint(0x2800 + mask), c * rc.cellW, r * rc.cellH)
        }
      }
    },
  }
}

// ─── 03 · BLOCK ──────────────────────────────────────────────────────────
// Half-block Unicode chars (▀▄█) — two pixel "rows" per char row, so the
// effective vertical resolution doubles. Each char shows the cover image
// at clean low-res. Vox drives a horizontal scan glitch.

export function createBlock(src: string): Renderer {
  let lum: Float32Array | null = null
  let subRows = 0

  return {
    src,
    onResize(rc) {
      if (!rc.img) return
      subRows = rc.rows * 2
      lum = sampleImage(rc.img, rc.cols, subRows, 0.5, 0.5, 1.0)
    },
    onFrame(rc) {
      if (!lum) return
      clear(rc, '#0F0820')
      setFont(rc, rc.fontSize * 1.05, '#C47EE8')
      const glitchRow = rc.audio.vox > 0.18 ? (Math.random() * rc.rows) | 0 : -1
      const threshold = 0.5 - rc.audio.bass * 0.2
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const top = lum[(r * 2) * rc.cols + c] < threshold
          const bot = lum[(r * 2 + 1) * rc.cols + c] < threshold
          let ch = ''
          if (top && bot) ch = '█'
          else if (top) ch = '▀'
          else if (bot) ch = '▄'
          if (!ch) continue
          if (r === glitchRow) {
            rc.ctx.fillStyle = '#FFCFEF'
            rc.ctx.fillText(ch, c * rc.cellW + (Math.random() - 0.5) * 4, r * rc.cellH)
            rc.ctx.fillStyle = '#C47EE8'
          } else {
            rc.ctx.fillText(ch, c * rc.cellW, r * rc.cellH)
          }
        }
      }
    },
  }
}

// ─── 04 · EDGE ───────────────────────────────────────────────────────────
// Sobel edge detection. Each cell shows a directional glyph (─│╱╲) chosen
// by the dominant gradient angle, drawn where the magnitude clears a
// threshold. Kick momentarily drops the threshold so more edges fire.

export function createEdge(src: string): Renderer {
  let lum: Float32Array | null = null
  let cw = 0, rh = 0  // sample resolution

  function lumAt(c: number, r: number): number {
    if (!lum) return 0
    if (c < 0) c = 0; else if (c >= cw) c = cw - 1
    if (r < 0) r = 0; else if (r >= rh) r = rh - 1
    return lum[r * cw + c]
  }

  return {
    src,
    onResize(rc) {
      if (!rc.img) return
      cw = rc.cols
      rh = rc.rows * 2
      lum = sampleImage(rc.img, cw, rh, 0.5, 0.35, 1.5)
    },
    onFrame(rc) {
      if (!lum) return
      clear(rc, '#0F0820')
      setFont(rc, rc.fontSize, '#C47EE8')
      const threshold = 0.18 - rc.audio.kick * 0.10
      for (let r = 0; r < rc.rows; r++) {
        const sr = r * 2
        for (let c = 0; c < rc.cols; c++) {
          // Sobel in the 2x-vertical-resolution sample space.
          const gx =
            -1 * lumAt(c - 1, sr - 1) - 2 * lumAt(c - 1, sr) - 1 * lumAt(c - 1, sr + 1)
            + 1 * lumAt(c + 1, sr - 1) + 2 * lumAt(c + 1, sr) + 1 * lumAt(c + 1, sr + 1)
          const gy =
            -1 * lumAt(c - 1, sr - 1) - 2 * lumAt(c, sr - 1) - 1 * lumAt(c + 1, sr - 1)
            + 1 * lumAt(c - 1, sr + 1) + 2 * lumAt(c, sr + 1) + 1 * lumAt(c + 1, sr + 1)
          const mag = Math.sqrt(gx * gx + gy * gy)
          if (mag < threshold) continue
          const angle = Math.atan2(gy, gx) * 180 / Math.PI
          // Bin angle into 4 directions
          let ch = '─'
          const a = ((angle + 180) % 180)
          if (a < 22.5 || a >= 157.5) ch = '─'
          else if (a < 67.5) ch = '╲'
          else if (a < 112.5) ch = '│'
          else ch = '╱'
          rc.ctx.fillText(ch, c * rc.cellW, r * rc.cellH)
        }
      }
    },
  }
}

// ─── 05 · HALFTONE ───────────────────────────────────────────────────────
// Floyd-Steinberg-dithered family photo using a 6-step dot ramp. Bass
// shifts the brightness floor; mid drives a slow horizontal pan.

export function createHalftone(src: string): Renderer {
  const RAMP = ' .∘○◉●'
  let lum: Float32Array | null = null
  let panOffset = 0

  return {
    src,
    onResize(rc) {
      if (!rc.img) return
      lum = sampleImage(rc.img, rc.cols, rc.rows * 2, 0.5, 0.5, 1.4)
    },
    onFrame(rc) {
      if (!lum) return
      clear(rc, '#100722')
      setFont(rc, rc.fontSize, '#C47EE8')
      panOffset += (rc.audio.main - 0.5) * 0.4
      const panInt = (panOffset | 0) % rc.cols
      const brightness = 1 - rc.audio.bass * 0.25
      // Dither in-place on a local buffer (one frame).
      const buf = new Float32Array(rc.cols * rc.rows)
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const cs = ((c + panInt) + rc.cols) % rc.cols
          const l = (lum[(r * 2) * rc.cols + cs] + lum[(r * 2 + 1) * rc.cols + cs]) / 2
          buf[r * rc.cols + c] = Math.min(1, l * brightness)
        }
      }
      // Floyd-Steinberg
      const levels = RAMP.length
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const old = buf[r * rc.cols + c]
          const quant = Math.round(old * (levels - 1)) / (levels - 1)
          buf[r * rc.cols + c] = quant
          const err = old - quant
          if (c + 1 < rc.cols) buf[r * rc.cols + c + 1] += err * 7 / 16
          if (r + 1 < rc.rows) {
            if (c > 0) buf[(r + 1) * rc.cols + c - 1] += err * 3 / 16
            buf[(r + 1) * rc.cols + c] += err * 5 / 16
            if (c + 1 < rc.cols) buf[(r + 1) * rc.cols + c + 1] += err * 1 / 16
          }
        }
      }
      // Draw
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const v = buf[r * rc.cols + c]
          const ix = Math.min(levels - 1, Math.max(0, Math.round((1 - v) * (levels - 1))))
          if (ix === 0) continue
          rc.ctx.fillText(RAMP[ix], c * rc.cellW, r * rc.cellH)
        }
      }
    },
  }
}

// ─── 06 · PARTICLES ──────────────────────────────────────────────────────
// Faint portrait silhouette underneath, glyph particles drift across the
// canvas. Vox spawns particles; bass affects their drift speed.

export function createParticles(src: string): Renderer {
  const RAMP = ' .·:-=+*#'
  let base: Uint8Array | null = null
  interface P { c: number, r: number, vc: number, vr: number, ch: string, age: number }
  const particles: P[] = []
  const LIFE = 30
  const PCHARS = '0123456789·•+◆◇*'

  return {
    src,
    onResize(rc) {
      if (!rc.img) return
      const lum = sampleImage(rc.img, rc.cols, rc.rows * 2, 0.5, 0.35, 1.2)
      const grid = new Uint8Array(rc.cols * rc.rows)
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const l = (lum[(r * 2) * rc.cols + c] + lum[(r * 2 + 1) * rc.cols + c]) / 2
          grid[r * rc.cols + c] = Math.min(RAMP.length - 1, Math.floor((1 - l) * RAMP.length))
        }
      }
      base = grid
    },
    onFrame(rc) {
      if (!base) return
      clear(rc, '#100722')
      // Faint base portrait
      setFont(rc, rc.fontSize, 'rgba(196, 126, 232, 0.28)')
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const ix = base[r * rc.cols + c]
          if (ix === 0) continue
          rc.ctx.fillText(RAMP[ix], c * rc.cellW, r * rc.cellH)
        }
      }
      // Update + draw particles
      const speedMult = 1 + rc.audio.bass * 2
      setFont(rc, rc.fontSize * 1.05, '#FFCFEF')
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.c += p.vc * speedMult
        p.r += p.vr * speedMult
        p.age++
        if (p.age >= LIFE || p.c < 0 || p.c >= rc.cols || p.r < 0 || p.r >= rc.rows) {
          particles.splice(i, 1)
          continue
        }
        rc.ctx.fillText(p.ch, (p.c | 0) * rc.cellW, (p.r | 0) * rc.cellH)
      }
      // Spawn from vox + kick
      const want = Math.min(80, Math.floor(rc.audio.vox * 30 + rc.audio.kick * 60))
      for (let i = particles.length; i < want; i++) {
        // Spawn at a dark subject cell
        const idx = (Math.random() * rc.cols * rc.rows) | 0
        if (base[idx] < 4) continue
        const c = idx % rc.cols
        const r = (idx / rc.cols) | 0
        particles.push({
          c, r,
          vc: (Math.random() - 0.5) * 0.4,
          vr: (Math.random() - 0.5) * 0.3 - 0.1,
          ch: PCHARS[(Math.random() * PCHARS.length) | 0],
          age: 0,
        })
      }
    },
  }
}

// ─── 07 · MATRIX ─────────────────────────────────────────────────────────
// Matrix-style rain falling through a pre-rendered "9CUPS" text stencil.
// Drums spawn drops; vox speeds up the fall. Cells inside the wordmark
// brighten when a drop passes through them.

export function createMatrix(_text = '9CUPS'): Renderer {
  let stencil: Uint8Array | null = null  // 1 if cell is inside wordmark
  const drops: { col: number, head: number, speed: number, age: number }[] = []
  const trail: Map<string, { ch: string, age: number, bright: boolean }> = new Map()
  const TRAIL_LIFE = 12
  const CHARS = '01ｱｲｳｴｵｶｷｸｹｺ#9C'

  return {
    onResize(rc) {
      // Render text to offscreen canvas and sample stencil mask
      const off = document.createElement('canvas')
      off.width = rc.cols
      off.height = rc.rows
      const octx = off.getContext('2d')!
      octx.fillStyle = 'black'
      octx.fillRect(0, 0, rc.cols, rc.rows)
      octx.fillStyle = 'white'
      octx.font = `bold ${rc.rows * 0.95}px ${FONT_STACK}`
      octx.textBaseline = 'middle'
      octx.textAlign = 'center'
      octx.fillText(_text, rc.cols / 2, rc.rows / 2)
      const data = octx.getImageData(0, 0, rc.cols, rc.rows).data
      const out = new Uint8Array(rc.cols * rc.rows)
      for (let i = 0; i < out.length; i++) {
        out[i] = data[i * 4] > 128 ? 1 : 0
      }
      stencil = out
    },
    onFrame(rc) {
      if (!stencil) return
      clear(rc, '#080414')
      setFont(rc, rc.fontSize, '#2E8540')

      // Trail decay + redraw
      for (const [key, t] of trail) {
        t.age++
        if (t.age >= TRAIL_LIFE) {
          trail.delete(key)
          continue
        }
        const [cs, rs] = key.split(',')
        const c = +cs, r = +rs
        const fadeAlpha = 1 - (t.age / TRAIL_LIFE)
        const insideWordmark = stencil[r * rc.cols + c] === 1
        if (insideWordmark) {
          rc.ctx.fillStyle = `rgba(196, 126, 232, ${fadeAlpha})`  // brand purple
        } else {
          rc.ctx.fillStyle = `rgba(120, 220, 130, ${fadeAlpha * 0.7})`  // green
        }
        rc.ctx.fillText(t.ch, c * rc.cellW, r * rc.cellH)
      }

      // Update drops
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        d.head += d.speed * (1 + rc.audio.vox * 2)
        d.age++
        const r = d.head | 0
        if (r < rc.rows) {
          const ch = CHARS[(Math.random() * CHARS.length) | 0]
          const key = `${d.col},${r}`
          trail.set(key, { ch, age: 0, bright: true })
        }
        if (d.head >= rc.rows + 5 || d.age > 80) drops.splice(i, 1)
      }

      // Spawn new drops from kick + ambient rate
      const ambient = 0.06
      const burst = rc.audio.kick * 0.6
      if (Math.random() < ambient + burst) {
        drops.push({
          col: (Math.random() * rc.cols) | 0,
          head: 0,
          speed: 0.5 + Math.random() * 1.2,
          age: 0,
        })
      }

      // Outline pass: faint stencil so wordmark is visible even when no drops
      rc.ctx.fillStyle = 'rgba(196, 126, 232, 0.18)'
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          if (stencil[r * rc.cols + c] !== 1) continue
          const key = `${c},${r}`
          if (trail.has(key)) continue
          rc.ctx.fillText('·', c * rc.cellW, r * rc.cellH)
        }
      }
    },
  }
}

// ─── 08 · WAVEFORM ───────────────────────────────────────────────────────
// No source image — pure audio. Each column is a frequency bin, height
// reflects amplitude, mirrored vertically. Per-stem colours layered.

export function createWaveform(): Renderer {
  // Need raw analyser data, not just band-summed values. Re-grab from props.
  // We use ZooAudio's smoothed values to drive overall scaling, and rebuild
  // a per-column profile from a sine-based proxy when no buffer is exposed.
  // (The full per-bin spectrum isn't passed via RenderCtx — we synthesise
  // a wave from the four band energies for variety.)
  return {
    onFrame(rc) {
      clear(rc, '#0A0518')
      setFont(rc, rc.fontSize, '#C47EE8')
      const { cols, rows, audio } = rc
      const mid = rows / 2

      // Construct a height profile across columns from the 4 band energies
      // layered with a moving sine wave (so the shape moves even with audio).
      const t = rc.frame * 0.06
      for (let c = 0; c < cols; c++) {
        const phase = c / cols
        // Combine: bass on left, drums broad, main mid, vox right
        const bassW = Math.exp(-Math.pow((phase - 0.10) * 3, 2))
        const drumsW = 0.4 + 0.3 * Math.sin(t + phase * 8)
        const mainW = Math.exp(-Math.pow((phase - 0.45) * 2.5, 2))
        const voxW = Math.exp(-Math.pow((phase - 0.85) * 3, 2))
        const amp =
          bassW * audio.bass * 1.1 +
          drumsW * audio.drums * 0.6 +
          mainW * audio.main * 0.9 +
          voxW * audio.vox * 0.8
        const h = Math.min(mid - 1, amp * mid * 1.4)
        // Draw mirrored
        for (let r = 0; r <= h; r++) {
          const intensity = 1 - r / (mid)
          const ch =
            intensity > 0.75 ? '█' :
            intensity > 0.5 ? '▓' :
            intensity > 0.3 ? '▒' :
            intensity > 0.15 ? '░' : '·'
          rc.ctx.fillStyle = intensity > 0.5 ? '#FFCFEF' : '#C47EE8'
          rc.ctx.fillText(ch, c * rc.cellW, (mid - r) * rc.cellH)
          rc.ctx.fillText(ch, c * rc.cellW, (mid + r) * rc.cellH)
        }
      }
    },
  }
}
