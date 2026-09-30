# Plan · lock in the video home page, add tests, prep CI

**Date:** 2026-09-30
**Branch:** `new-design-video-bg`
**Status:** complete — shipped 2026-09-30

/ becomes the Option A composition (knockout video hero above the existing
landing). Adds a hero CTA that starts audio and moves the visitor down, a
side-by-side layout on very large screens, per-link hover colours, and the
project's first test suite ahead of turning on CI.

## 1. Lock in Option A

- `app/page.tsx` renders the hero + `<Landing variant="section" />`.
- Delete `app/hero-a`, `app/hero-b`, `components/DemoBadge`, and the
  TEMPORARY css block in `globals.css`.
- Keep the `Landing` `variant` prop: `section` is now the shipping path and
  `standalone` still serves any future single-surface use.
- `overlay` variant and `.heroblend*` css are dropped with Option B.

## 2. Shared player state

**Problem:** the hero's CTA and the landing's play button must be the same
transport. `useTrackPlayer` currently lives inside `Landing`, so a sibling
hero cannot reach it, and calling the hook twice would create two independent
`<audio>` elements.

**Solution:** `components/Landing/PlayerProvider.tsx` owns the hook and
publishes `TrackPlayerReturn` over context. The home page wraps both children.
`Landing` and the hero CTA both consume it. A hook that throws outside the
provider keeps the contract explicit rather than silently returning a dead
transport.

## 3. Hero CTA

`KnockoutHero` gains an optional `cta` slot — an adaptation, not a fork;
`BackgroundVideo` is untouched per the package's instructions.

Behaviour:
- Starts playback through the shared context (identical state to the landing
  button — pressing either leaves the other showing "playing").
- Scrolls to the landing section, honouring `prefers-reduced-motion`
  (`smooth` → `auto`).
- On the side-by-side layout there is nothing to scroll to, so the button
  drops its scroll affordance and reads as a plain play control.
- Label reflects transport state so it never lies: "Press play" → "Playing".

## 4. Side-by-side on very large screens

At `min-width: 1600px`, hero and landing each take half the viewport, full
height, no page scroll.

Constraints:
- Gate on width **and** height (`min-height: 800px`). A 1600×700 window would
  otherwise crush the landing's link list.
- The landing's terrain is `absolute` in `section` variant; in the split it
  anchors to its half rather than the viewport.
- Knockout type must shrink: `27vw` of a half-width column overflows.

## 5. Link hover: colour + performance

**Performance defect (existing):** `.linkrow` transitions `padding-left`.
Padding is a layout property, so every frame of the transition forces layout
and paint on a full-width grid row. This is the lag reported. Replace with
`transform: translateX()` on the row's contents, which is compositor-only.
Keep `background-color` and `color` (paint-only, cheap).

**Colour:** each row gets its own solid hover background from the brand
palette — one flat colour per row, no gradients. Every pairing must clear
WCAG AA against its own background, verified by measurement, not by eye.

## 6. Tests

First tests in the project. Two layers:

**Vitest + Testing Library (jsdom)** for logic and components:
- `lib/transient-detect` — fires above threshold, respects cooldown and
  window warm-up
- `lib/audio-reactive` — `bandEnergy` bounds and clamping, `lerpToward`
- `lib/track-config` — every link is https and absolute; no `#` placeholders
  can regress in
- `hooks/useTrackPlayer` — ready on canplay, toggle play/pause, error path,
  cleanup on unmount
- `components/Landing/LinkGroups` — renders every group, `target`/`rel` on
  every anchor, `aria-labelledby` wiring
- `components/PlayControl` — `aria-pressed`, hint, disabled
- `components/Wordmark` — heading level demotion

**Playwright** for behaviour only a browser can prove:
- `/` and `/mixer` load with no console errors
- hero CTA starts audio *and* the landing button reflects it (the shared-state
  contract)
- video mounts after load, AV1 on Chromium, portrait file at 390px
- `prefers-reduced-motion` creates no `<video>`
- exactly one `<h1>` per route
- contrast floor on the landing's text roles
- no horizontal overflow at 390px

**Not tested:** WebGL terrain rendering (needs GPU, flaky in CI) and audio
output (headless has no audio device). Both are asserted structurally instead.

## 7. CI

`.github/workflows/ci.yml`: typecheck → lint → unit → build → e2e, on PRs and
pushes to main. Playwright browsers cached.

## Execution

Implementation (1-5) is cross-cutting and stays with the main session.
Test authoring (6) fans out to subagents once the implementation is settled,
so they write against real code rather than a moving target.

## Verification

Production build, not dev — `next dev` fakes ~20fps of jank (see
`docs/STATE.md`). Hover cost measured by frame timing during a synthetic
hover, before and after the `padding-left` fix.
