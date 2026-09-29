// Four single-stem renderers, designed to be stacked into one visualiser
// via CSS mix-blend-mode. Each draws to a transparent canvas in its own
// colour and aggressively reacts to its assigned stem.
//
//   1. BLOCK     — bass: image threshold + alpha + glitch sweep
//   2. MATRIX    — drums: rain bursts on kicks, speed/trail scale with energy
//   3. EDGE      — main: Sobel edges with jitter on attack, double-stroke on energy
//   4. PARTICLES — vox: particle size + spawn-rate + speed scale with energy
//
// Each receives { energy, attack, kicked }:
//   energy  — smoothed sustained loudness (0..1)
//   attack  — fast-attack/fast-decay envelope (a recent burst)
//   kicked  — boolean transient flag — true on the frame of each spike

import type { OverlayRenderer, OverlayRenderCtx } from './OverlayPanel'

const FONT_STACK = `ui-monospace, 'JetBrains Mono', Menlo, monospace`

// ─── shared helpers ─────────────────────────────────────────────────────

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
  const c = document.createElement('canvas')
  c.width = sampleW
  c.height = sampleH
  const ctx = c.getContext('2d')!
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

function clearTransparent(rc: OverlayRenderCtx) {
  rc.ctx.clearRect(0, 0, rc.width, rc.height)
}

function setFont(rc: OverlayRenderCtx, size = rc.fontSize) {
  rc.ctx.font = `${size}px ${FONT_STACK}`
  rc.ctx.textBaseline = 'top'
  rc.ctx.textAlign = 'left'
  rc.ctx.fillStyle = rc.color
}

// ─── BLOCK ──────────────────────────────────────────────────────────────
// Bass drives EVERY visible axis:
//   energy → threshold slides wide (0.15 ↔ 0.55 → mostly empty → mostly solid)
//          → globalAlpha (0.35 ↔ 1.0)
//          → vertical scale push (image stretches taller)
//   kicked → brief 1-frame "all solid" snap (instantaneous fill flash)
// On a steady-state bass note you see the layer breathe; on a drop you see
// it slam to full.

export function createOverlayBlock(src: string): OverlayRenderer {
  let lum: Float32Array | null = null
  let subRows = 0
  let kickFlash = 0  // 1.0 immediately after kicked, decays toward 0

  return {
    src,
    onResize(rc) {
      if (!rc.img) return
      subRows = rc.rows * 2
      lum = sampleImage(rc.img, rc.cols, subRows, 0.5, 0.5, 1.0)
    },
    onFrame(rc) {
      if (!lum) return
      clearTransparent(rc)

      // Update the kick flash decay before we read it.
      if (rc.audio.kicked) kickFlash = 1
      kickFlash = Math.max(0, kickFlash - 0.18)

      // Wide threshold swing — visible change between silent and loud bass.
      const baseT = 0.20
      const t = baseT + rc.audio.energy * 0.38
      // Alpha pumps with energy — sustained loud = solid, quiet = ghostly.
      const alpha = 0.35 + rc.audio.energy * 0.65 + kickFlash * 0.3
      // Vertical scale stretches the whole BLOCK layer with bass energy —
      // up to 18% taller on a full hit. Big enough to read as "breathing".
      const scaleY = 1 + rc.audio.energy * 0.18 + kickFlash * 0.05

      rc.ctx.save()
      rc.ctx.translate(0, rc.height / 2)
      rc.ctx.scale(1, scaleY)
      rc.ctx.translate(0, -rc.height / 2)
      rc.ctx.globalAlpha = Math.min(1, alpha)
      setFont(rc, rc.fontSize * 1.04)

      // On a kick flash, force full blocks everywhere that passes threshold —
      // gives a quick "all-on" pulse.
      const forceFull = kickFlash > 0.5

      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const top = lum[(r * 2) * rc.cols + c] < t
          const bot = lum[(r * 2 + 1) * rc.cols + c] < t
          let ch = ''
          if (forceFull && (top || bot)) ch = '█'
          else if (top && bot) ch = '█'
          else if (top) ch = '▀'
          else if (bot) ch = '▄'
          if (!ch) continue
          rc.ctx.fillText(ch, c * rc.cellW, r * rc.cellH)
        }
      }
      rc.ctx.restore()
    },
  }
}

