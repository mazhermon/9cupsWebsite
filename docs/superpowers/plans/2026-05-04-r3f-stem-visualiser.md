# R3F Stem Visualiser Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the SVG audio visualisers on the home page with a Three.js / R3F implementation that renders four per-stem visualisers (seismograph, liquid sphere, wireframe poly, spectrum tower) inside a single shared WebGL canvas, composed as a triptych poster.

**Architecture:** Single `<Canvas>` with `@react-three/drei` `<View>` components mapping each cell `<div>` to a screen-space viewport. HTML drives layout and accessibility; WebGL drives pixels. Audio energy reaches shaders via per-frame uniform updates from `AnalyserNode.getByteFrequencyData`. No React re-renders during animation.

**Tech Stack:** Next.js 16, React 19, TypeScript, `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`. Existing: `motion`, `next/font/google` (IM Fell English, DM Sans), Tailwind v4, Web Audio API.

**Spec:** [`docs/superpowers/specs/2026-05-04-r3f-stem-visualiser-design.md`](../specs/2026-05-04-r3f-stem-visualiser-design.md)

---

## Notes for the implementing engineer

- The repo already has uncommitted in-flight code from a previous SVG iteration. The plan's deletion steps and replacements take care of what needs to go. Do not panic at the noise in `git status` — just follow the file paths.
- This project has no test framework. Verification leans on the production build, the linter, the type-checker, and live browser walkthroughs. Do not invest in adding Vitest just for this plan; the visual-and-GPU surface dominates and unit tests would cover trivial slivers.
- Every task ends in a commit. Use the message template shown in each task. Co-author tag `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` is required.
- Browser checkpoints assume the dev server is running (`npm run dev`). If a previous run is dead, restart it.
- Keep `'use client'` at the top of any component that uses hooks, refs, or effects. R3F's `<Canvas>` is client-only.
- For accessibility, the visible `<button>` is the cell wrapper. The 3D visualiser inside is `pointer-events: none` and decorative.

---

## Task 1: Install Three.js, R3F, drei, postprocessing

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `package-lock.json` (auto)

- [ ] **Step 1: Install runtime dependencies**

Run:
```bash
npm install three @react-three/fiber @react-three/drei @react-three/postprocessing
```

- [ ] **Step 2: Install Three.js types**

Run:
```bash
npm install -D @types/three
```

- [ ] **Step 3: Verify install + production build still works**

Run:
```bash
npm run build
```

Expected: `✓ Compiled successfully` and clean route output. If the build fails because of an existing in-flight TypeScript error, fix only that error — do not introduce R3F code yet.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "$(cat <<'EOF'
chore: install three, r3f, drei, postprocessing

Adds the WebGL stack the home-page visualiser will use.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create transient-detect utility

A small util the DRUMS visualiser uses to spike on kicks. Pure function, no runtime deps.

**Files:**
- Create: `lib/transient-detect.ts`

- [ ] **Step 1: Create the file**

Write `lib/transient-detect.ts`:

```ts
// Peak-vs-running-average transient detector for audio-reactive visualisers.
// Push the current frame's band energy in; receive `true` if a transient just fired.
// `windowSize` frames of history are kept for the running average.

export class TransientDetector {
  private history: number[] = []
  private windowSize: number
  private threshold: number
  private cooldown: number
  private lastFire = -Infinity

  constructor(opts: { windowSize?: number; threshold?: number; cooldownFrames?: number } = {}) {
    this.windowSize = opts.windowSize ?? 8
    this.threshold = opts.threshold ?? 1.55
    this.cooldown = opts.cooldownFrames ?? 6
  }

  /** Returns true if `current` exceeds threshold * running average and we're past cooldown. */
  push(current: number, frameIndex: number): boolean {
    this.history.push(current)
    if (this.history.length > this.windowSize) this.history.shift()
    if (this.history.length < this.windowSize) return false

    let sum = 0
    for (const v of this.history) sum += v
    const avg = sum / this.history.length
    if (avg <= 0.001) return false

    const fired = current > avg * this.threshold && frameIndex - this.lastFire > this.cooldown
    if (fired) this.lastFire = frameIndex
    return fired
  }
}
```

- [ ] **Step 2: Verify it typechecks**

Run:
```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add lib/transient-detect.ts
git commit -m "$(cat <<'EOF'
feat(lib): add TransientDetector for audio-reactive kicks

Peak-vs-running-average detector. Returns true when the current
frame's band energy exceeds threshold × running average and we're
past the cooldown window.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Remove obsolete components

The previous SVG iteration's variants and switcher are replaced wholesale.

**Files:**
- Delete: `components/VariantSwitcher/`
- Delete: `components/TrackShape/BlobMorph.tsx`
- Delete: `components/TrackShape/Crystalline.tsx`
- Delete: `components/TrackShape/PulseRings.tsx`
- Delete: `components/TrackShape/TrackShape.tsx`

- [ ] **Step 1: Delete the SVG variant components**

Run:
```bash
rm -rf components/VariantSwitcher components/TrackShape
```

- [ ] **Step 2: Verify nothing else imports from them**

Run:
```bash
grep -r "TrackShape\|VariantSwitcher" --include="*.tsx" --include="*.ts" .
```

Expected: any results are inside the deleted files (none should remain) or inside this plan / spec / `.claude/` (skill metadata — fine).

If there's a stale import in `app/page.tsx`, do not remove it yet — Task 5 rewrites that file end to end.

- [ ] **Step 3: Commit**

```bash
git add -A components/VariantSwitcher components/TrackShape
git commit -m "$(cat <<'EOF'
refactor: remove SVG TrackShape variants and VariantSwitcher

Replaced wholesale by the R3F per-stem visualisers in subsequent
commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Add triptych grid styles to globals.css

Replace the old `.hero` / `.stage` flex layout with a CSS grid that produces the triptych composition.

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace `.hero` and `.stage` rule blocks**

Open `app/globals.css`, find the existing `.hero` rule and the `.stage` / `.stage-shape-slot` rules, replace them with:

```css
/* ─── Hero (triptych) ──────────────────────────────────────────────────────── */
.hero {
  position: relative;
  width: 100vw;
  height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  align-items: stretch;
  justify-items: stretch;
  gap: var(--space-4);
  padding: clamp(var(--space-4), 3vw, var(--space-8)) clamp(var(--space-4), 4vw, var(--space-12));
  isolation: isolate;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 50% at 50% 45%, rgb(139 58 196 / 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 80% 60% at 50% 100%, rgb(59 26 110 / 0.45) 0%, transparent 60%);
  z-index: -2;
  pointer-events: none;
}

/* ─── Triptych stage ───────────────────────────────────────────────────────── */
.stage {
  position: relative;
  display: grid;
  grid-template-columns: 13fr 44fr 13fr;
  grid-template-rows: 55fr 45fr;
  grid-template-areas:
    "bass main vox"
    "bass drums vox";
  gap: var(--space-2);
  width: 100%;
  height: 100%;
  min-height: 0;  /* lets the cells actually shrink below content size */
}

.cell {
  position: relative;
  display: block;
  padding: 0;
  border: 1px solid var(--color-line);
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  overflow: hidden;
  transition:
    border-color var(--dur-fast) var(--ease-out),
    opacity var(--dur-base) var(--ease-out);
}

.cell:hover {
  border-color: var(--shape-color, var(--color-primary-light));
}

.cell:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 3px var(--shape-color, var(--color-primary-light));
}

.cell[data-muted="true"] {
  opacity: 0.28;
}

.cell--bass  { grid-area: bass; }
.cell--main  { grid-area: main; }
.cell--drums { grid-area: drums; }
.cell--vox   { grid-area: vox; }

.cell-label {
  position: absolute;
  left: var(--space-3);
  bottom: var(--space-3);
  font-family: var(--font-body);
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--color-text-faint);
  user-select: none;
  pointer-events: none;
  z-index: 2;
}

.cell-label .muted-suffix {
  font-style: italic;
  margin-left: 0.5em;
  text-transform: none;
  letter-spacing: 0.05em;
}

/* The drei <View> root inside each cell */
.cell-view {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* The shared <Canvas> overlays the entire .stage area */
.shared-canvas {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

/* ─── Mobile triptych collapse ─────────────────────────────────────────────── */
@media (max-width: 720px) {
  .stage {
    grid-template-columns: 1fr;
    grid-template-rows: repeat(4, 1fr);
    grid-template-areas:
      "main"
      "drums"
      "bass"
      "vox";
  }
}
```

- [ ] **Step 2: Remove now-orphaned styles**

In the same file, delete the old `.track-shape-wrapper`, `.track-shape-btn`, `.track-svg`, `.track-label`, `.shape-glow`, `.shape-main`, `.stage-shape-slot`, `.atmosphere`, and `.variant-switcher` rule blocks. Search for those class names and remove their rules. The `.atmosphere` div is being replaced by the existing `.hero::before` radial wash.

- [ ] **Step 3: Verify the build still succeeds**

Run:
```bash
npm run build
```

Expected: `✓ Compiled successfully`. If any TS errors remain from imports of components that don't exist yet, that's expected — Task 5 fixes `page.tsx`.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "$(cat <<'EOF'
feat(css): triptych grid layout for the hero stage

Replaces the flex-row layout with a CSS grid that produces the
four-cell triptych composition (BASS and VOX as tall pillars,
MAIN above DRUMS as the centre column). Cell hover, focus, and
muted states all live here.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Create the Cell component

A clickable, focusable, label-bearing wrapper for each stem.

**Files:**
- Create: `components/Stage/Cell.tsx`
- Delete: `components/Stage/Stage.tsx` (old flex implementation)

- [ ] **Step 1: Delete the old Stage.tsx**

Run:
```bash
rm components/Stage/Stage.tsx
```

- [ ] **Step 2: Create Cell.tsx**

Write `components/Stage/Cell.tsx`:

```tsx
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
```

- [ ] **Step 3: Typecheck**

Run:
```bash
npx tsc --noEmit
```

