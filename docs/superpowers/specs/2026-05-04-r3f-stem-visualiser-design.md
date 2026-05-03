# 9cups Home Page Hero — R3F Stem Visualiser

Design spec for the audio-reactive home page hero. Replaces the SVG `feTurbulence` and SVG path-morph implementations with a Three.js / `@react-three/fiber` (R3F) approach. Anchored in `PRODUCT.md`, `DESIGN.md`, and `.claude/skills/9cups-brand/`.

## Goal

Turn the home page into an exhibition-quality audio-reactive piece. Four stem visualisers (bass, drums, main, vox) each with their own visual vocabulary, composed as a triptych poster. Smooth on a mid-tier 2022+ Android phone.

## Non-goals

- A complete site. This spec covers a single hero surface; the rest of the site is built later.
- A combined-output visualiser. Captured under "Future iterations." Easy to add as a fifth analyser node later.
- A track switcher / multiple-release support. The release is hardcoded via `lib/track-config.ts`.
- A cover-art / hero-photography integration. Brand canon allows it; not in this iteration.
- Recording or sharing remixes. Future iteration.

## Composition

Triptych altar layout. Two tall pillar cells (`BASS`, `VOX`) flanking a stacked centre column (`MAIN` above, `DRUMS` below). Aligns with the brand's printmaking instinct (frame-within-frame, rectangle-within-square). MAIN reads as the lead voice; the others support.

```
┌──────────────────────────────────────────────────────────────┐
│   9cups                              tap a cell to mute      │
├──────┬─────────────────────────────────────┬─────────────────┤
│      │                                     │                 │
│      │            MAIN                     │                 │
│ BASS │    (large square,                   │      VOX        │
│      │     liquid sphere)                  │  (tall stack)   │
│      ├─────────────────────────────────────┤                 │
│      │           DRUMS                     │                 │
│      │    (medium square,                  │                 │
│      │     wireframe poly)                 │                 │
├──────┴─────────────────────────────────────┴─────────────────┤
│   Catching A Feeling                                         │
│   DJ 9CUPS · 2026                                            │
│   LISTEN ON   Spotify · Apple Music · Bandcamp · SC · YT M   │
└──────────────────────────────────────────────────────────────┘
```

### Cell sizing (approx, tunable in implementation)

- BASS pillar: 12–14% viewport width × full stage height
- VOX pillar: 12–14% viewport width × full stage height
- MAIN: 40–44% viewport width × ~55% stage height
- DRUMS: 40–44% viewport width × ~45% stage height
- Gutters between cells equal `--space-2` (8px)

### Cell language

- 1px hairline rules in `--color-line` define the grid scaffold (Bauhaus structure as voice).
- Museum-tag label in each cell's bottom-left corner: tracked caps, 0.625rem, low contrast (`--color-text-faint`), e.g. `BASS`.
- Hover (desktop): the cell's hairline picks up the cell's brand colour at full opacity. Cursor pointer.
- Focus: 3px brand-colour ring drawn just inside the gridlines.
- Mute: cell content fades to 28% opacity, label gains a faint italic suffix `muted`. Visualiser stops moving naturally because gain → 0 → analyser sees silence → smoothed energy decays to zero.

### Mobile (≤720px)

Collapses to a vertical stack. Each cell becomes a full-width row with its own aspect ratio preserved as best we can. Wordmark sits above; title block + ListenOn sit below. The play control collapses to a fixed bottom-right pill (already implemented).

## The four visualisers

Different visual vocabularies, unified by colour theme + post-fx + composition language.

### BASS — Vertical seismograph

Single thick vertical line running top-to-bottom of its pillar cell. The x-coordinate at each y-position is a smoothed running buffer of sub-bass amplitude. Bass hits whip the line; silence settles it back to centred straight.

- Tech: `TubeGeometry` rebuilt per frame from a vertex buffer (default; no extra dependency). If profiling shows it's a bottleneck, swap to `meshline`.
- Vertex count: ~80 (one vertex per ~ ⅛-cell-height row).
- Frequency band: bins 1–12 (sub + bass).
- Smoothing: per-vertex one-pole lowpass, alpha ≈ 0.18 (sluggish, heavy).
- Material: `MeshBasicMaterial` with emissive bloom contribution.
- Resting state: line is straight, centred, visible at low intensity.
- Reduced motion: line locked at the centred straight position; no buffer updates.

