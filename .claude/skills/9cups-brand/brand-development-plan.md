# Brand Development Plan
*Last updated: March 22, 2026*

---

## Tool Setup

- **Claude Desktop** (Cowork mode) ✅
- **Canva MCP** ✅ Connected — folder `FAHEnDSR27w`
- **Python/Pillow pipeline** ✅ — scripts in `scripts/` folder
- **Claude in Chrome extension** ✅ Connected

---

## The Phases

### Phase 1 — Brand Extraction ✅ COMPLETE
- Analysed 11 existing brand images
- Produced `9cups-brand-philosophy.md` — the design soul document
- Extracted formal colour palette with hex codes
- Researched adjacent artists (Bonobo, Flying Lotus, Floating Points, Tipper) and key designers (Neil Krug, Leif Podhajsky)

### Phase 2 — Brand System ✅ COMPLETE
- `9cups-brand-reference.md` — quick-reference styleguide
- `9cups-colour-palette.md` — palette with proportional use rules
- `9cups-fonts.md` — IM Fell English + DM Sans system
- `9cups-visual-research.html` — visual lineage reference page
- Interactive brand system widget (conversation history)

### Phase 3 — Asset Creation 🔄 IN PROGRESS

#### Completed (Session 3 — March 22, 2026)
- [x] Design philosophy written: "Abundance Seams"
- [x] Python/Pillow generation pipeline built (4 scripts in `scripts/`)
- [x] **Double-exposure style assets** (6 files in `designs/`):
  - Instagram post 1080×1080
  - TikTok/Story 1080×1920
  - Website hero mockup 1920×1080
  - SoundCloud/Mixcloud banner 2500×500
  - Bandcamp header 2500×625
  - Brand mood board 2000×2000
- [x] **Illustrated style v1** (3 files — initial technique):
  - Instagram illustrated 1080×1080 (hot magenta fill + teal/amethyst edge contours)
  - Story illustrated 1080×1920 (electric amethyst fill + magenta contours)
  - SoundCloud illustrated 2500×500 (crimson rose fill + amethyst edges)
- [x] **Illustrated style v2** (5 files — improved: clean morphological outlines, solid fills, bold typography):
  - `instagram-illustrated-v2-1080x1080.png` — dj_decks, hot magenta fill, teal outline ring
  - `story-illustrated-v2-1080x1920.png` — dj_decks, electric amethyst, magenta outline
  - `soundcloud-illustrated-v2-2500x500.png` — golf, crimson rose, amethyst outline
  - `bandcamp-illustrated-v2-2500x625.png` — beach, teal fill, lavender outline
  - `instagram-bold-v2-1080x1080.png` — portrait (rotated+inverted), deep violet, bone white outline
- [x] All 14 inspiration images analysed for typography/composition direction
- [x] HTML mockup files (4 — open in browser)
- [x] Canva connection tested, Canva folder set up

#### Still To Do
- [ ] **Logo concepts in brand colours** — recolour SVG figure; iterate on `9cups_colorLogo.png`
- [ ] **Release / single cover art template** — for new music drops
- [ ] **Event/gig poster** — vertical A3, reusable template
- [ ] **Profile image variants** — avatar-optimised for each platform
- [ ] **Illustrated style iterations** — try with beach/golf photos, adjust effect intensity

#### Technique Notes
**Two visual styles are now established:**
1. **Double-exposure** — Photo base + purple gradient wash (mix-blend-mode: multiply) + film grain. Warm, atmospheric, psychedelic.
2. **Illustrated contour v2** — Dark background + luminance/inverted-luminance figure mask + solid colour fill (85%+ opacity) + **morphological dilation outline** (clean ring, not noisy edge detect) + light grain only (~10 intensity). Bold, graphic. Best with dj_decks and golf shots.
   - Key technique: `dilated_mask - original_mask = clean border ring`
   - Portrait photo needs `rotate=90, inverted mask` (bright ceiling background, dark figure)
   - Typography: large Lora-Bold name (200–250pt), extreme tracking on secondary lines, minimal words

**Inspiration image library analysed (14 images):**
- NIKI SADEKI: huge name, dark atmosphere → base for our typography
- WEAVING INNOVATION: stacked all-caps, one accent word → composition direction
- N×: extreme typographic scale, single letterform → scale reference
- RED BLUE YELLOW BLACK AGAIN: film-poster serif stacked → mood reference
- Qlip dot-matrix horse: geometric/halftone fill technique → future exploration
- AVEC, DOLLS, AZERO: editorial layout, dark bg, minimal UI → website direction