Expected: no output. (`page.tsx` may still reference the old Stage; we fix that in Task 7. If it errors, that's expected and we continue — those errors will resolve.)

- [ ] **Step 4: Commit**

```bash
git add components/Stage/Cell.tsx components/Stage/Stage.tsx
git commit -m "$(cat <<'EOF'
feat(stage): Cell wrapper component

Clickable, focusable button for each triptych cell. Renders any
children behind a museum-tag label, surfaces mute state via
data-muted, and exposes the cell brand colour as --shape-color.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Create the SharedCanvas component

A single full-stage `<Canvas>` with drei `<View.Port />` so that each visualiser's `<View>` (rendered inside its cell) maps to a screen-space rectangle.

**Files:**
- Create: `components/Stage/SharedCanvas.tsx`

- [ ] **Step 1: Create the file**

Write `components/Stage/SharedCanvas.tsx`:

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
import type { ReactNode } from 'react'

interface SharedCanvasProps {
  children?: ReactNode
}

/**
 * Single shared <Canvas> overlaying the .stage. Each <View> rendered inside
 * a cell's child element maps to a screen-space viewport in this canvas.
 * Pass any post-fx etc. as children.
 */
export default function SharedCanvas({ children }: SharedCanvasProps) {
  return (
    <Canvas
      className="shared-canvas"
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 35 }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
    >
      <View.Port />
      {children}
    </Canvas>
  )
}
```

- [ ] **Step 2: Typecheck**

Run:
```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add components/Stage/SharedCanvas.tsx
git commit -m "$(cat <<'EOF'
feat(stage): SharedCanvas wrapper

Single <Canvas> that overlays the triptych stage. Per-cell <View>
elements (added in subsequent tasks) map to screen-space viewports
in this canvas, sharing one render loop and post-fx pipeline.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Wire the new layout into page.tsx (placeholders, no visualisers yet)

Replace the old page.tsx that imported the now-deleted Stage and TrackShape variants. Use placeholder coloured rectangles inside each cell so we can verify the layout before introducing R3F content.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Rewrite app/page.tsx**

Replace the entire file with:

```tsx
'use client'

import { useAudioEngine } from '@/hooks/useAudioEngine'
import { RELEASE } from '@/lib/track-config'
import Wordmark from '@/components/Wordmark/Wordmark'
import Cell from '@/components/Stage/Cell'
import TrackTitle from '@/components/TrackTitle/TrackTitle'
import ListenOn from '@/components/ListenOn/ListenOn'
import PlayControl from '@/components/PlayControl/PlayControl'
import GrainOverlay from '@/components/GrainOverlay/GrainOverlay'

const STEM_URLS = RELEASE.stems.map(s => s.url)

export default function Home() {
  const { tracks, allLoaded, isPlaying, hasStarted, toggleMute, startPlayback, togglePlayback } =
    useAudioEngine(STEM_URLS)

  return (
    <>
      <a href="#stage" className="skip-link">Skip to mixer</a>

      <main className="hero" aria-label="9cups · Catching A Feeling">
        <Wordmark eyebrow={`${RELEASE.artist} presents`} />

        <section
          id="stage"
          className="stage"
          aria-label="Stem mixer. Tap a cell to mute or unmute its stem."
        >
          {RELEASE.stems.map((stem, i) => (
            <Cell
              key={stem.key}
              stemKey={stem.key}
              label={stem.label}
              color={stem.color}
              muted={tracks[i].muted}
              loaded={tracks[i].loaded}
              onToggle={() => toggleMute(i)}
            >
              {/* Placeholder content — replaced by R3F <View> in later tasks */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: '20%',
                  background: stem.color,
                  opacity: 0.12,
                  borderRadius: '50%',
                }}
              />
            </Cell>
          ))}
        </section>

        <div aria-live="polite">
          {hasStarted ? (
            <TrackTitle
              title={RELEASE.title}
              artist={RELEASE.artist}
              year={RELEASE.year}
            />
          ) : (
            <button
              type="button"
              className="cta-press-play"
              onClick={startPlayback}
              disabled={!allLoaded}
              aria-label="Start playback"
            >
              {allLoaded ? 'Press play to enter' : 'Loading the room…'}
            </button>
          )}
        </div>

        <ListenOn platforms={RELEASE.platforms} />
      </main>

      {hasStarted && (
        <PlayControl isPlaying={isPlaying} onToggle={togglePlayback} />
      )}

      <GrainOverlay />
    </>
  )
}
```

- [ ] **Step 2: Build + lint**

Run:
```bash
npm run build && npm run lint
```

Expected: build succeeds, lint reports 0 errors (warnings in `.claude/` are fine).

- [ ] **Step 3: Browser checkpoint**

Run `npm run dev` if it isn't already running. Open the local URL. Verify:
- Wordmark and eyebrow at the top.
- Four cells in the triptych: BASS pillar left, MAIN top centre, DRUMS bottom centre, VOX pillar right.
- Hairline rules between cells.
- Each cell has its `BASS` / `MAIN` / `DRUMS` / `VOX` label in the bottom-left corner.
- Each cell shows a placeholder coloured circle in its brand colour.
- Press Play CTA below.
- Listen On row below that.
- Click a cell — it should toggle the muted state (cell fades to 28%, label suffix `muted` appears).

If anything looks wrong, fix the CSS or the layout in this task before continuing.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "$(cat <<'EOF'
feat(home): wire triptych layout with placeholder cells

Cells render placeholder coloured circles where R3F visualisers
will go in subsequent tasks. Layout, muting, and accessibility
all working at this checkpoint.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Add the SharedCanvas to the layout (still no visualisers)

Drop the shared `<Canvas>` over the stage. With no `<View>` children yet, it's an empty WebGL surface — confirms the canvas is positioned correctly.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add SharedCanvas inside .stage**

In `app/page.tsx`, import:

```tsx
import SharedCanvas from '@/components/Stage/SharedCanvas'
```

Then change the `<section id="stage">` block to:

```tsx
<section
  id="stage"
  className="stage"
  aria-label="Stem mixer. Tap a cell to mute or unmute its stem."
>
  {RELEASE.stems.map((stem, i) => (
    <Cell
      key={stem.key}
      stemKey={stem.key}
      label={stem.label}
      color={stem.color}
      muted={tracks[i].muted}
      loaded={tracks[i].loaded}
      onToggle={() => toggleMute(i)}
    >
      {/* The visualiser <View> goes here — added per-stem in later tasks */}
    </Cell>
  ))}

  <SharedCanvas />
</section>
```

The placeholder coloured circle is removed. Cells will appear empty until visualisers land.

- [ ] **Step 2: Build**

Run:
```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Browser checkpoint**

Reload the local URL. Verify:
- Cells are visible but empty (no placeholder circles, no 3D content yet).
- Cell labels still in the corners.
- Click toggling still works.
- DevTools → Elements: confirm a `<canvas class="shared-canvas">` exists inside `.stage`.
- DevTools → Console: no errors (a "creating WebGL context" log line in dev is fine).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "$(cat <<'EOF'
feat(stage): mount SharedCanvas inside the stage

Empty WebGL canvas overlays the cells. Per-stem visualisers will
mount as <View> children inside each Cell in subsequent commits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Build the BASS visualiser (vertical seismograph)

Single thick vertical line whose x-coordinate at each y-position is a smoothed running buffer of sub-bass amplitude.

**Files:**
- Create: `components/visualisers/BassLine.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create BassLine.tsx**

Write `components/visualisers/BassLine.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { View } from '@react-three/drei'
import * as THREE from 'three'
import { bandEnergy, lerpToward, prefersReducedMotion } from '@/lib/audio-reactive'

interface BassLineProps {
  analyser: AnalyserNode | null
  muted: boolean
  color: string
}

const VERTEX_COUNT = 80
const LINE_WIDTH = 0.06
const HEIGHT = 4.6   // world-space height of the cell viewport
const X_SCALE = 0.55 // max horizontal swing in world units