### MAIN — Liquid sphere with shader displacement

High-poly icosahedron sphere (subdivision level 4, ~642 verts). Custom **vertex shader** displaces each vertex along its normal by `simplex_noise(position + uTime * 0.3) * uEnergy * uDisplacementScale`. Surface stays smooth; the silhouette warps. Slow Y-axis rotation.

- Tech: `IcosahedronGeometry` + `MeshStandardMaterial` extended via `onBeforeCompile` (vertex shader injection), so the material gets standard lighting + bloom contribution for free.
- Frequency band: bins 5–90 (full body).
- Smoothing: alpha ≈ 0.20 (medium).
- Resting state: still sphere, no displacement.
- Reduced motion: still sphere, no rotation, no displacement.

### DRUMS — Wireframe icosahedron with transient kicks

Low-subdivision icosahedron rendered as edges only (wireframe via `LineSegments` from `EdgesGeometry`). Slow idle rotation. On a transient detected in the kick band, geometry briefly expands (vertices push outward along normals) and edges flash brighter via emissive uniform spike.

- Tech: `IcosahedronGeometry` (subdivision 1, 12 verts) + `EdgesGeometry` + `LineBasicMaterial` (or shader if we want emissive control).
- Frequency band: bins 4–50 (kick + snare body).
- Smoothing: alpha ≈ 0.40 (snappy on transients, with a 200ms decay back to base after a peak).
- Transient detection: peak vs running average over 8 frames, threshold-gated to avoid noise.
- Resting state: idle rotation only, no expansion.
- Reduced motion: rendered static, no rotation, no transient flash.

### VOX — Vertical spectrum tower

24 thin horizontal rings stacked vertically along the cell's Y axis. Each ring's radius and emissive intensity is mapped to a specific frequency bin in the vocal range. Whole tower rotates very slowly on its Y axis.

- Tech: `InstancedMesh` of 24 `TorusGeometry` rings; one uniform array `uSpectrum: float[24]` pushes per-ring values.
- Frequency band: bins 18–200 (vocals + presence). 24 bins sampled across this range (with a slight log-spacing for perceptual fairness).
- Smoothing: alpha ≈ 0.25.
- Resting state: rings rendered at equal small radius (calm column), faint emissive.
- Reduced motion: equal-radius rings, no rotation.

## Architecture

### Stack

- `three` — WebGL core
- `@react-three/fiber` — React renderer for Three.js
- `@react-three/drei` — primarily for the `<View>` component
- `@react-three/postprocessing` — bloom + vignette + film grain pass
- Custom GLSL vertex/fragment fragments inline in the visualiser components (no separate shader files)

### `<View>` pattern (one shared canvas, four viewports)

A single full-stage `<Canvas>` element is positioned over the entire stage area. Each cell `<div>` contains a drei `<View>` component. Drei collects all `<View>`s and renders each into the screen-space rectangle of its host div, in one shared render pass.

Benefits over four separate `<Canvas>` elements:
- One WebGL context (mobile context-limit safety).
- One `requestAnimationFrame` loop.
- Shared post-fx — bloom and grain unify the four visualisers.
- HTML drives layout, accessibility, and focus management.

### Component shape

