# 9cups

Brand site for DJ 9cups. House, UK garage, bassline and 140, out of Wellington.

A landing page with a single play button wired to a WebGL wireframe terrain,
and a four-stem mixer that lets visitors pull a release apart in real time.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Production, which is the only build worth judging performance on:

```bash
npm run build
npm start
```

## Routes

| Route | |
|---|---|
| `/` | Landing: wordmark, play button, platform links, mixer CTA |
| `/mixer` | Four-stem mixer |
| `/review` | Dev route index (not linked publicly) |
| `/explore/*` | Unfinished ASCII-visualiser experiments |

## Stack

Next 16 (App Router, Turbopack), React 19, Three.js via React Three Fiber,
Web Audio API, plain CSS with design tokens.

## Where things are documented

- **`docs/STATE.md`** — start here. Architecture, settled decisions, measured
  performance, deploy steps.
- **`PRODUCT.md`** — audience, purpose, brand personality, anti-references.
- **`DESIGN.md`** — colour, type, spacing, motion, component rules.
- **`.claude/skills/9cups-brand/`** — the visual identity canon. Wins on conflict.
- **`docs/superpowers/specs/`** — design specs, newest first.

## Notes

The landing page loops a 28-second mixdown, not the full record. Replacing
`public/audio/9cupsCatchingAFeelingWeb_mix.mp3` with a mastered full-length
file needs no code change. The ffmpeg recipe that built it is in
`docs/STATE.md`.