**To regenerate assets in a new session:**
```bash
# 1. Resize source photos
mkdir -p /sessions/relaxed-dazzling-hopper/assets
python3 -c "
from PIL import Image; import os
photos = {'beach':'9cupsBeach.png','golf':'9cupsGolfDay-credit_Hamish-Johns.JPG','dj_decks':'IMG_7015.PNG','portrait':'9cupsPortait.jpg','purple_floor':'IMG_2396.png'}
src = '/sessions/relaxed-dazzling-hopper/mnt/9cups Brand/9cupsImages/'
out = '/sessions/relaxed-dazzling-hopper/assets/'
os.makedirs(out, exist_ok=True)
for n,f in photos.items():
    img = Image.open(src+f); img.thumbnail((1200,1200), Image.LANCZOS); img.convert('RGB').save(out+n+'.jpg','JPEG',quality=80); print('✓',n)
"
# 2. Copy logos
cp '/sessions/relaxed-dazzling-hopper/mnt/9cups Brand/logo.png' /sessions/relaxed-dazzling-hopper/assets/
cp '/sessions/relaxed-dazzling-hopper/mnt/9cups Brand/9cups_colorLogo.png' /sessions/relaxed-dazzling-hopper/assets/colorlogo.png
# 3. Run scripts
python3 '/sessions/relaxed-dazzling-hopper/mnt/9cups Brand/scripts/generate_assets.py'        # double-exposure (6 assets)
python3 '/sessions/relaxed-dazzling-hopper/mnt/9cups Brand/scripts/illustrated_assets_v2.py'  # illustrated v2 (5 assets) ← USE THIS ONE
python3 '/sessions/relaxed-dazzling-hopper/mnt/9cups Brand/scripts/refine_banners.py'         # refined SC + Bandcamp banners
```

### Phase 4 — Website Build & Ongoing ⏳ PENDING
- Full artist site: Music / About / Events / Book
- Website hero mockup done ✅ — ready to hand off to build phase
- Stack TBD (likely raw HTML/CSS → potential Webflow/Squarespace)
- Press kit one-pager PDF for promoters
- Affinity Photo recipes for double-exposure technique
- Link-in-bio HTML page

---

## File Index

```
9cups Brand/
├── 9cups-brand-philosophy.md     ← Design soul document
├── 9cups-brand-reference.md      ← Quick-reference (paste into new sessions)
├── 9cups-colour-palette.md       ← Palette with hex codes
├── 9cups-fonts.md                ← Typography system
├── 9cups-visual-research.html    ← Open in browser — visual lineage reference
├── brand-development-plan.md     ← This file
├── summary.md                    ← Full session context handoff
├── logo.svg                      ← Nine of Cups tarot figure (primary logo)
├── logo.png                      ← PNG version of above
├── 9cups_colorLogo.png           ← Hand-drawn IX/cup mark in yellow
├── 9cups links to socials...xlsx ← Social media links
├── Copy of 9cups bio...docx      ← Newtown Festival bio copy
├── designs/
│   ├── 9cups-design-philosophy.md
│   ├── instagram-post-1080x1080.png         ← Double-exposure style
│   ├── story-tiktok-1080x1920.png
│   ├── website-hero-1920x1080.png
│   ├── soundcloud-banner-2500x500.png
│   ├── bandcamp-header-2500x625.png
│   ├── brand-moodboard-2000x2000.png
│   ├── instagram-illustrated-1080x1080.png  ← Illustrated contour style
│   ├── story-illustrated-1080x1920.png
│   ├── soundcloud-illustrated-2500x500.png
│   ├── instagram-post.html                  ← HTML mockups (open in browser)
│   ├── story-tiktok.html
│   ├── website-hero.html
│   └── soundcloud-banner.html
├── scripts/
│   ├── generate_assets.py        ← Double-exposure asset generator
│   ├── illustrated_assets.py     ← Illustrated contour style generator
│   └── refine_banners.py         ← Banner refinement script
├── 9cupsImages/                  ← Source photos
└── inspiration-images/           ← Reference/mood images
```