// ─── MATRIX ─────────────────────────────────────────────────────────────
// Drums hits drive everything:
//   kicked → spawn burst (8-14 drops at once) + brief colour flash
//   energy → fall speed (0.7 × baseline ↔ 4 ×)
//          → trail length (8 ↔ 24 frames)
//          → spawn rate baseline (more drops when drums is loud)
// Silent drums = empty canvas (stencil only). Each kick = visible burst.

export function createOverlayMatrix(text = '9CUPS'): OverlayRenderer {
  let stencil: Uint8Array | null = null
  const drops: { col: number, head: number, speed: number, age: number }[] = []
  const trail = new Map<string, { ch: string, age: number, life: number }>()
  const CHARS = '01ｱｲｳｴｵ#9C'
  let flash = 0

  return {
    onResize(rc) {
      const off = document.createElement('canvas')
      off.width = rc.cols
      off.height = rc.rows
      const octx = off.getContext('2d')!
      octx.fillStyle = 'black'
      octx.fillRect(0, 0, rc.cols, rc.rows)
      octx.fillStyle = 'white'
      octx.font = `bold ${rc.rows * 0.92}px ${FONT_STACK}`
      octx.textBaseline = 'middle'
      octx.textAlign = 'center'
      octx.fillText(text, rc.cols / 2, rc.rows / 2)
      const data = octx.getImageData(0, 0, rc.cols, rc.rows).data
      const out = new Uint8Array(rc.cols * rc.rows)
      for (let i = 0; i < out.length; i++) out[i] = data[i * 4] > 128 ? 1 : 0
      stencil = out
    },
    onFrame(rc) {
      if (!stencil) return
      clearTransparent(rc)
      setFont(rc, rc.fontSize)

      // Flash envelope — full white-pink immediately after a kick, decays out.
      if (rc.audio.kicked) flash = 1
      flash = Math.max(0, flash - 0.20)

      // Trail length scales with energy.
      const trailLife = 8 + Math.floor(rc.audio.energy * 16)
      // Speed multiplier scales steeply with energy.
      const speedMult = 0.7 + rc.audio.energy * 3.3

      // Decay trails
      for (const [key, t] of trail) {
        t.age++
        if (t.age >= t.life) { trail.delete(key); continue }
        const [cs, rs] = key.split(',')
        const c = +cs, r = +rs
        const fade = 1 - t.age / t.life
        rc.ctx.globalAlpha = fade
        rc.ctx.fillStyle = rc.color
        rc.ctx.fillText(t.ch, c * rc.cellW, r * rc.cellH)
      }
      rc.ctx.globalAlpha = 1

      // Move drops
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        d.head += d.speed * speedMult
        d.age++
        const r = d.head | 0
        if (r < rc.rows) {
          const ch = CHARS[(Math.random() * CHARS.length) | 0]
          trail.set(`${d.col},${r}`, { ch, age: 0, life: trailLife })
        }
        if (d.head >= rc.rows + 5 || d.age > 80) drops.splice(i, 1)
      }

      // KICK BURST: spawn 8-14 drops at once on each transient.
      if (rc.audio.kicked) {
        const burst = 8 + ((Math.random() * 7) | 0)
        for (let i = 0; i < burst; i++) {
          drops.push({
            col: (Math.random() * rc.cols) | 0,
            head: 0,
            speed: 0.6 + Math.random() * 1.2,
            age: 0,
          })
        }
      }
      // Steady trickle scales with energy (so loud sustained drums = busy rain).
      const trickle = 0.02 + rc.audio.energy * 0.18
      if (Math.random() < trickle) {
        drops.push({
          col: (Math.random() * rc.cols) | 0, head: 0,
          speed: 0.6 + Math.random() * 1.0, age: 0,
        })
      }

      // Flash colour over drops while kicked.
      if (flash > 0.05) {
        rc.ctx.globalAlpha = flash * 0.55
        rc.ctx.fillStyle = '#FFFFFF'
        for (const [key] of trail) {
          const [cs, rs] = key.split(',')
          rc.ctx.fillText('●', +cs * rc.cellW, +rs * rc.cellH)
        }
        rc.ctx.globalAlpha = 1
      }

      // Faint wordmark stencil (always readable).
      rc.ctx.globalAlpha = 0.22 + rc.audio.energy * 0.18
      rc.ctx.fillStyle = rc.color
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          if (stencil[r * rc.cols + c] !== 1) continue
          if (trail.has(`${c},${r}`)) continue
          rc.ctx.fillText('·', c * rc.cellW, r * rc.cellH)
        }
      }
      rc.ctx.globalAlpha = 1
    },
  }
}