export default function BassLine({ analyser, muted: _muted, color }: BassLineProps) {
  const xOffsets = useRef<number[]>(new Array(VERTEX_COUNT).fill(0))
  const dataRef = useRef<Uint8Array | null>(null)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = prefersReducedMotion()
  }, [])

  // Build a TubeGeometry path
  const curveRef = useRef(new THREE.CatmullRomCurve3([], false, 'catmullrom', 0.4))
  const geometryRef = useRef<THREE.TubeGeometry | null>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)

  // Static base points along the y-axis
  const basePoints = useMemo(() => {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i < VERTEX_COUNT; i++) {
      const t = i / (VERTEX_COUNT - 1)
      const y = (0.5 - t) * HEIGHT
      pts.push(new THREE.Vector3(0, y, 0))
    }
    return pts
  }, [])

  // Initial geometry on mount
  useEffect(() => {
    curveRef.current.points = basePoints.map(p => p.clone())
    const geom = new THREE.TubeGeometry(curveRef.current, VERTEX_COUNT * 2, LINE_WIDTH, 6, false)
    geometryRef.current = geom
    if (meshRef.current) meshRef.current.geometry = geom
    return () => geom.dispose()
  }, [basePoints])

  useFrame(() => {
    if (reducedMotion.current) return
    if (document.hidden) return
    if (!meshRef.current) return

    const offsets = xOffsets.current
    let energy = 0

    if (analyser) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      energy = bandEnergy(dataRef.current, 1, 12)
    }

    // Shift offsets down (waveform travels), inject new value at top
    for (let i = offsets.length - 1; i > 0; i--) offsets[i] = offsets[i - 1]
    offsets[0] = lerpToward(offsets[0], (energy * 2 - 1) * X_SCALE, 0.45)

    // Update curve points
    const points = curveRef.current.points
    for (let i = 0; i < VERTEX_COUNT; i++) {
      points[i].x = lerpToward(points[i].x, offsets[i], 0.40)
    }

    // Rebuild geometry (TubeGeometry is small — 80 verts × 6 radial = 480 verts)
    const old = meshRef.current.geometry
    const next = new THREE.TubeGeometry(curveRef.current, VERTEX_COUNT * 2, LINE_WIDTH, 6, false)
    meshRef.current.geometry = next
    old.dispose()
  })

  return (
    <View className="cell-view">
      {/* Slight bloom-friendly emissive material */}
      <mesh ref={meshRef}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </View>
  )
}
```

- [ ] **Step 2: Wire BassLine into page.tsx**

In `app/page.tsx`:

a. Add the import at the top:

```tsx
import BassLine from '@/components/visualisers/BassLine'
```

b. Add `analysers` to the destructure from `useAudioEngine`:

```tsx
const { tracks, allLoaded, isPlaying, hasStarted, analysers, toggleMute, startPlayback, togglePlayback } =
  useAudioEngine(STEM_URLS)
```

c. Inside the `RELEASE.stems.map` loop, render BassLine as a child of the Cell when the stem is bass. Replace the empty children comment:

```tsx
{stem.key === 'bass' && (
  <BassLine analyser={analysers[i]} muted={tracks[i].muted} color={stem.color} />
)}
```

- [ ] **Step 3: Build + lint**

Run:
```bash
npm run build && npm run lint
```

Expected: clean build, 0 errors.

- [ ] **Step 4: Browser checkpoint**

Reload. Verify:
- The BASS pillar cell now contains a thin vertical line (initially straight at centre).
- Press Play. The line should start to wobble left-right with the bass content.
- Mute BASS by clicking the cell. The line freezes (because gain → 0 → analyser silent → smoothed offsets decay to 0). Cell fades to 28%.
- Other cells remain empty.

If the line is invisible, check:
- Cell viewport mapping (the `<View>` should fill the cell — `position: absolute; inset: 0` is set in `.cell-view` CSS).
- That `analysers[i]` is non-null after Press Play (DevTools → React inspector).

- [ ] **Step 5: Commit**

```bash
git add components/visualisers/BassLine.tsx app/page.tsx
git commit -m "$(cat <<'EOF'
feat(visualisers): BASS — vertical seismograph

Thick vertical TubeGeometry line whose x-coordinate at each
y-position is a smoothed running buffer of sub-bass amplitude.
Resting straight; whips on bass hits.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Build the MAIN visualiser (liquid sphere)

High-poly icosahedron with vertex displacement driven by simplex noise + audio energy. Custom GLSL injected into MeshStandardMaterial via `onBeforeCompile`.

