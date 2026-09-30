'use client'

// Single-track player for the landing page.
//
// Deliberately NOT a generalisation of useAudioEngine. The two have opposing
// requirements and one abstraction would compromise both:
//
//   useAudioEngine  — four stems that must stay sample-locked to each other.
//                     Needs AudioBufferSourceNode, which means downloading and
//                     decoding every byte before the first sound.
//   useTrackPlayer   — one track where time-to-first-sound is the metric that
//                     matters. Needs a streaming <audio> element, which starts
//                     on a few buffered seconds instead of the whole file.
//
// createMediaElementSource still yields a real AnalyserNode, so the terrain
// reacts exactly as it does on the mixer page.

import { useCallback, useEffect, useRef, useState } from 'react'

export interface TrackPlayerReturn {
  /** `canplay` has fired — enough is buffered to start. Not "fully loaded". */
  ready: boolean
  isPlaying: boolean
  /** True once the user has started playback at least once. */
  hasStarted: boolean
  error: string | null
  /** Null until the first toggle() creates the graph, and stays null if the
   *  AudioContext couldn't be created. Audio still plays in that case. */
  analyser: AnalyserNode | null
  toggle: () => void
}

// Matched to useAudioEngine so the terrain behaves consistently across pages.
const FFT_SIZE = 2048
const SMOOTHING = 0.4

export function useTrackPlayer(url: string): TrackPlayerReturn {
  const elRef = useRef<HTMLAudioElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

  const [ready, setReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)

  // Create the element on mount so buffering starts immediately, but do NOT
  // create an AudioContext here — see the comment in ensureGraph below.
  useEffect(() => {
    // A new url means a brand-new, paused element. Without this the UI would
    // keep the previous track's state — isPlaying could read true for audio
    // that isn't playing, which is exactly what this hook promises not to do.
    setReady(false)
    setIsPlaying(false)
    setHasStarted(false)
    setError(null)
    setAnalyser(null)

    const el = new Audio()
    el.loop = true
    el.preload = 'auto'
    // No crossOrigin: the file is served same-origin from /public, and setting
    // it would put the request in CORS mode for no benefit.
    el.src = url
    elRef.current = el

    const onCanPlay = () => setReady(true)
    const onError = () => {
      setReady(false)
      setError(el.error?.message || 'Could not load the track')
    }
    // The element can be paused by something other than toggle() — an OS media
    // key, a phone call, headphones unplugging. Mirror those so the button
    // never claims a state the audio isn't in.
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    el.addEventListener('canplay', onCanPlay)
    el.addEventListener('error', onError)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)

    return () => {
      el.removeEventListener('canplay', onCanPlay)
      el.removeEventListener('error', onError)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.pause()
      // Release the network/decoder resources. Setting src to '' and calling
      // load() is the documented way to stop an element buffering.
      el.src = ''
      el.load()
      sourceRef.current?.disconnect()
      ctxRef.current?.close().catch(() => { /* already closed */ })
      ctxRef.current = null
      sourceRef.current = null
      elRef.current = null
    }
  }, [url])

  /** Build the analyser graph. Called from the first toggle(), never at mount:
   *  a context created without a user gesture starts `suspended` under autoplay
   *  policy, and on Safari can end up permanently unusable. */
  const ensureGraph = useCallback((el: HTMLAudioElement) => {
    if (ctxRef.current) return
    try {
      const ctx = new AudioContext()
      const source = ctx.createMediaElementSource(el)
      const node = ctx.createAnalyser()
      node.fftSize = FFT_SIZE
      node.smoothingTimeConstant = SMOOTHING

      // NOTE: routing through createMediaElementSource bypasses the element's
      // own volume. There's no volume control on this page; if one is added it
      // must be a GainNode, not el.volume.
      source.connect(node)
      node.connect(ctx.destination)

      ctxRef.current = ctx
      sourceRef.current = source
      setAnalyser(node)
    } catch {
      // No WebAudio (old Safari, context limit reached). The element still
      // plays audibly; the terrain just holds its resting posture.
      // Audio without visuals beats neither.
      ctxRef.current = null
      setAnalyser(null)
    }
  }, [])

  const toggle = useCallback(() => {
    const el = elRef.current
    if (!el) return

    if (!el.paused) {
      el.pause()
      return
    }

    ensureGraph(el)
    // A context can be suspended by the browser between plays; resume is a
    // no-op when it's already running.
    ctxRef.current?.resume().catch(() => { /* not fatal, element still plays */ })

    el.play()
      .then(() => setHasStarted(true))
      .catch(err => {
        // Autoplay policy or a decode failure. Leave isPlaying false so the
        // button doesn't lie about state.
        setIsPlaying(false)
        setError(err?.message || 'Playback was blocked')
      })
  }, [ensureGraph])

  return { ready, isPlaying, hasStarted, error, analyser, toggle }
}
