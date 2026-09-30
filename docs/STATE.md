# 9cups · project state

**Authoritative context-restoration doc.** Read this first in a fresh session.
Last updated: 2026-09-30 (video home + test suite).

Supersedes `docs/progress/2026-05-07-state.md` (deleted; recoverable from git
history and the `backup/2026-09-30-pre-cleanup` branch).

## What this is

A brand site for DJ 9cups. Two surfaces:

| Route | What it is |
|---|---|
| `/` | Knockout video hero (the loop plays through giant "IX CUPS" type) above the landing: wordmark, play button, grouped links, mixer doorway, bookings. Both sections share ONE audio transport. Side by side instead of stacked above 1600x800. |
| `/mixer` | The four-stem mixer. Editorial split: duotone'd portrait with the album cover blended over it on the left, wordmark + stem toggles + terrain + listen row on the right. |
| `/review` | Dev-only route index. Carries the DevDock nav overlay. Not linked from the public site. |
| `/explore/*` | Unfinished ASCII-visualiser experiments. Kept deliberately, not linked. |

Register is **brand**, declared in `PRODUCT.md`. Design canon lives in
`DESIGN.md` and `.claude/skills/9cups-brand/`. When they conflict, the skill wins.

## Architecture

```
app/
  page.tsx              → <PlayerProvider>: <KnockoutHero cta={<HeroEnter/>}/> + <Landing variant="section"/>
  mixer/page.tsx        → <EditorialHero videoName="haze" /> + back link
  review/page.tsx       → route index + <DevDock />
  layout.tsx            → next/font: Caprasimo (display) + DM Sans (body)
  globals.css           → all CSS, token-led (~1400 lines)

components/
  hero-video/              KnockoutHero, HazeHero, BackgroundVideo, fonts (Anton + Space Grotesk)
  Landing/PlayerProvider   owns useTrackPlayer, publishes it over context
  Landing/HeroEnter.tsx    hero CTA: starts audio, scrolls to the landing
  Landing/Landing.tsx      landing composition ('standalone' | 'section')
  Landing/LinkGroups.tsx   rule-separated link rows
  Terrain/Terrain.tsx      the WebGL wireframe ground (both routes)
  Wordmark/Wordmark.tsx    kick-driven ghost glitch
  ImageDemo/EditorialHero.tsx   the mixer composition
  StemToggles, TrackTitle, ListenOn, PlayControl, GrainOverlay, Duotone,
  HoverOverlay, InlineCover
  DevDock/                 dev nav, mounted only on /review
  Explore/                 ASCII experiments
  Hero/HeroPage.tsx        NOT rendered anywhere; kept only because
                           Terrain imports the VisualiserProps type from it

hooks/
  useAudioEngine.ts     4-stem buffer mixer (mixer page)
  useTrackPlayer.ts     single streaming track (landing page)

lib/
  track-config.ts       RELEASE, stems, all outbound links, contact email
  audio-reactive.ts     bandEnergy, lerpToward, useReducedMotion
  transient-detect.ts   TransientDetector
```

## The two audio hooks, and why there are two

Not an oversight. They have opposing requirements:

- **`useAudioEngine`** (mixer) needs four stems sample-locked to each other, so
  it uses `AudioBufferSourceNode`. That means downloading and decoding all
  4.4MB before the first sound.
- **`useTrackPlayer`** (landing) needs fast time-to-first-sound, so it uses a
  streaming `<audio>` element plus `createMediaElementSource`. Playback starts
  on a few buffered seconds.

Merging them would compromise both. Leave them separate.

Consequence: audio does **not** continue across `/` → `/mixer` navigation. Each
page owns its own context. Making it continuous needs a shared provider and was
scoped out of the MVP.

## Terrain

One `PlaneGeometry(180×90)` (~16k verts), vertex displacement only, trivial
fragment shader emitting a solid colour. `antialias: false`, `dpr = 1`, no
transparent overdraw.

Props worth knowing:

- `singleAnalyser` — drives all four displacement layers from one analyser
  instead of four per-stem ones. The landing page uses this.
