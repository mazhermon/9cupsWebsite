# Plan · accent colour, then the content pages

**Date:** 2026-10-01
**Status:** chunks 1 and 2 shipped. Chunk 3 in progress on `content-pages`.

Three chunks, in this order, so the design work can go live before the larger
content build starts.

## Chunk 1 · Accent colour (current)

The brand is purple-led with no high-attention accent. Electric Amethyst is the
identity colour and is now doing double duty as both surface and emphasis,
which is why nothing on the page really *pops*.

**Colour-theory framing.** Electric Amethyst `#8B3AC4` sits near OKLCH hue 305.
Its direct complement is around hue 120-125 — yellow-green. The brand already
owns that spot: Acid Moss `#7A8A1A` is oklch(56% 0.16 120), the complement,
currently capped at "≤5%, occasional organic surprise" in DESIGN.md.

So a yellow accent is not an arbitrary addition. The range worth testing runs
from hue ~65 (amber, warm, analogous-adjacent) through ~85 (true yellow, split
complement) to ~120 (chartreuse, exact complement). Nine options span that arc
at different lightness and chroma.

**Where the accent would be used** — deliberately few places, or it stops being
an accent:
- The play control (the page's primary action)
- Link row hover fill
- Section headings / eyebrow, or not — decided by looking
- Focus rings

**Constraint:** must clear WCAG AA against both grounds it will sit on —
`--color-surface` `#1a0d2e` and the lifted hero `#4A2270`.

Deliverable: a scratch page showing all nine applied to real UI fragments with
measured contrast, not swatches.

## Chunk 2 · Merge and ship

Merge `design-tweeks-sept` (Bungee, lifted violet hero, accent colour) to main
and push. CI runs; Vercel deploys if connected. This is the "current design
updates go live" milestone.

## Chunk 3 · Content pages (new branch)

Four pieces of work. Nav is the dependency — build it first, since every page
needs it and the home page currently has no chrome at all.

### 3a · Nav bar

New, and the first persistent chrome on the site. Considerations:
- It sits over a full-bleed video hero on `/`, so it needs a legibility
  treatment that doesn't dim the hero (a scrim only when scrolled, or a
  contained pill).
- The home page currently has no header; adding one changes the hero's top
  edge and the `100svh` maths.
- Must not break the single-`<h1>` rule or the existing skip-link target.
- Mobile: a real menu, not a squeezed row of five links.

Routes: Home · Mixes · Originals · Mixer · About

### 3b · `/mixes` and `/originals`

Both are a list of embedded players. Same component, different data.

- **Sources:** SoundCloud and Bandcamp now; Mixcloud later (none to add yet, so
  the data shape must accept it without a rewrite).
- **Embeds are third-party iframes.** Each one loads external JS, sets cookies
  and adds significant weight. A page of ten is slow and leaks visitor data to
  three companies. Mitigation: facade pattern — render our own styled
  placeholder with artwork and title, and only swap in the real iframe on
  click. One iframe at a time, no third-party contact until a visitor asks
  for it.
- Needs `loading="lazy"` and an explicit aspect-ratio box to avoid layout shift.
- Data shape lives in `lib/` beside `track-config`, so adding a mix is a
  one-line edit like the links were.

### 3c · `/about`

Text-heavy, which nothing on the site is yet.
- Featured hero image (supplied later).
- Real body-copy typography: measure capped at 65-75ch, a proper reading
  rhythm. DM Sans at a larger size than the UI uses.
- Press pack as a download. Needs the file, its size and format surfaced in
  the link text, and `download` on the anchor.

### 3d · Open questions for the user

- Mixes and originals: title, date, artwork per item, or just the embed?
- Should `/mixer` stay in the nav, or move under Originals as a per-track
  feature?
- Press pack: PDF? What should the filename be?
- About: how long is the copy, and who writes it?

## Not in scope

The 28-second loop is still the landing audio until a mastered full-length mp3
lands at `public/audio/9cupsCatchingAFeelingWeb_mix.mp3`.