```
app/
  page.tsx                     // composition: HeroLayout + audio engine wiring

components/
  HeroLayout/
    HeroLayout.tsx             // CSS grid for the triptych
  Stage/
    Cell.tsx                   // <button>, click handler, focus ring, label
    SharedCanvas.tsx           // single <Canvas>, <Views>, <PostFx>
  visualisers/
    BassLine.tsx               // <View> child, <Tube>, useFrame
    MainSphere.tsx             // <View> child, custom shader sphere
    DrumsWireframe.tsx         // <View> child, <LineSegments>, transient detection
    VoxTower.tsx               // <View> child, <InstancedMesh> of rings
    PostFx.tsx                 // bloom + vignette + grain
  Wordmark/                    // (kept)
  TrackTitle/                  // (kept)
  ListenOn/                    // (kept)
  PlayControl/                 // (kept)
  GrainOverlay/                // (kept; complements PostFx grain on the HTML side)

lib/
  track-config.ts              // (kept)
  audio-reactive.ts            // (kept; bandEnergy, lerpToward, prefersReducedMotion)
  transient-detect.ts          // NEW — peak-vs-running-average detector for DRUMS

hooks/
  useAudioEngine.ts            // (kept; per-stem analysers, mute, play/pause)
```

Each visualiser receives `{ analyser: AnalyserNode | null; muted: boolean; color: string }` as props. They subscribe to the analyser themselves; React state never drives frame updates.

### Audio → uniforms data flow

Each visualiser owns one `useFrame((state, delta) => {…})` callback. Per frame:

1. `analyser.getByteFrequencyData(buffer)` into a single Uint8Array allocated once per visualiser at mount.
2. Compute the visualiser's relevant band averages via `bandEnergy(buffer, start, end)`.
3. Lerp band values toward previous frame's smoothed values (`lerpToward(prev, target, alpha)`).
4. Write smoothed values into material uniforms: `material.uniforms.uEnergy.value`, plus `uTime += delta`, plus the spectrum array uniform for VOX.
5. The shader does the displacement / colouring on the GPU.

No React re-renders during animation. Mute and load state changes go through React state on `useAudioEngine`; frame updates do not.

## Interaction & state

### Click / tap a cell

Toggles mute on that stem via `useAudioEngine.toggleMute(id)`. The cell button is the click target; the visualiser inside is `pointer-events: none` so the whole cell area is the hit zone.

### Keyboard

Each cell is a real `<button>`. Tab to focus, Space / Enter to toggle. Focus indicator is a 3px ring in the cell's brand colour, drawn just inside the gridlines.

### Mute visual

`data-muted="true"` attribute on the cell. CSS handles the fade to 28% opacity on cell contents and the corner label suffix. The visualiser stops moving as a side effect of audio physics: gain → 0, analyser sees silence, smoothed energy decays to 0.

### `prefers-reduced-motion`

Each visualiser checks the media query at mount. If true:
- BASS: line locked at centred straight, no buffer updates.
- MAIN: still sphere, no rotation, no displacement.
- DRUMS: wireframe rendered static, no rotation, no transient flash.
- VOX: rings at equal radius, no rotation.

Audio still plays. Mute still toggles. Only motion is suppressed.

### Loading

While a stem hasn't loaded, an HTML/SVG hairline arc draws progress around the cell's perimeter. The visualiser inside the cell shows its resting form so the user sees what's about to wake up. No spinner, no overlay screen.

### Initial state (before user clicks Press Play)

All four visualisers show their resting forms. The `Press play to enter` CTA is in the title zone where `TrackTitle` will sit once playback starts.

Tapping a cell before playback starts is a no-op for now. (Open question: do we want first-cell-tap to also start playback? Default: no, the explicit Press Play is more honest.)

## Performance plan

### Targets

- 60fps on a Pixel 6 / mid-tier 2022+ Android in Chrome.
- 60fps on iPhone 12+ in Safari.
- ≤16ms frame time at p95 during heavy bass + drums sections.
- Time-to-interactive ≤2.5s on a fast 4G connection.

### Budget

- Three.js + R3F + drei + postprocessing ≈ 200kb gz. Lazy-loaded after first paint so the wordmark + title + ListenOn render immediately.
- Per-frame cost target: ≤5ms total for all four visualisers + post-fx.

### Measurement

- Instrument `useFrame` with a perf counter that logs every 5s in dev builds.
- Lighthouse run after build.
- Real-device test on a borrowed mid-range Android phone before claiming the perf brief is met.

### Fallback strategy

If perf falls below 50fps on the target device:

