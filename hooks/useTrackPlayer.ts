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
  /** Enough is buffered to start. Informational only — do NOT gate the play
   *  button on it. A media element buffers on demand when you call play(),
   *  so blocking the control until `ready` only makes the page look broken
   *  when the network is slow. */
  ready: boolean
  /** Actively waiting on data after a play attempt. This is what should drive
   *  a "Loading…" label, not `ready`. */
  buffering: boolean
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
  const assignSrcRef = useRef<(() => void) | null>(null)

  const [ready, setReady] = useState(false)
  const [buffering, setBuffering] = useState(false)
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
    setBuffering(false)
    setIsPlaying(false)
    setHasStarted(false)
    setError(null)
    setAnalyser(null)

    const el = new Audio()
    el.loop = true
    el.preload = 'auto'
    elRef.current = el
    // `src` is assigned later, not here. Assigning it starts a fetch
    // immediately — even at preload="none" — so setting it now and calling
    // load() afterwards produced three requests for the same file: two
    // aborted, one served. One assignment, at the moment we want the download,
    // is exactly one request.
    let srcAssigned = false
    const assignSrc = () => {
      if (srcAssigned || elRef.current !== el) return
      srcAssigned = true
      el.src = url
      // If it resolves instantly from cache, adopt that state rather than
      // waiting for an event that may already have fired.
      if (el.readyState >= 2 /* HAVE_CURRENT_DATA */) setReady(true)
    }
    assignSrcRef.current = assignSrc

    const onCanPlay = () => { setReady(true); setBuffering(false) }
    const onError = () => {
      setReady(false)
      setBuffering(false)
      setError(el.error?.message || 'Could not load the track')
    }
    // The element can be paused by something other than toggle() — an OS media
    // key, a phone call, headphones unplugging. Mirror those so the button
    // never claims a state the audio isn't in.
    const onPlay = () => setIsPlaying(true)
    const onPause = () => { setIsPlaying(false); setBuffering(false) }
    const onWaiting = () => setBuffering(true)
    const onPlaying = () => { setBuffering(false); setReady(true) }

    // Listeners BEFORE src. This ordering is the whole bug: with a warm HTTP
    // cache the element can reach HAVE_ENOUGH_DATA and fire `canplay` before a
    // listener attached afterwards exists to hear it. The event is missed,
    // `ready` never flips, and the button sits disabled on "Loading…" forever.
    // That is the intermittent "stuck loading, never plays" report — it
    // depended on cache state, which is exactly why it was intermittent.
    el.addEventListener('canplay', onCanPlay)
    el.addEventListener('canplaythrough', onCanPlay)
    el.addEventListener('loadeddata', onCanPlay)
    el.addEventListener('error', onError)
    el.addEventListener('play', onPlay)
    el.addEventListener('pause', onPause)
    el.addEventListener('waiting', onWaiting)
    el.addEventListener('stalled', onWaiting)
    el.addEventListener('playing', onPlaying)

    // Start the download as soon as the first render is done — deliberately NOT
    // on `window.load`, which waits for every subresource including the hero
    // video. Pressing play is the expected first action, so the track outranks
    // the decorative background: this queues on the first idle slot after
    // paint, and the `timeout` guarantees it starts even on a busy main thread.
    // BackgroundVideo still waits for window.load, so the ordering is
    // audio-then-video rather than the reverse.
    let idleId: number | undefined
    const idle = window.requestIdleCallback
    idleId = idle
      ? (idle(assignSrc, { timeout: 1200 }) as unknown as number)
      : window.setTimeout(assignSrc, 200)

    return () => {
      if (idleId !== undefined) (window.cancelIdleCallback ?? window.clearTimeout)(idleId)
      el.removeEventListener('canplay', onCanPlay)
      el.removeEventListener('canplaythrough', onCanPlay)
      el.removeEventListener('loadeddata', onCanPlay)
      el.removeEventListener('error', onError)
      el.removeEventListener('play', onPlay)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('waiting', onWaiting)
      el.removeEventListener('stalled', onWaiting)
      el.removeEventListener('playing', onPlaying)
      el.pause()
      assignSrcRef.current = null
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

    // The visitor can beat the deferred preload. If so, this click starts it.
    assignSrcRef.current?.()
    // If nothing is buffered yet, this click IS the load trigger. Say so.
    if (el.readyState < 3 /* HAVE_FUTURE_DATA */) setBuffering(true)

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
        setBuffering(false)
        setError(err?.message || 'Playback was blocked')
      })
  }, [ensureGraph])

  return { ready, buffering, isPlaying, hasStarted, error, analyser, toggle }
}