- `planeScale` — the default plane is sized for the mixer's half-width column.
  A full-bleed host needs it wider or the plane's own edges show as diagonal
  seams. The landing passes `2.2`.
- `activeKeys`, `segments`, `dpr`, `className` — escape hatches for perf/layout.

## The shared audio transport

The hero CTA and the landing's play button must be the same transport —
pressing either has to leave the other showing the same state. `useTrackPlayer`
therefore lives in `components/Landing/PlayerProvider.tsx` and is published over
context; calling the hook in both places would create two `<audio>` elements
playing over each other. `usePlayer()` throws outside the provider on purpose:
a silent no-op play button is much harder to diagnose than a boot error.

Covered by `tests/e2e/home.spec.ts` in both directions.

## Video heroes

`components/hero-video/` came from a self-contained package (its brief is in
`9cups-hero-video/CLAUDE_INTEGRATION.md`). Do not change `BackgroundVideo`'s
loading strategy or the AV1 -> HEVC -> H.264 source order; both are deliberate.

Adapted deliberately:
- `KnockoutHero` gained a `cta` slot.
- `.word` font-size reads `--knockout-size` so a host layout can shrink it
  (the side-by-side home does; 27vw of a half-width column overflows).
- The pause button got `min-height: 44px` — it shipped at ~33px, under the
  minimum target size. Box only; behaviour untouched.

## Performance: measured, not assumed

Measured 2026-09-30 on Intel UHD 630 integrated graphics (the mid-tier class
`PRODUCT.md` targets), production build, 1440×900, during playback:

**60fps flat. p95 17.4ms, worst frame 17.7ms, zero frames over 20ms.**
Identical with the wordmark ghost animation on and off, across three paired
runs in separate browser processes.

### The two costs found on 2026-09-30, and their fixes

**1. `frameloop="always"` on a static terrain.** R3F re-rendered the terrain 60
times a second to draw an identical frame whenever audio wasn't playing. Alone
that was survivable; composited alongside a playing video on integrated
graphics it dropped the home page to 22fps. `Terrain` now uses
`frameloop={playing ? 'always' : 'demand'}` — "demand" still renders once on
mount, so the resting mesh draws. **22fps -> 60fps.**

**2. `mix-blend-mode` + `filter` over a playing video.** The mixer's dappled
cover overlay was free over a still image (composited once, cached) and
expensive over video (recomputed every frame). The video panel now uses plain
alpha compositing. **~20fps -> ~50fps.** Not 60: a large playing video plus any
compositing on top still costs on this GPU. Accepted for a secondary page.

General rule this implies: **check what a CSS effect costs once it sits over
moving pixels.** Blend modes and filters are nearly free over static content
and expensive over video.

**The dev server is janky and production is not.** Turbopack instrumentation
and React dev-mode cost roughly 20fps and produce visible stutter. Never judge
animation performance on `next dev` — build and `next start` first. This cost
one full debugging cycle and a wrong conclusion; don't repeat it.

Methodology note: measuring several configs sequentially in one browser session
is invalid. The first config absorbs audio decode and JIT warmup and looks
worse than it is. One process per config, discard the first ~60 frames.

## Audio assets

`public/audio/` holds the four stems (1.1MB each, 320kbps) and
`9cupsCatchingAFeelingWeb_mix.mp3` (660KB, 192kbps), which is the four stems
summed for the landing page.

Regenerate the mixdown with:

```bash
ffmpeg -y \
  -i public/audio/9cupsCatchingAFeelingWeb_bass.mp3 \
  -i public/audio/9cupsCatchingAFeelingWeb_drums.mp3 \
  -i public/audio/9cupsCatchingAFeelingWeb_main.mp3 \
  -i public/audio/9cupsCatchingAFeelingWeb_vox.mp3 \
  -filter_complex "amix=inputs=4:normalize=0:duration=longest[m]" \
  -map "[m]" -af "volume=-1.5dB" -codec:a libmp3lame -b:a 192k \
  public/audio/9cupsCatchingAFeelingWeb_mix.mp3
```