1. **First lever**: drop `bloom` post-fx on devices below a perf threshold (`navigator.deviceMemory < 4`, or first-frame timing > 30ms).
2. **Second lever**: lower MAIN sphere subdivision (642 → 162 verts) and disable VOX rotation.
3. **Third lever (escape hatch)**: provide a non-WebGL static fallback (typography + ListenOn, with a subtle CSS pulse on cells so it doesn't feel dead). Triggered if WebGL context creation fails outright.

## Accessibility

- WCAG 2.2 AA contrast on text, focus rings, museum-tag labels.
- All four cells are real `<button>` elements with `aria-pressed` reflecting mute state and `aria-label` descriptive.
- Focus rings always visible on `:focus-visible`, never removed without replacement.
- `prefers-reduced-motion` respected (see Interaction & state).
- Touch targets ≥44 × 44 px (the cells exceed this by far at any viewport).
- Audio-driven visual feedback always has a non-audio twin: `aria-pressed` on the button + the muted CSS state convey the stem's state to a deaf user.

## Code lifecycle

### Keep

- `app/layout.tsx` (fonts loaded)
- `app/globals.css` (token system, with new R3F-relevant rules added)
- `lib/track-config.ts`
- `lib/audio-reactive.ts` (`bandEnergy`, `lerpToward`, `prefersReducedMotion`)
- `hooks/useAudioEngine.ts`
- `components/Wordmark`, `components/TrackTitle`, `components/ListenOn`, `components/PlayControl`, `components/GrainOverlay`
- `PRODUCT.md`, `DESIGN.md`

### Replace

- `components/Stage/Stage.tsx` — becomes the new triptych grid layout with `<Cell>` children.
- `components/TrackShape/TrackShape.tsx` and the three SVG variants — fully removed; the four R3F visualiser components take their place.

### Delete

- `components/VariantSwitcher/` — committed to one treatment, no switcher needed.
- `components/TrackShape/BlobMorph.tsx`, `Crystalline.tsx`, `PulseRings.tsx`, `TrackShape.tsx`.

### New

- `components/HeroLayout/HeroLayout.tsx`
- `components/Stage/Cell.tsx`
- `components/Stage/SharedCanvas.tsx`
- `components/visualisers/BassLine.tsx`
- `components/visualisers/MainSphere.tsx` (+ inline GLSL fragments)
- `components/visualisers/DrumsWireframe.tsx`
- `components/visualisers/VoxTower.tsx`
- `components/visualisers/PostFx.tsx`
- `lib/transient-detect.ts`

## Future iterations (not in scope)

- **Combined-output visualiser**: a fifth analyser tapped at the master node (`audioContext.destination` predecessor), rendered either as a backdrop layer behind the triptych or as a discrete fifth element. Trivial extension — one extra `AnalyserNode` and one extra visualiser component.
- **Multiple releases**: a swap mechanism for `RELEASE` in `track-config.ts`, possibly URL-driven.
- **Recording and sharing remixes**: a "I muted vox + drums, listen to my mix" share link that encodes mute state in the URL hash. Could record a short audio clip via `MediaRecorder`.
- **Cover art / photography integration**: brand canon allows double-exposure photographic layering; a hero photo behind the triptych would deepen the brand-aligned atmosphere.

## Open questions

- **First-tap-on-cell-before-play**: should tapping a cell before playback starts also start playback? Currently deferring; default is no.
- **Bloom intensity**: needs in-browser tuning during implementation. Will default to a subtle setting and dial up only if the visualisers feel flat.
- **Cell separator visibility**: the brief calls for hairline rules at low contrast. We may find them too quiet against the visualisers or too loud — to be tuned during implementation.

## Acceptance criteria

This work is done when:

- All four visualisers render at 60fps on a Pixel 6 in Chrome with audio playing.
- Mute on each cell stops the corresponding stem and that cell visually settles to its resting state.
- `prefers-reduced-motion` users see static visualisers and audio plays normally.
- Tab navigation reaches all four cells and the play control in a sensible order, with visible focus rings.
- Lighthouse perf score ≥85 on mobile with audio loaded.
- Production build (`next build`) succeeds with zero errors.
- Implementation matches the composition and per-stem treatments described in this document.
