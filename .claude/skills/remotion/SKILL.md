---
name: remotion
description: Build programmatic videos with React and Remotion. Load when creating video compositions, animations for export, generative video, data visualisations as video, or anything that needs rendering to mp4/gif/webm.
---

# Remotion — React Video Creation

## When to use Remotion
- Batch or generative video (data-driven, parameterised)
- Product demos, release videos, explainers
- Animated charts or data visualisations
- When you need consistent, reproducible video output
- NOT for general-purpose video editing or playback

## Core concepts

### Composition
Every video is a `<Composition>` registered in `remotion.config.ts`:
```tsx
<Composition
  id="MyVideo"
  component={MyVideo}
  durationInFrames={150}
  fps={30}
  width={1920}
  height={1080}
/>
```

### Timing
- `useCurrentFrame()` — current frame number (0-based)
- `interpolate(frame, [0, 30], [0, 1])` — map frame range to value range
- `spring({ frame, fps, config })` — physics-based spring animation
- `<Sequence from={30} durationInFrames={60}>` — time-offset children

### Assets
- `staticFile('video.mp4')` for files in /public
- `<Video>`, `<Audio>`, `<Img>` — Remotion-aware media components
- `<OffthreadVideo>` for better frame accuracy with video

### Audio
- Use `<Audio src={staticFile('track.mp3')} />` inside compositions
- `useAudioData()` + `visualizeAudio()` for audio-reactive animations

## Best practices
- Keep compositions small and composable — one component per scene
- Use `AbsoluteFill` for full-bleed layers
- Parameterise with `inputProps` and Zod schema for reusable videos
- Test in the Remotion Studio before rendering (`npx remotion studio`)
- Use `@remotion/player` to embed a preview in the browser without rendering

## Common patterns

### Audio-reactive shape
```tsx
const frame = useCurrentFrame()
const { fps } = useVideoConfig()
const audioData = useAudioData(staticFile('track.mp3'))
if (!audioData) return null
const amplitude = visualizeAudio({ fps, frame, data: audioData, numberOfSamples: 32 })
// amplitude is an array of 0–1 values per frequency band
```

### Staggered entrance
```tsx
const delay = index * 5 // frames
const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
```

## Project structure
```
remotion/
  Root.tsx         # registers all Compositions
  scenes/          # individual scene components
  components/      # reusable primitives
```