// ─── EDGE ───────────────────────────────────────────────────────────────
// Main drives:
//   energy → threshold drops (more edges visible on louder mids)
//          → DOUBLE STROKE at high energy (each edge gets a parallel echo)
//   attack → per-cell horizontal jitter for a few frames (edges visibly shake)
//   kicked → instant "double-density" pulse (every edge is doubled)
// Silent mids = sparse, only strong edges visible. Loud = dense, shimmering.

export function createOverlayEdge(src: string): OverlayRenderer {
  let lum: Float32Array | null = null
  let cw = 0, rh = 0
  let jitter = 0  // decay envelope for cell jitter

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
      lum = sampleImage(rc.img, cw, rh, 0.5, 0.35, 1.45)
    },
    onFrame(rc) {
      if (!lum) return
      clearTransparent(rc)
      setFont(rc, rc.fontSize)

      // Update jitter envelope from attack.
      if (rc.audio.attack > jitter) jitter = rc.audio.attack
      jitter = Math.max(0, jitter - 0.10)

      // Wide threshold swing — high energy drops it a LOT so many more edges
      // fire at once.
      const threshold = 0.22 - rc.audio.energy * 0.18 - (rc.audio.kicked ? 0.10 : 0)
      const doublePass = rc.audio.energy > 0.30 || rc.audio.kicked

      // Optional brightness pulse: keep colour but boost alpha on attack.
      rc.ctx.globalAlpha = 0.55 + rc.audio.energy * 0.45 + (rc.audio.kicked ? 0.3 : 0)
      if (rc.ctx.globalAlpha > 1) rc.ctx.globalAlpha = 1

      for (let r = 0; r < rc.rows; r++) {
        const sr = r * 2
        for (let c = 0; c < rc.cols; c++) {
          const gx =
            -1 * lumAt(c - 1, sr - 1) - 2 * lumAt(c - 1, sr) - 1 * lumAt(c - 1, sr + 1)
            + 1 * lumAt(c + 1, sr - 1) + 2 * lumAt(c + 1, sr) + 1 * lumAt(c + 1, sr + 1)
          const gy =
            -1 * lumAt(c - 1, sr - 1) - 2 * lumAt(c, sr - 1) - 1 * lumAt(c + 1, sr - 1)
            + 1 * lumAt(c - 1, sr + 1) + 2 * lumAt(c, sr + 1) + 1 * lumAt(c + 1, sr + 1)
          const mag = Math.sqrt(gx * gx + gy * gy)
          if (mag < threshold) continue
          const angle = Math.atan2(gy, gx) * 180 / Math.PI
          let ch = '─'
          const a = ((angle + 180) % 180)
          if (a < 22.5 || a >= 157.5) ch = '─'
          else if (a < 67.5) ch = '╲'
          else if (a < 112.5) ch = '│'
          else ch = '╱'
          const jx = jitter > 0.1 ? (Math.random() - 0.5) * jitter * 6 : 0
          rc.ctx.fillText(ch, c * rc.cellW + jx, r * rc.cellH)
          // Double-stroke: paint an offset copy of the edge → thicker, brighter.
          if (doublePass) {
            rc.ctx.fillText(ch, c * rc.cellW + jx + 1, r * rc.cellH + 1)
          }
        }
      }
      rc.ctx.globalAlpha = 1
    },
  }
}