`normalize=0` stops `amix` dividing by the input count. The raw sum true-peaks
at +0.7 dBFS, hence the 1.5dB trim. Result: −10.9 LUFS, −0.6 dBFS true peak.

**Known limitation: the stems are a 28-second loop, not the full record.** The
landing page loops 28 seconds. Dropping a mastered full-length mp3 at the same
path requires no code change.

## Settled decisions

Don't re-litigate these without a reason:

- **Caprasimo + DM Sans.** Won multiple font-picker rounds. DM Sans is on
  impeccable's reflex-reject list; `DESIGN.md` explicitly overrides that, and
  the skill's own rule is that identity-preservation beats the greenfield list.
- **The mixer composition** is variant "C4-hover": cover at 90% opacity by
  default, pulling back to 35% on hover to reveal the portrait underneath.
  Reversed from the original spec on purpose.
- **Artist-profile links, not per-release URLs.** More durable.
- **Apple Music is omitted** — no URL exists. Better than a dead link.
- **`bit.ly/m/9cups` is omitted** — the old link-in-bio hub, which this site
  replaces. Linking it would send visitors in a circle.
- **Spotify URL is stripped of its `?si=` param** (share-tracking from one old
  share).
- **Bookings is a `mailto:`**, not an embedded form. No backend anywhere in
  this project; keep it that way unless there's a reason.
- **Landing links sit above the mixer CTA.** User's call. `PRODUCT.md` argues
  the reverse ("the mixer is the hook; the platform CTAs are the conversion"),
  so this is a known, deliberate divergence.

## Accessibility invariants

Verified 2026-09-30; keep them true:

- All eight landing text roles pass WCAG AA (lowest is 5.31:1).
- 13 tab stops in logical order, every control with a visible focus ring.
- No horizontal overflow at 390px; every link row clears the 44px touch target.
- `prefers-reduced-motion` freezes the terrain; audio still plays.
- `:visited` styling must sit on the anchor itself and use an allowlisted
  property (colour, background-colour, border-colour, outline-colour).
  Browsers silently ignore `:visited` on descendants — that bug has been
  written here once already.

## Tests

First test suite landed 2026-09-30. `npm test` (Vitest, 64) and
`npm run test:e2e` (Playwright, 48 across desktop + mobile projects).

- Unit: `tests/unit/` — lib logic, `useTrackPlayer`, and the components with
  contracts worth pinning (`LinkGroups`, `PlayControl`, `Wordmark`).
- E2E: `tests/e2e/` — runs against a PRODUCTION build (`playwright.config.ts`
  builds and starts it). Covers the shared-transport contract, link safety,
  reduced motion, heading structure, contrast, focus order, touch targets and
  horizontal overflow.

Known gaps, stated rather than implied:
- **No real Safari coverage.** The `mobile` project is Chromium at an iPhone
  viewport, so the HEVC video path and Safari audio quirks are untested.
- **WebGL terrain rendering** is not asserted (needs a GPU; flaky in CI).
- **Audio output** is not asserted (no audio device in headless).
- The contrast check cannot read elements sitting on gradient/image
  backgrounds; it reports them as unverifiable rather than silently passing.

CI is `.github/workflows/ci.yml`: typecheck, lint, unit, build, then e2e
against the artifact from the build job.

## Deploying

Target is Vercel (zero-config for Next 16). Nothing has been deployed yet.
Remote is `git@github.com:mazhermon/9cupsWebsite.git`.

```bash
npx tsc --noEmit
rm -rf .next && npx next build
PORT=3001 npx next start   # verify production before shipping
```

## Scratch

Debug screenshots and Playwright logs from the build sessions live **outside
the repo** at `~/9cups-scratch/2026-09-30/` (~65MB). They were always
gitignored. Kept out of git deliberately: committing them would add 65MB to
every clone and every build.

`backup/2026-09-30-pre-cleanup` is a branch snapshot of the tracked state
before the 2026-09-30 cleanup, including the `design-options/` HTML mockups.
