# 9cups · todo

Edited either by hand or from `/todo` in local dev. Plain markdown checkboxes,
so it stays readable and diffable either way.

## Content I need to supply

- [ ] Mastered full-length mp3 at `public/audio/9cupsCatchingAFeelingWeb_mix.mp3` (overwrite; the current file is a 28-second loop built from the stems)
- [ ] Embed URLs for the mixes, pasted into `MIXES` in `lib/releases.ts`
- [ ] Embed URLs for the originals, pasted into `ORIGINALS` in `lib/releases.ts`
- [ ] Press-pack share link (Drive or Dropbox) for `PRESS_PACK_URL` in `lib/site-config.ts`
- [ ] Press/hero image for the About page
- [ ] Real biography copy for the marked block on the About page
- [ ] Decide what `mov/9cupsVid.MOV` is for, or delete it

## Decisions open

- [ ] Merge `content-pages` to main, or hold until the lists have entries
- [ ] Apple Music link, if a profile exists
- [ ] Whether the hero's "press play to enter" should also take the Marigold accent

## Shipping

- [ ] Connect the GitHub repo to a Vercel project
- [ ] Confirm the first deploy renders the video hero and the audio loads
- [ ] Check a real phone, not just an emulated viewport

## Done

- [x] Pick a wordmark typeface (Bungee)
- [x] Pick a hero ground colour (lifted violet `#4A2270`)
- [x] Pick an accent colour (Marigold `#FFB627`, primary CTA only)
- [x] Fix the audio loader getting stuck on "Loading…"
- [x] Nav bar across the site
- [x] Rename `/mixer` to `/stems` so it stops clashing with Mixes
