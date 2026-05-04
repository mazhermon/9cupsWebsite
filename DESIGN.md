# Design

Implementation-facing distillation of the 9cups visual system. Source of truth is `.claude/skills/9cups-brand/`. When this file conflicts with the brand skill, defer to the skill.

## Theme

Dark, layered, textured. A friend's flat at midnight in Wellington, one warm amber lamp on, a good pair of speakers playing house through a haze of light incense. Not a club. Not a studio. The room is purple-black, the music is real, the mood is intimate.

Light theme is not used for this surface.

## Colour

**Strategy: Committed.** Electric Amethyst and Deep Violet carry the surface. Warm magenta and crimson accents punctuate. Bone White only where type must read clearly. Acid Moss only as occasional organic surprise.

Tinted neutrals only. Pure `#000` and `#fff` are never used.

| CSS token | Hex | OKLCH (approx) | Role |
|---|---|---|---|
| `--color-primary-dark`    | `#3B1A6E` | oklch(28% 0.16 295) | Deep Violet — primary surface, ground |
| `--color-primary-mid`     | `#8B3AC4` | oklch(50% 0.22 305) | Electric Amethyst — identity, primary brand colour |
| `--color-primary-light`   | `#C47EE8` | oklch(72% 0.16 305) | Bright Lavender — highlights |
| `--color-primary-pale`    | `#D4AAEE` | oklch(80% 0.10 305) | Lilac Mist — soft negative space, sparingly |
| `--color-accent-warm`     | `#B03060` | oklch(48% 0.18 5)   | Crimson Rose — warm accent |
| `--color-accent-vivid`    | `#CC2E90` | oklch(56% 0.24 350) | Hot Magenta — vivid accent |
| `--color-ground-dark`     | `#1A2A1E` | oklch(22% 0.03 145) | Dark Forest — deep anchor (rare) |
| `--color-ground-mid`      | `#3A3530` | oklch(28% 0.01 60)  | Warm Asphalt — neutral ground |
| `--color-ground-light`    | `#F0EBE0` | oklch(94% 0.02 80)  | Bone White — type, sketch lines |
| `--color-accent-organic`  | `#7A8A1A` | oklch(56% 0.16 120) | Acid Moss — sparingly, ≤5% |

Proportional rules: 60% purple family, 20% warm accents, 15% neutral grounds, 5% Acid Moss.

Stem colour assignment (replaces the legacy neon palette):

| Stem | Token | Reason |
|---|---|---|
| Bass   | `--color-primary-dark`  | Lowest, deepest, anchors the bottom of the spectrum |
| Drums  | `--color-accent-warm`   | Percussive, warm, body-driven |
| Main   | `--color-primary-mid`   | Centre of identity, the lead element |
| Vox    | `--color-accent-vivid`  | Brightest, voice-forward, demands attention |

## Typography

The brand has already committed to this pairing; preserve it (overrides the impeccable greenfield reflex-reject list).

```
--font-display: 'IM Fell English', Georgia, serif;
--font-body:    'DM Sans', system-ui, sans-serif;
```

**Headings, wordmark, track titles**: IM Fell English. Old-style serif, slightly archaic, literary. Sets large with confidence; tracking tight on display, generous on small caps labels.

**Body, labels, microcopy**: DM Sans light. Quiet, just enough to read.

Scale (modular, ≥1.25 between display steps):

```
--text-xs:    0.75rem    /* 12px — microcopy, status */
--text-sm:    0.875rem   /* 14px — body labels */
--text-base:  1rem       /* 16px — paragraph */
--text-lg:    1.25rem    /* 20px — section caption */
--text-xl:    clamp(1.5rem, 3vw, 2.25rem)   /* track title */
--text-2xl:   clamp(2rem, 5vw, 3rem)        /* section heading */
--text-3xl:   clamp(2.5rem, 7vw, 5rem)      /* hero wordmark */
```

Line-height: body 1.55, display 1.05–1.15. On dark surfaces, add 0.05 to body line-height.

Tracking: tight on display headings (-0.02em), extreme positive on small-caps labels (+0.12em to +0.18em).

## Spacing