// ─── PARTICLES ──────────────────────────────────────────────────────────
// Vox drives:
//   energy → target particle count (0 ↔ 200)
//          → drift speed (1 × ↔ 4 ×)
//          → particle size (1 × ↔ 1.8 × fontSize)
//   kicked → burst spawn (40 particles at once with high velocity)
//          → temporary white flash on existing particles
// Silent vox = empty canvas. Loud vox = particle storm.

export function createOverlayParticles(src: string): OverlayRenderer {
  let base: Uint8Array | null = null
  interface P { c: number, r: number, vc: number, vr: number, ch: string, age: number, life: number }
  const particles: P[] = []
  const PCHARS = '0123456789·•+◆◇*'
  let flash = 0

  return {
    src,
    onResize(rc) {
      if (!rc.img) return
      const lum = sampleImage(rc.img, rc.cols, rc.rows * 2, 0.5, 0.35, 1.2)
      const grid = new Uint8Array(rc.cols * rc.rows)
      for (let r = 0; r < rc.rows; r++) {
        for (let c = 0; c < rc.cols; c++) {
          const l = (lum[(r * 2) * rc.cols + c] + lum[(r * 2 + 1) * rc.cols + c]) / 2
          grid[r * rc.cols + c] = Math.min(9, Math.floor((1 - l) * 10))
        }
      }
      base = grid
    },
    onFrame(rc) {
      if (!base) return
      clearTransparent(rc)

      if (rc.audio.kicked) flash = 1
      flash = Math.max(0, flash - 0.18)

      // Per-frame parameters driven by vox.
      const sizeMult = 1 + rc.audio.energy * 0.8
      const speedMult = 1 + rc.audio.energy * 3
      const targetCount = Math.floor(rc.audio.energy * 200)

      // Move + age existing particles.
      setFont(rc, rc.fontSize * sizeMult)
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.c += p.vc * speedMult
        p.r += p.vr * speedMult
        p.age++
        if (p.age >= p.life || p.c < 0 || p.c >= rc.cols || p.r < 0 || p.r >= rc.rows) {
          particles.splice(i, 1); continue
        }
        const fade = 1 - p.age / p.life
        rc.ctx.globalAlpha = fade
        rc.ctx.fillStyle = flash > 0.3 ? '#FFFFFF' : rc.color
        rc.ctx.fillText(p.ch, (p.c | 0) * rc.cellW, (p.r | 0) * rc.cellH)
      }
      rc.ctx.globalAlpha = 1

      // KICK BURST: spawn 40 particles at once with random fast velocities.
      if (rc.audio.kicked) {
        for (let i = 0; i < 40; i++) {
          const idx = (Math.random() * rc.cols * rc.rows) | 0
          if (base[idx] < 4) continue
          const c = idx % rc.cols
          const r = (idx / rc.cols) | 0
          const angle = Math.random() * Math.PI * 2
          const speed = 0.4 + Math.random() * 1.0
          particles.push({
            c, r,
            vc: Math.cos(angle) * speed,
            vr: Math.sin(angle) * speed * 0.7,
            ch: PCHARS[(Math.random() * PCHARS.length) | 0],
            age: 0,
            life: 18 + ((Math.random() * 16) | 0),
          })
        }
      }

      // Steady spawn toward target count.
      const want = Math.max(0, targetCount - particles.length)
      const spawnThisFrame = Math.min(want, 8)  // cap per-frame spawn
      for (let i = 0; i < spawnThisFrame; i++) {
        const idx = (Math.random() * rc.cols * rc.rows) | 0
        if (base[idx] < 4) continue
        const c = idx % rc.cols
        const r = (idx / rc.cols) | 0
        particles.push({
          c, r,
          vc: (Math.random() - 0.5) * 0.6,
          vr: (Math.random() - 0.5) * 0.4 - 0.05,
          ch: PCHARS[(Math.random() * PCHARS.length) | 0],
          age: 0,
          life: 20 + ((Math.random() * 14) | 0),
        })
      }
    },
  }
}