**Files:**
- Create: `components/visualisers/MainSphere.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create MainSphere.tsx**

Write `components/visualisers/MainSphere.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { View, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { bandEnergy, lerpToward, prefersReducedMotion } from '@/lib/audio-reactive'

interface MainSphereProps {
  analyser: AnalyserNode | null
  muted: boolean
  color: string
}

// 3D simplex noise (Ashima Arts, public domain) — used in the vertex shader.
const SIMPLEX_NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`

export default function MainSphere({ analyser, muted: _muted, color }: MainSphereProps) {
  const meshRef = useRef<THREE.Mesh | null>(null)
  const energyRef = useRef(0)
  const dataRef = useRef<Uint8Array | null>(null)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = prefersReducedMotion()
  }, [])

  // Custom material: MeshStandardMaterial with a vertex shader injection.
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.35,
      metalness: 0.6,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.25,
    })
    const uniforms = {
      uTime:    { value: 0 },
      uEnergy:  { value: 0 },
      uDispScale: { value: 0.45 },
      uNoiseFreq: { value: 1.6 },
    }
    mat.userData.uniforms = uniforms
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime
      shader.uniforms.uEnergy = uniforms.uEnergy
      shader.uniforms.uDispScale = uniforms.uDispScale
      shader.uniforms.uNoiseFreq = uniforms.uNoiseFreq
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `
          #include <common>
          uniform float uTime;
          uniform float uEnergy;
          uniform float uDispScale;
          uniform float uNoiseFreq;
          ${SIMPLEX_NOISE_GLSL}
        `)
        .replace('#include <begin_vertex>', `
          float n = snoise(position * uNoiseFreq + vec3(uTime * 0.3));
          float displacement = n * (0.18 + uEnergy * uDispScale);
          vec3 transformed = position + normal * displacement;
        `)
    }
    return mat
  }, [color])

  useFrame((_, delta) => {
    if (document.hidden) return
    const u = material.userData.uniforms
    u.uTime.value += delta

    if (reducedMotion.current) {
      u.uEnergy.value = 0
      return
    }

    let target = 0
    if (analyser) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      target = bandEnergy(dataRef.current, 5, 90)
    }
    energyRef.current = lerpToward(energyRef.current, target, 0.20)
    u.uEnergy.value = energyRef.current

    if (meshRef.current && !reducedMotion.current) {
      meshRef.current.rotation.y += delta * 0.12
      meshRef.current.rotation.x += delta * 0.04
    }
  })

  return (
    <View className="cell-view">
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={40} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} />
      <mesh ref={meshRef} material={material}>
        <icosahedronGeometry args={[1, 4]} />
      </mesh>
    </View>
  )
}
```

- [ ] **Step 2: Wire MainSphere into page.tsx**

In `app/page.tsx`, import and add inside the cell loop alongside the BASS conditional:

```tsx
import MainSphere from '@/components/visualisers/MainSphere'
```

```tsx
{stem.key === 'main' && (
  <MainSphere analyser={analysers[i]} muted={tracks[i].muted} color={stem.color} />
)}
```

- [ ] **Step 3: Build + lint**

Run:
```bash
npm run build && npm run lint
```

Expected: clean.

- [ ] **Step 4: Browser checkpoint**

Reload. Verify:
- MAIN cell contains a smooth shaded purple sphere.
- Press Play. The sphere's surface should warp organically with mid-band audio.
- Sphere rotates slowly.
- Mute MAIN: sphere stops warping (gain → 0 → energy → 0). Cell fades.
- BASS still works.

If the sphere is too dark, increase `emissiveIntensity` to 0.4. If too bright, drop to 0.15.
If displacement is too aggressive, lower `uDispScale` default to 0.30.

- [ ] **Step 5: Commit**

```bash
git add components/visualisers/MainSphere.tsx app/page.tsx
git commit -m "$(cat <<'EOF'
feat(visualisers): MAIN — liquid sphere with shader displacement

High-poly icosahedron, MeshStandardMaterial extended via
onBeforeCompile to inject 3D simplex noise vertex displacement
modulated by mid-band audio energy. Slow idle rotation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Build the DRUMS visualiser (wireframe icosahedron + transient kick)

Low-poly icosahedron rendered as edges; rotates idle, expands on transients via a uniform spike with exponential decay.

**Files:**
- Create: `components/visualisers/DrumsWireframe.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create DrumsWireframe.tsx**

Write `components/visualisers/DrumsWireframe.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { View, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { bandEnergy, lerpToward, prefersReducedMotion } from '@/lib/audio-reactive'
import { TransientDetector } from '@/lib/transient-detect'

interface DrumsProps {
  analyser: AnalyserNode | null
  muted: boolean
  color: string
}

export default function DrumsWireframe({ analyser, muted: _muted, color }: DrumsProps) {
  const groupRef = useRef<THREE.Group | null>(null)
  const lineRef  = useRef<THREE.LineSegments | null>(null)
  const dataRef  = useRef<Uint8Array | null>(null)
  const detector = useRef(new TransientDetector({ windowSize: 10, threshold: 1.6, cooldownFrames: 7 }))
  const flashRef = useRef(0) // 0..1 decaying after a kick
  const energyRef = useRef(0)
  const frameIdx = useRef(0)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = prefersReducedMotion()
  }, [])

  const { geometry, baseScale } = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(1, 1)
    const edges = new THREE.EdgesGeometry(ico)
    ico.dispose()
    return { geometry: edges, baseScale: 1.0 }
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    if (document.hidden) return
    frameIdx.current++
    if (groupRef.current && !reducedMotion.current) {
      groupRef.current.rotation.y += delta * 0.35
      groupRef.current.rotation.x += delta * 0.15
    }
    if (!lineRef.current) return

    let target = 0
    if (analyser) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      target = bandEnergy(dataRef.current, 4, 50)
    }
    energyRef.current = lerpToward(energyRef.current, target, 0.42)

    if (!reducedMotion.current && detector.current.push(target, frameIdx.current)) {
      flashRef.current = 1
    }
    flashRef.current = Math.max(0, flashRef.current - delta * 4.0) // 250ms decay

    const scale = baseScale + flashRef.current * 0.18 + energyRef.current * 0.05
    lineRef.current.scale.setScalar(scale)
    const mat = lineRef.current.material as THREE.LineBasicMaterial
    mat.opacity = 0.55 + flashRef.current * 0.45
  })

  return (
    <View className="cell-view">
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={42} />
      <group ref={groupRef}>
        <lineSegments ref={lineRef} geometry={geometry}>
          <lineBasicMaterial
            color={color}
            transparent
            opacity={0.55}
            depthWrite={false}
            toneMapped={false}
          />
        </lineSegments>
      </group>
    </View>
  )
}
```

- [ ] **Step 2: Wire into page.tsx**

```tsx
import DrumsWireframe from '@/components/visualisers/DrumsWireframe'
```

```tsx
{stem.key === 'drums' && (
  <DrumsWireframe analyser={analysers[i]} muted={tracks[i].muted} color={stem.color} />
)}
```

- [ ] **Step 3: Build + lint**

Run:
```bash
npm run build && npm run lint
```

Expected: clean.

- [ ] **Step 4: Browser checkpoint**

Reload. Verify:
- DRUMS cell contains a rotating crimson wireframe icosahedron.
- Press Play. On each kick, the icosahedron should briefly expand and the edges flash brighter, then settle.
- Mute DRUMS: rotation continues (idle motion is allowed; only transient flashes stop). If you want the rotation to also stop when muted, gate it on the energy level later — for now, idle rotation persists.
- BASS and MAIN still work.

If transients fire too often (icosahedron jittering constantly), raise `threshold` to 1.75. If they barely fire, lower to 1.4.

- [ ] **Step 5: Commit**

```bash
git add components/visualisers/DrumsWireframe.tsx app/page.tsx
git commit -m "$(cat <<'EOF'
feat(visualisers): DRUMS — wireframe icosahedron with transient kicks

Edges-only icosahedron, idle rotation, brief expansion + emissive
flash on detected kick transients via TransientDetector on bins
4–50.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Build the VOX visualiser (vertical spectrum tower)

24 horizontal rings stacked vertically; each ring's scale + emissive intensity bound to a frequency bin.

**Files:**
- Create: `components/visualisers/VoxTower.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create VoxTower.tsx**

Write `components/visualisers/VoxTower.tsx`:

```tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { View, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import { lerpToward, prefersReducedMotion } from '@/lib/audio-reactive'

interface VoxProps {
  analyser: AnalyserNode | null
  muted: boolean
  color: string
}

const RING_COUNT = 24
const RANGE_START = 18
const RANGE_END   = 200
const TOWER_HEIGHT = 4.4
const RING_RADIUS_BASE = 0.25
const RING_RADIUS_MAX  = 0.95

export default function VoxTower({ analyser, muted: _muted, color }: VoxProps) {
  const meshRef = useRef<THREE.InstancedMesh | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const ringValues = useRef<number[]>(new Array(RING_COUNT).fill(0))
  const groupRef = useRef<THREE.Group | null>(null)
  const reducedMotion = useRef(false)
  const tempObj = useMemo(() => new THREE.Object3D(), [])
  const tempColor = useMemo(() => new THREE.Color(), [])
  const baseColor = useMemo(() => new THREE.Color(color), [color])

  useEffect(() => {
    reducedMotion.current = prefersReducedMotion()
  }, [])

  useEffect(() => {
    if (!meshRef.current) return
    // Equally-spaced rings on init
    for (let i = 0; i < RING_COUNT; i++) {
      const t = i / (RING_COUNT - 1)
      tempObj.position.set(0, (0.5 - t) * TOWER_HEIGHT, 0)
      tempObj.rotation.set(Math.PI / 2, 0, 0)
      tempObj.scale.setScalar(RING_RADIUS_BASE)
      tempObj.updateMatrix()
      meshRef.current.setMatrixAt(i, tempObj.matrix)
      meshRef.current.setColorAt(i, baseColor)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  }, [tempObj, baseColor])

  useFrame((_, delta) => {
    if (document.hidden) return
    if (groupRef.current && !reducedMotion.current) {
      groupRef.current.rotation.y += delta * 0.08
    }
    if (!meshRef.current) return

    let bins: Uint8Array | null = null
    if (analyser) {
      if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
        dataRef.current = new Uint8Array(analyser.frequencyBinCount)
      }
      analyser.getByteFrequencyData(dataRef.current as Uint8Array<ArrayBuffer>)
      bins = dataRef.current as Uint8Array<ArrayBuffer>
    }

    const range = RANGE_END - RANGE_START
    for (let i = 0; i < RING_COUNT; i++) {
      const t = i / (RING_COUNT - 1)
      const binIdx = Math.floor(RANGE_START + t * range)
      const target = bins ? (bins[binIdx] / 255) : 0
      const smoothed = (ringValues.current[i] = reducedMotion.current
        ? 0
        : lerpToward(ringValues.current[i], target, 0.25))

      const radius = RING_RADIUS_BASE + smoothed * (RING_RADIUS_MAX - RING_RADIUS_BASE)
      tempObj.position.set(0, (0.5 - t) * TOWER_HEIGHT, 0)
      tempObj.rotation.set(Math.PI / 2, 0, 0)
      tempObj.scale.setScalar(radius)
      tempObj.updateMatrix()
      meshRef.current.setMatrixAt(i, tempObj.matrix)

      tempColor.copy(baseColor).multiplyScalar(0.55 + smoothed * 0.8)
      meshRef.current.setColorAt(i, tempColor)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <View className="cell-view">
      <PerspectiveCamera makeDefault position={[0, 0, 4.2]} fov={36} />
      <group ref={groupRef}>
        <instancedMesh ref={meshRef} args={[undefined, undefined, RING_COUNT]}>
          <torusGeometry args={[1, 0.025, 8, 64]} />
          <meshBasicMaterial transparent opacity={0.85} toneMapped={false} />
        </instancedMesh>
      </group>
    </View>
  )
}
```

- [ ] **Step 2: Wire into page.tsx**

```tsx
import VoxTower from '@/components/visualisers/VoxTower'
```

```tsx
{stem.key === 'vox' && (
  <VoxTower analyser={analysers[i]} muted={tracks[i].muted} color={stem.color} />
)}
```

- [ ] **Step 3: Build + lint**

Run:
```bash
npm run build && npm run lint
```

Expected: clean.

- [ ] **Step 4: Browser checkpoint**

Reload. Verify:
- VOX cell contains a vertical column of 24 thin magenta rings.
- Press Play. Each ring's radius should respond to its frequency bin, creating a tower that sways with the vocal energy.
- Tower rotates very slowly.
- Mute VOX: rings settle to small equal radii, rotation may continue (idle rotation is fine).
- All four cells now visualise their stem.

- [ ] **Step 5: Commit**

```bash
git add components/visualisers/VoxTower.tsx app/page.tsx
git commit -m "$(cat <<'EOF'
feat(visualisers): VOX — vertical spectrum tower

24 instanced torus rings stacked along the y-axis. Each ring's
radius and emissive intensity bound to a frequency bin in the
vocal range (18–200). Slow y-axis rotation.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Add the post-fx pipeline (bloom + vignette + grain)

Apply the post-fx chain to the SharedCanvas so all four visualisers are unified by the same atmospheric treatment.

**Files:**
- Create: `components/visualisers/PostFx.tsx`
- Modify: `components/Stage/SharedCanvas.tsx`

- [ ] **Step 1: Create PostFx.tsx**

Write `components/visualisers/PostFx.tsx`:

```tsx
'use client'

import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export default function PostFx() {
  return (
    <EffectComposer multisampling={0} disableNormalPass>
      <Bloom
        intensity={0.55}
        luminanceThreshold={0.20}
        luminanceSmoothing={0.85}
        mipmapBlur
      />
      <Vignette
        offset={0.30}
        darkness={0.55}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={0.04}
        blendFunction={BlendFunction.OVERLAY}
        premultiply
      />
    </EffectComposer>
  )
}
```

- [ ] **Step 2: Mount PostFx inside SharedCanvas**

Modify `components/Stage/SharedCanvas.tsx`:

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'
import PostFx from '@/components/visualisers/PostFx'

export default function SharedCanvas() {
  return (
    <Canvas
      className="shared-canvas"
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 5], fov: 35 }}
      eventSource={typeof document !== 'undefined' ? document.body : undefined}
      eventPrefix="client"
    >
      <View.Port />
      <PostFx />
    </Canvas>
  )
}
```

(Note: with bloom we drop MSAA — bloom does its own anti-aliasing. Cheaper.)

- [ ] **Step 3: Build + lint**

Run:
```bash
npm run build && npm run lint
```

Expected: clean.

- [ ] **Step 4: Browser checkpoint**

Reload. Verify:
- Visualisers now have a soft glow / bloom around bright areas.
- A subtle vignette darkens the corners of the canvas (not the whole page — just the canvas region).
- Faint film noise overlay across the whole canvas (subtle, not gritty).
- Performance still fluid.

If bloom is too strong, lower `intensity` to 0.35. If too subtle, raise to 0.75.

- [ ] **Step 5: Commit**

```bash
git add components/visualisers/PostFx.tsx components/Stage/SharedCanvas.tsx
git commit -m "$(cat <<'EOF'
feat(visualisers): post-fx chain (bloom + vignette + grain)

EffectComposer with mipmap-blur bloom, soft vignette, and a low
opacity noise overlay. Unifies all four visualisers under one
atmospheric treatment.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Per-cell loading progress arc

While a stem hasn't decoded, draw a hairline arc around its cell perimeter that fills as it loads. No spinner, no overlay screen.

**Files:**
- Modify: `components/Stage/Cell.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add a loading arc to Cell.tsx**

Modify `components/Stage/Cell.tsx`. Add a `loadProgress` prop and render a perimeter SVG when `!loaded`:

```tsx
'use client'

import { forwardRef, type ReactNode } from 'react'
import type { StemKey } from '@/lib/track-config'

interface CellProps {
  stemKey: StemKey
  label: string
  color: string
  muted: boolean
  loaded: boolean
  loadProgress: number
  onToggle: () => void
  children?: ReactNode
}

const Cell = forwardRef<HTMLButtonElement, CellProps>(function Cell(
  { stemKey, label, color, muted, loaded, loadProgress, onToggle, children },
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

      {!loaded && (
        <svg
          className="cell-loader"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect
            x="0.5"
            y="0.5"
            width="99"
            height="99"
            fill="none"
            stroke={color}
            strokeWidth="0.6"
            strokeOpacity="0.7"
            strokeDasharray="396"
            strokeDashoffset={396 * (1 - loadProgress / 100)}
            style={{ transition: 'stroke-dashoffset 220ms cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
      )}

      <span className="cell-label" aria-hidden="true">
        {label}
        {muted && <span className="muted-suffix">muted</span>}
      </span>
    </button>
  )
})

export default Cell
```

- [ ] **Step 2: Add the .cell-loader CSS**

In `app/globals.css`, after the `.cell-view` rule, add:

```css
.cell-loader {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}
```

- [ ] **Step 3: Pass loadProgress from page.tsx**

In `app/page.tsx`, update the Cell render to pass `loadProgress={tracks[i].loadProgress}`:

```tsx
<Cell
  key={stem.key}
  stemKey={stem.key}
  label={stem.label}
  color={stem.color}
  muted={tracks[i].muted}
  loaded={tracks[i].loaded}
  loadProgress={tracks[i].loadProgress}
  onToggle={() => toggleMute(i)}
>
  ...
</Cell>
```

- [ ] **Step 4: Build + lint**

Run:
```bash
npm run build && npm run lint
```

Expected: clean.

- [ ] **Step 5: Browser checkpoint**

Hard-reload (Cmd+Shift+R). Watch:
- Each cell's perimeter has a thin brand-coloured rectangle that fills clockwise as the stem loads. Once loaded, it disappears.
- Visualiser is visible inside the cell during loading (resting state).
- After all four are loaded, Press Play CTA enables.

If the rectangle outline is too prominent, lower `strokeWidth` to 0.4. If it's invisible against the visualiser, raise to 0.8.

- [ ] **Step 6: Commit**

```bash
git add components/Stage/Cell.tsx app/globals.css app/page.tsx
git commit -m "$(cat <<'EOF'
feat(stage): per-cell loading progress arc

Hairline rectangle around each cell perimeter, filling as the
stem decodes. No separate loading overlay; the page IS the
loading state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Reduced-motion verification

Confirm every visualiser respects `prefers-reduced-motion`.

**Files:**
- (Verification only; bug fixes if any)

- [ ] **Step 1: Force reduced motion in DevTools**

In Chrome DevTools → Cmd+Shift+P → "Show Rendering" → "Emulate CSS media feature prefers-reduced-motion: reduce".

Reload the page.

- [ ] **Step 2: Verify each visualiser**

- BASS: line locked at centred straight, no horizontal motion regardless of audio.
- MAIN: sphere static, no rotation, no displacement (uEnergy stays 0).
- DRUMS: wireframe icosahedron static (no rotation, no transient flash).
  - Note: the current implementation in Task 11 conditions rotation on `!reducedMotion.current`. If rotation is still happening, double-check that the `useFrame` in `DrumsWireframe.tsx` gates the rotation on the ref.
- VOX: rings at equal small radius, no rotation, no spectrum response.
- Audio still plays normally (Press Play; you should hear the track).
- Mute toggling still works (clicking a cell still mutes; the cell still fades).

- [ ] **Step 3: Fix any visualiser that fails**

If any visualiser shows motion under reduced-motion, edit the relevant file to add the `if (reducedMotion.current) return` early-out (or skip the rotation specifically). Build + lint after each fix.

- [ ] **Step 4: Disable the emulation**

Toggle off the rendering emulation; reload to confirm full motion is back.

- [ ] **Step 5: Commit if any fixes were made**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(visualisers): respect prefers-reduced-motion in <ALL the components you fixed>

Verified manually: every visualiser now freezes to a static
resting expression under prefers-reduced-motion: reduce; audio
still plays; mute toggling still works.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If no fixes were needed, skip the commit.

---

## Task 16: Mobile viewport verification

Verify the triptych collapses cleanly to a vertical stack on phones.

- [ ] **Step 1: Resize the dev tools viewport to 390 × 844 (iPhone 14)**

Use Chrome DevTools → Device Toolbar → "iPhone 14" or set custom 390×844.

- [ ] **Step 2: Verify**

- Cells stack vertically: MAIN, DRUMS, BASS, VOX (matches the mobile grid-template-areas from Task 4).
- Each cell takes full viewport width.
- Visualisers fit their cells.
- Press Play CTA visible.
- Listen On row visible (may wrap to two rows of pills).
- Play control visible at bottom-right corner.
- Tap a cell — mute toggles correctly.

- [ ] **Step 3: Resize down to 360 × 800 (small Android)**

Verify everything still fits and works.

- [ ] **Step 4: Fix anything that's broken**

Likely candidates:
- Cells too tall to fit four-stacked in `100dvh`. If so, change the mobile `grid-template-rows` in `app/globals.css` to `repeat(4, minmax(0, 1fr))` and reduce the hero's `gap`.
- Visualisers cropped or mis-positioned within tall thin cells. Re-frame the cameras (move closer / wider FOV) for tall aspect ratios. Tweak the camera `fov` in the relevant visualiser.

- [ ] **Step 5: Commit if any fixes were made**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(stage): mobile triptych collapse layout

<describe what you changed>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: Performance pass

Measure that we're holding 60fps during heavy playback. Apply fallback levers if not.

- [ ] **Step 1: Open DevTools → Performance**

Reload the page, click Press Play, then start a Performance recording for ~10 seconds during a heavy bass-and-drums section. Stop.

- [ ] **Step 2: Inspect frame rate**

In the Performance panel's frames row:
- Target: ≥55fps median, ≥30fps p95 minimum.
- Look for: dropped frames, long tasks (red triangles), garbage-collection spikes.

- [ ] **Step 3: Check the JS heap**

DevTools → Memory → take a heap snapshot. Look for accumulating Uint8Arrays or Three.js geometries — if memory grows over time during playback, we have a leak (likely in BassLine's per-frame `new TubeGeometry`).

If BassLine memory grows: rewrite to update positions on a single TubeGeometry instead of allocating a new one each frame (use `geometry.attributes.position.needsUpdate = true` after mutating the buffer in place).

- [ ] **Step 4: Apply fallbacks if needed**

If perf is below target on a real device:

a. **Drop bloom** (heaviest effect): in `PostFx.tsx`, comment out or remove the `<Bloom>` element. Rebuild. Re-measure.

b. **Lower MainSphere subdivision**: in `MainSphere.tsx`, change `<icosahedronGeometry args={[1, 4]} />` to `args={[1, 3]}` (162 verts instead of 642).

c. **Lower DPR**: in `SharedCanvas.tsx`, change `dpr={[1, 2]}` to `dpr={[1, 1.5]}` to skip native Retina rasterization.

d. **Disable VOX rotation**: in `VoxTower.tsx`, remove the rotation in `useFrame`.

Apply just enough levers to hit target. Document which levers were applied in the commit message.

- [ ] **Step 5: Real-device test if possible**

If a phone is available, get the page on it (`http://<local-ip>:<port>`) and use the actual device to verify smooth playback. iOS Safari and a 2022+ Android Chrome are both worth a check.

- [ ] **Step 6: Commit any perf fixes**

```bash
git add -A
git commit -m "$(cat <<'EOF'
perf(visualisers): <levers applied>

<description of measured baseline and what the changes did>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: Accessibility audit

Confirm WCAG 2.2 AA basics.

- [ ] **Step 1: Keyboard walk**

With the page loaded:
- Tab from the top. Skip-to-content link should appear. Hit Enter; focus jumps to the stage.
- Tab through. Each cell receives focus in turn (BASS, MAIN, DRUMS, VOX). Each cell has a visible 3px ring inside the gridlines in its brand colour.
- Hit Space on a focused cell. The cell's `aria-pressed` flips and visually mutes.
- Tab to the Press Play CTA, hit Enter. Audio starts.
- Tab to the Listen On pills. Each opens in a new tab.

- [ ] **Step 2: Run axe DevTools (or similar) on the page**

If you have the axe DevTools browser extension, run it. Resolve any contrast or label issues it flags.

If you don't, manually check:
- Each `<button>` has an accessible name (DevTools → Accessibility tab on the focused node).
- Skip-to-content link target (`#stage`) is present and a focus target.
- Cells have `aria-pressed` reflecting mute state.

- [ ] **Step 3: Fix any issues**

If any cell has a missing or wrong `aria-label`, fix it in `Cell.tsx`. If contrast on the museum-tag label is too low, raise the colour from `--color-text-faint` to `--color-text-muted` in `app/globals.css`.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "$(cat <<'EOF'
fix(a11y): <description>

<what was wrong and what changed>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 19: Final lint, typecheck, and production build

Confirm a shippable state.

- [ ] **Step 1: Typecheck**

```bash
npx tsc --noEmit
```

Expected: clean (no output).

- [ ] **Step 2: Lint**

```bash
npm run lint
```

Expected: 0 errors. Pre-existing warnings inside `.claude/` are fine (skill bundles, not project code).

- [ ] **Step 3: Production build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`. Note bundle size — for sanity-check, the `/` route should be in the few hundred kB range due to Three.js. If it's over 1 MB, double-check that we're not double-importing anything.

- [ ] **Step 4: Production preview**

Optional but good:

```bash
npm run start
```

Open the local URL. Confirm everything looks the same as in dev. (Sometimes post-fx behaves slightly differently in production builds.)

- [ ] **Step 5: Final commit**

If anything changed in this task (unlikely):

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore: final polish — typecheck, lint, build verification

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If nothing changed, skip the commit. The implementation is complete.

---

## Acceptance criteria recap (from the spec)

- [ ] All four visualisers render at 60fps on a Pixel 6 in Chrome with audio playing.
- [ ] Mute on each cell stops the corresponding stem and that cell visually settles to its resting state.
- [ ] `prefers-reduced-motion` users see static visualisers and audio plays normally.
- [ ] Tab navigation reaches all four cells and the play control in a sensible order, with visible focus rings.
- [ ] Lighthouse perf score ≥85 on mobile with audio loaded.
- [ ] Production build (`next build`) succeeds with zero errors.
- [ ] Implementation matches the composition and per-stem treatments described in the spec.

---

## What's deliberately not in this plan

(Captured in the spec under "Future iterations" — engineer should not bolt these on opportunistically.)

- Combined-output visualiser (5th analyser).
- Multiple releases / track switcher.
- Recording / sharing remixes.
- Cover art / hero photography integration.

If the user asks for any of those during implementation, stop and ask whether to add a follow-up plan.
