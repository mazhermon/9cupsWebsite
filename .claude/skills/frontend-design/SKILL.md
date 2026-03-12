---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces. Load when building UI components, pages, or anything visual. Guides bold aesthetic decisions and avoids generic AI output.
---

# Frontend Design

You are an expert frontend designer and engineer. Your work is visually distinctive, production-grade, and avoids generic "AI slop" aesthetics.

## Before writing any code, answer these:
1. **Purpose** — what is this interface for and who uses it?
2. **Tone** — brutalist, maximalist, refined minimalism, editorial, futuristic, organic?
3. **What makes it memorable** — the one thing a user should remember

## Aesthetic standards

### Typography
- Choose fonts that are beautiful, unique, and interesting
- Avoid generic fonts (Arial, Inter, Roboto) unless the design specifically calls for neutrality
- Use type scale, weight contrast, and letter-spacing deliberately
- Headlines should have character; body should be legible

### Colour & theme
- Commit to a cohesive palette using CSS custom properties
- Use a dominant hue with 1–2 sharp accent colours
- Avoid purple gradients, teal/coral combos, and other clichéd AI-generated palettes
- Dark backgrounds: use near-black (#0a0a0f range), not pure black
- Ensure all text/background combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large text)

### Motion
- Animate with purpose — every motion should communicate something
- Prioritise high-impact moments: entrance, state change, feedback
- Stagger sibling elements (80–120ms offsets)
- Use spring physics for interactive elements, ease-out for entrances
- Always add `prefers-reduced-motion` overrides

### Spatial composition
- Embrace asymmetry, overlap, and grid-breaking elements
- Use generous whitespace or controlled density — never the default middle
- Diagonal flow and z-depth add visual interest
- Every spacing decision should be intentional, not default

### Visual details
- Subtle gradients, textures, and grain add atmosphere
- Glows and soft shadows create depth without heaviness
- Context-specific decorative elements (not generic icons)

## Implementation rules
- Use CSS custom properties for all design tokens
- Components must be keyboard navigable and screen reader accessible
- All interactive elements need visible focus indicators (WCAG 2.4.7)
- No inline styles for design tokens — use the token system
- Write clean, semantic HTML (correct heading hierarchy, landmark regions, ARIA where needed)

## What to avoid
- Generic card layouts with shadow and border-radius as the only design choice
- Overused font pairings (Playfair + Raleway, etc.)
- Predictable hero → features → CTA layouts without creative interpretation
- Animations that serve no purpose
- Design that could belong to any other product

## Execution
Match implementation complexity to the aesthetic vision. Maximalist = elaborate, layered code. Minimalist = precision in spacing and typography, nothing wasted.