```
--space-1:   4px
--space-2:   8px
--space-3:   12px
--space-4:   16px
--space-6:   24px
--space-8:   32px
--space-12:  48px
--space-16:  64px
--space-24:  96px
```

Vary, don't repeat. Tight groupings for related controls; generous separation between sections. No "padding everywhere is the same" rhythm.

## Radii

```
--radius-sm:    6px      /* form controls, small chips */
--radius-md:    12px     /* cards, panels */
--radius-lg:    24px     /* primary CTAs */
--radius-full:  9999px   /* pills */
```

## Texture

Mandatory. No surface ships flat.

- **Grain overlay**: SVG noise (`feTurbulence`, baseFrequency ~0.9), applied as a fixed full-viewport overlay at 6–10% opacity, `mix-blend-mode: overlay`. Generated once, not animated.
- **Tarot-paper fibre**: hand-scanned paper texture as an optional `background-image` on hero zones.
- **Concrete / asphalt**: for grounding moments at the bottom of long sections.

The grain says this is real, not generated.

## Motion

- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for arrivals; `cubic-bezier(0.7, 0, 0.84, 0)` for departures.
- Durations: 150ms for state changes (hover, focus, mute toggle); 400–600ms for arrivals; 800ms+ only for choreographed reveals. Never bounce or elastic.
- Audio-reactive motion holds a stable 60fps on a mid-tier phone, or the technique is replaced.
- `prefers-reduced-motion`: every animated element has a static expression. Audio plays; visuals freeze in their resting posture.

## Components

### Track shape (audio-reactive blob)

One per stem. Each shape:
- Fills with a brand-aligned colour from the stem assignment table above. No legacy neon.
- Distorts via direct path morphing (control-point radial offsets driven by audio energy). NOT `feTurbulence + feDisplacementMap` (perf cost).
- States: default, playing, muted (dimmed + ring outline overlay, no harsh `X`), focus, hover, disabled, loading.
- Is a button. Click toggles mute. Keyboard-operable, focus ring 3px in shape colour.

### Listen-on platform CTA

Below the mixer, a horizontal cluster of platform links:
- Spotify, Apple Music, Bandcamp, SoundCloud, YouTube Music (configurable per release).
- Each is a real `<a>` opening in a new tab.
- Brand-purple pill background, IM Fell English platform name, DM Sans for any caption. No imported platform brand colours.
- Hover: subtle warm-magenta accent on border.
- Visited: faint Acid Moss trail on the underline (a quiet acknowledgement they've been there).

### Wordmark

`9cups` in IM Fell English. Hero scale uses `--text-3xl`. The numeral sits flush with the word. Centered for the hero, left-aligned in compact contexts.

### Toolbar (play/pause)

A single circular button, brand-purple, no card or border. Right edge of viewport, vertically centred on desktop; bottom-right pill on mobile.

## Layout

Home page hero is a single `100dvh` surface:

1. **Top zone** (~15dvh): wordmark, modest scale (unhurried, not stadium).
2. **Centre zone** (~55dvh): four stem shapes arranged in a gentle arc echoing the Nine of Cups card composition. Centre shapes slightly forward in z-order, outer shapes slightly behind, creating depth.
3. **Title zone** (~10dvh): track name in IM Fell English, artist line in DM Sans small-caps with extreme tracking.
4. **Listen zone** (~20dvh): "LISTEN ON" eyebrow above platform CTA cluster.

A continuous grain overlay covers the whole viewport. A faint mandala-tapestry texture sits in the deepest background at ~5% opacity.

Asymmetric where the brand calls for it; never centered-stack-template.

## Accessibility tokens

```
--focus-ring-width: 3px
--focus-ring:       0 0 0 3px var(--color-primary-light)
--touch-target-min: 44px
```

Focus rings always visible on `:focus-visible`, never removed without replacement.

## Anti-patterns for this surface

- The hero-metric template (big number, small label, gradient accent).
- Identical-card grids.
- Side-stripe borders on cards or callouts.
- Gradient text via `background-clip: text`.
- Glassmorphism as decoration (rare and purposeful only).
- Modal as first thought.
- Centered-stack hero with icon-title-subtitle.
- All-caps body copy.
- Em dashes in any user-facing string. Use commas, colons, semicolons, periods, or parentheses.
