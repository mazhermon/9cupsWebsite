# brik.space — usefulness for the 9cups visualiser

**Date:** 2026-05-15
**Author:** automated research + prototype run
**Status:** field notes, not a decision

Live exploration: visit `/explore` once `npm run dev` is up.
Routes: `/explore/living-type`, `/explore/grid-cells`, `/explore/glyph-plot`, `/explore/holo-card`.

## TL;DR

brik.space is an **agentic platform for building motion-design tools** — you
describe the tool you want in natural language and it generates an
interactive instrument. It is **not a component library, not an embeddable
WebGL framework, and not a code generator** we can `npm install` from.

Its usefulness to us is therefore mostly **design influence**: idea
categories (text effects, generative 2D, brand toolkits, "living tools")
and a "weird internet" aesthetic that maps onto our brand's experimental
side. The four prototypes in this branch attempt that translation
**without** depending on brik.space directly.

If we want to actually use brik.space outputs, the realistic path is:
**one-off brand assets** (animated wordmark exports, social cards, motion
loops for venue screens) — not in-page audio-reactive visuals.

## What I could verify

- Site copy: brik.space describes itself as "the professional motion
  design ecosystem for instant, production-ready visuals and dynamic
  brand toolkits."
- Search corroboration (swissmiss, agentic.ai listing): brik is an
  **agentic** ("describe a tool, get a tool") platform with output
  categories: animations, 2D & 3D visuals, text effects, images, brand
  toolkits.
- Gallery route is `brik.space/Gallery/tags:featured` — uses tag filters.
- "Bring back the weird internet" (swissmiss) is the cultural pitch.

## What I could NOT verify

- The actual gallery items — pages are SPA-rendered, the HTML shell
  fetched by WebFetch is empty. I did **not** sign into the platform.
- Whether there is a developer API, embed format, or export-as-code path.
- Pricing, license terms, or whether output assets are royalty-free for
  commercial release covers.
- Specific component primitives the agent draws from when generating a
  tool. (Knowing these would change the "transferability" analysis below.)

Honest caveat: the report is built on the public-facing pitch + the
"agentic motion-design tool builder" framing. If brik turns out to expose
direct embeds or component code, the conclusion would shift toward "use
it directly" for some surfaces.

## The four prototype directions

Each lives at `/explore/<slug>` and reuses the existing audio engine
(`useAudioEngine`, four stems, kick analyser already wired in). They are
deliberately diverse so the user can pick a direction, not just a coat
of paint.

### 01 · Living type (`/explore/living-type`)

- Variable-font wordmark using **Recursive** (next/font axes: `wght`,
  `slnt`, `CASL`, `CRSV`, `MONO`).
- Bindings: drums → `wght`, bass → `CASL`, main → `slnt`, vox → letter
  spacing.
- One DOM node animates four axes via CSS custom properties. No WebGL.
- **Brik link:** the strongest. Their "text effects" pillar is literally
  this kind of dynamic typography; their "brand toolkit" framing is the
  idea that one mark generates many.

### 02 · Brand grid (`/explore/grid-cells`)

- 16×9 cell grid; rows owned by stems; columns slice the spectrum.
- 144 DOM nodes; each frame we write three CSS variables per cell.
  Measured cheap enough to keep 60fps comfortably.
- **Brik link:** "dynamic brand toolkit" — a tileable, printable,
  audio-reactive brand pattern. Same energy as a generative system you
  might describe to brik as "make me a 16×9 brand pattern that reacts
  to four input signals."

### 03 · Glyph plot (`/explore/glyph-plot`)

- 80×24 monospace ASCII frequency plot. One `<pre>`, textContent
  updated per frame. 9-step glyph ramp from space to full block.
- **Brik link:** "weird internet" + text-as-image. The cheapest possible
  visualiser to maintain — and the only one that prints unchanged onto
  merch.
- Where it falls short: visually noisier than the brand might want;
  better as a "B-side" or a t-shirt graphic than the front page.

### 04 · Holo card (`/explore/holo-card`)

- The release as a 3D-transformed object. CSS `transform-style:
  preserve-3d`, audio drives shine sweep / hue rotation / parallax
  depth; mouse drives tilt.
- **Brik link:** "production-ready visuals" — this is the closest
  prototype to something brik might actually generate for us. A
  pitch-deck moment, a marquee carousel of upcoming drops, a press
  asset. Static screenshot still reads well.

## What worked, what didn't

**Worked**
- The "one stem per axis" framing produces immediately understandable
  variation. Living type is the clearest demonstration — you can hear
  which stem you toggled.
- Sharing `useAudioEngine` across all four routes means a new prototype
  costs ~80 lines of TSX + a CSS block. The shell handles play, mute,
  loading.
- All four prototypes are pure DOM/CSS — no new WebGL canvases beyond
  the existing terrain on `/`. Bundle stays small.

**Didn't work / risks**
- We never actually used brik.space's tooling. The prototypes are
  influenced, not generated. If brik turns out to expose embeddable
  output, the right answer is probably "use it for cover art / social,
  build visualisers in-house" — the two paths don't fight each other.
- Glyph plot looks great in a screenshot, but at small sizes the ramp
  collapses to noise. Worth testing on a 13" laptop before promoting.
- Holo card uses `next/image` for the cover; performance is fine but
  hue-rotate on a 480px image is a measurable filter cost. Acceptable
  on a single foreground card; do not stack ten of them.

## Recommended next steps

1. **Pick a direction.** Living type or holo card are the two with
   most product-marketing leverage. Brand grid is a strong "screensaver
   / venue loop" play but doesn't replace the current home.
2. **Promote one to a polish pass.** That means: real type-spec, real
   transient behaviour on the kick, real reduced-motion fallback. The
   prototypes are deliberately minimal.
3. **Decide whether to actually try brik.space.** Worth a one-off paid
   month to see if it can generate (a) a hero cover-art treatment for
   the next release and (b) a 10-second social loop. Both surfaces are
   areas where we currently spend manual time and where the agentic
   pitch is most likely to deliver.
4. **Strip the explore tree before shipping.** Keep them on a branch or
   behind a feature route. Don't link from the live home until one
   direction graduates.

## Files added in this branch

```
app/explore/
  layout.tsx              # loads Recursive variable font + explore.css
  explore.css             # all .ex-*, .lt-*, .gc-*, .gp-*, .hc-* styles
  page.tsx                # index — 4 cards + footer linking to this report
  living-type/page.tsx
  grid-cells/page.tsx
  glyph-plot/page.tsx
  holo-card/page.tsx
components/Explore/
  ExploreShell.tsx        # shared shell — audio engine + chrome
  LivingType.tsx
  GridCells.tsx
  GlyphPlot.tsx
  HoloCard.tsx
docs/research/
  2026-05-15-brik-space-explore.md   # this file
```

Nothing in `app/page.tsx` or the existing `components/` tree was changed.
The home page renders exactly as before.
