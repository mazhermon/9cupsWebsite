# 9cups · project state

**Authoritative context-restoration doc.** Read this first in a fresh session.
Last updated: 2026-09-30.

Supersedes `docs/progress/2026-05-07-state.md` (deleted; recoverable from git
history and the `backup/2026-09-30-pre-cleanup` branch).

## What this is

A brand site for DJ 9cups. Two surfaces:

| Route | What it is |
|---|---|
| `/` | Landing page. Wordmark, one play button on a single mixdown wired to a WebGL wireframe terrain, grouped links out to every platform, a doorway into the mixer, bookings contact. |
| `/mixer` | The four-stem mixer. Editorial split: duotone'd portrait with the album cover blended over it on the left, wordmark + stem toggles + terrain + listen row on the right. |
| `/review` | Dev-only route index. Carries the DevDock nav overlay. Not linked from the public site. |
| `/explore/*` | Unfinished ASCII-visualiser experiments. Kept deliberately, not linked. |

Register is **brand**, declared in `PRODUCT.md`. Design canon lives in
`DESIGN.md` and `.claude/skills/9cups-brand/`. When they conflict, the skill wins.

## Architecture

```
app/
  page.tsx              → <Landing />
  mixer/page.tsx        → <EditorialHero /> + back link
  review/page.tsx       → route index + <DevDock />
  layout.tsx            → next/font: Caprasimo (display) + DM Sans (body)
  globals.css           → all CSS, token-led (~1300 lines)

components/
  Landing/Landing.tsx      landing composition
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

## Performance: measured, not assumed

Measured 2026-09-30 on Intel UHD 630 integrated graphics (the mid-tier class
`PRODUCT.md` targets), production build, 1440×900, during playback:

**60fps flat. p95 17.4ms, worst frame 17.7ms, zero frames over 20ms.**
Identical with the wordmark ghost animation on and off, across three paired
runs in separate browser processes.

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
