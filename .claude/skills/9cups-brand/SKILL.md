---
name: 9cups-brand
description: Use when working on any 9cups brand task — cover art, social graphics, web design, promotional materials, typography choices, colour decisions, logo usage, or any output that must reflect the DJ 9Cups visual identity. Also use when the user asks about brand rules, brand decisions, or how to apply the 9cups aesthetic to new contexts.
---

# 9cups Brand Identity System

Living brand guide for DJ 9Cups. This document is the codified system — pair it with the `design-inspiration` skill's visual references for the full picture. When the two conflict, defer to what you can see in the reference images.

---

## The Brand in One Sentence

**The Wise Enjoyer** — not seeking, not striving, already here, already satisfied, sharing generously.

Named after the Nine of Cups tarot card (The Wish Card): emotional fulfilment, quiet abundance, presence. Wellington-rooted, globally influenced.

---

## Colour System

Use the CSS custom property tokens as the canonical names.

| Token | Name | Hex | Use |
|---|---|---|---|
| `--color-primary-dark` | Deep Violet | `#3B1A6E` | Depth, mystery, primary dark |
| `--color-primary-mid` | Electric Amethyst | `#8B3AC4` | Identity, energy, primary brand colour |
| `--color-primary-light` | Bright Lavender | `#C47EE8` | Air, celebration, overlays |
| `--color-primary-pale` | Lilac Mist | `#D4AAEE` | Softness, negative space, tarot backgrounds |
| `--color-accent-warm` | Crimson Rose | `#B03060` | Passion, depth, warm accent |
| `--color-accent-vivid` | Hot Magenta | `#CC2E90` | Heat, urgency, vivid accent |
| `--color-ground-dark` | Dark Forest | `#1A2A1E` | Anchor, shadow zones |
| `--color-ground-mid` | Warm Asphalt | `#3A3530` | Neutral ground |
| `--color-ground-light` | Bone White | `#F0EBE0` | Negative space, sketch lines, tarot light zones |
| `--color-accent-organic` | Acid Moss | `#7A8A1A` | Organic surprise — use sparingly |

### Proportional rules
- **60%** Purple family (Deep Violet → Lilac Mist)
- **20%** Warm accent family (Crimson Rose → Hot Magenta)
- **15%** Neutral grounds (Dark Forest, Warm Asphalt, Bone White)
- **5%** Acid Moss — only for organic grounding moments

### Purple temperature as emotional signal
- Cool blue-violet → introspection, depth
- Electric saturated purple → celebration, live energy
- Warm magenta-purple → love, connection

---

## Typography

**Wordmark / headings:** IM Fell English (old-style serif) — round, unhurried, slightly archaic. Literary, not corporate. This is the primary typeface.

**Body / secondary:** DM Sans (light weight) — only where legibility demands it.

**In practice:**
- Wordmark and release names: IM Fell English, set with confidence
- Large display type: bold weight, oversized scale — the name commands the frame
- Extreme tracking on secondary lines (event details, dates, platforms)
- Never cold, never techy
- Secondary text should feel like a caption, not a label

---

## Visual Techniques

Two established production styles. Both are valid; choose based on emotional register.

### Style 1 — Double Exposure (warm, atmospheric, psychedelic)
- Photo base layer
- Purple gradient wash on top (Electric Amethyst to Deep Violet)
- Blend mode: multiply
- Film grain overlay (medium intensity)
- Result: dreamy, layered, like seeing through tinted glass

Emotional register: **presence, depth, late night, introspection**

### Style 2 — Illustrated Contour (bold, graphic, live energy)
- Dark background
- Subject photo converted to luminance mask → solid colour fill (85%+ opacity)
- Clean border ring via morphological dilation (`dilated_mask - original_mask = outline ring`)
- Light grain only (~10 intensity)
- Bold Lora-Bold name typography (200–250pt), extreme tracking on secondary lines

Emotional register: **energy, performance, graphic punch, celebration**

Key notes:
- DJ decks and golf shots work best for this style
- Portrait photos need `rotate=90` and inverted mask (bright ceiling bg, dark figure)
- The contour ring should be a contrasting brand colour, not the fill colour

---

## Key Symbols

**Do not substitute or replace these.**

1. **The Nine of Cups tarot figure** — primary logo/avatar mark. The smiling figure, arms crossed, nine chalices arranged in an arc above. This is the logo. `logo.svg` / `logo.png` in this folder.

2. **9cups colour mark** — the hand-drawn IX/cup mark in yellow. `9cups_colorLogo.png`. Secondary identifier.

3. **Two tin cups on a woven mat** — communion, sharing, campfire still life. A recurring sub-motif for release art and social. Use the spirit of this image even when not using the photo directly.

4. **The mandala tapestry** — intricate, global, celebratory. Background and texture source. Strong in festival and community contexts.

---

## Texture Rules

- **Never flat colour without texture bleeding through** — grain is part of the voice
- Favoured textures:
  - Gritty asphalt / concrete — urban, tactile, street-level
  - Woven bamboo / natural material — community, handmade, warmth
  - Tapestry / mandala pattern — ornate, global
  - Paper / screen grain — tarot card quality, sketch-like
- These textures say: *this music comes from the ground, not a computer-generated non-place*

---

## Spatial / Composition Language

- **Intimate, not spectacular** — perspective is always *among*, never *above*
- Compositions breathe — never crowded
- Frame-within-frame / rectangle-within-square creates printmaking quality
- Objects placed with care — a still life sensibility even in promotional work
- Geometric grid overlays (quadrant division) signal craft and intention

---

## Applying the Brand by Context

### Album / single cover art
Double-exposure style. Purple/magenta overlay on photography. Vary the purple temperature to signal emotional register of the release:
- Warm pink-purple = love/connection
- Cool blue-violet = introspection
- Saturated electric purple = celebration/live energy

### Social graphics (Instagram, TikTok, Story)
Either style works. Illustrated contour for bold performance energy. Double-exposure for mood pieces. Bold type, minimal words.

### Website / web components
Dark backgrounds, Electric Amethyst or Deep Violet as primary field. IM Fell English for headings at confident scale. Let photography breathe and interact with type — overlap, bleed, share space.

### Event posters
Go all-in. Large-scale type, dramatic colour overlays, layered photography, hand-drawn elements. This is where the brand can push hardest.

### Profile / avatar images
The Nine of Cups tarot figure is the avatar. Do not replace with photography in primary avatar positions.

---

## Mood Words

Contemplative · Communal · Psychedelic without ego · Warm · Textured · Knowing · Unhurried · Layered · Spiritual without dogma · Present · Wellington-rooted · Global in influence

## NOT This Brand

Aggressive · Minimalist · Corporate · Cold · Ironic without feeling · Loudly digital · Flat colour · Pixel-perfect without grain

---

## Before Delivering Any Brand Output

1. Is the colour palette in the purple family with correct proportions?
2. Is the typeface IM Fell English for any wordmark or heading?
3. Does at least one texture layer bleed through — grain, asphalt, fabric?
4. Does the composition breathe and feel intimate rather than spectacular?
5. Are any brand symbols (tarot figure, cups motif) used correctly?
6. Does the overall mood match the mood words above?
7. Have I cross-checked against the `design-inspiration` visual references?

---

## How to Evolve This Skill

This document grows with the brand. When a new decision is made — a new texture approved, a typography rule refined, a new sub-motif established — update the relevant section. Note what was decided and why. The brand philosophy files in this folder (`9cups-brand-philosophy.md`, `9cups-brand-reference.md`) are the source of truth for the *why*; this SKILL.md is the operational guide for the *how*.
