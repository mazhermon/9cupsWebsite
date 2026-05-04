'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export interface TrackState {
  id: number
  loaded: boolean
  loadProgress: number // 0–100
  muted: boolean
  error: string | null
}

export interface AudioEngineReturn {
  tracks: TrackState[]
  allLoaded: boolean
  isPlaying: boolean
  hasStarted: boolean
  analysers: (AnalyserNode | null)[]
  toggleMute: (id: number) => void
  startPlayback: () => void
  togglePlayback: () => void
}

const BUFFER_SIZE = 2048

export function useAudioEngine(trackUrls: string[]): AudioEngineReturn {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const buffersRef = useRef<(AudioBuffer | null)[]>(new Array(trackUrls.length).fill(null))
  const sourcesRef = useRef<(AudioBufferSourceNode | null)[]>(new Array(trackUrls.length).fill(null))
  const gainsRef = useRef<(GainNode | null)[]>(new Array(trackUrls.length).fill(null))
  const analysersRef = useRef<(AnalyserNode | null)[]>(new Array(trackUrls.length).fill(null))
  const startTimeRef = useRef<number>(0)
  const offsetRef = useRef<number>(0)

  const [tracks, setTracks] = useState<TrackState[]>(
    trackUrls.map((_, i) => ({
      id: i,
      loaded: false,
      loadProgress: 0,
      muted: false,
      error: null,
    }))
  )
  const [allLoaded, setAllLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  const updateTrack = useCallback((id: number, update: Partial<TrackState>) => {
    setTracks(prev => prev.map(t => (t.id === id ? { ...t, ...update } : t)))
  }, [])

  // Load all tracks with fetch progress
  useEffect(() => {
    const controller = new AbortController()

    const loadTrack = async (url: string, id: number) => {
      try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const contentLength = response.headers.get('content-length')
        const total = contentLength ? parseInt(contentLength, 10) : 0
        let received = 0

        const reader = response.body!.getReader()
        const chunks: ArrayBuffer[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer)
          received += value.byteLength
          const progress = total > 0 ? Math.round((received / total) * 100) : 50
          updateTrack(id, { loadProgress: progress })
        }

        const blob = new Blob(chunks)
        const arrayBuffer = await blob.arrayBuffer()

        // Lazily create AudioContext on first decode (avoids autoplay policy issues at import time)
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext()
        }

        const audioBuffer = await audioCtxRef.current.decodeAudioData(arrayBuffer)
        buffersRef.current[id] = audioBuffer
        updateTrack(id, { loaded: true, loadProgress: 100 })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        updateTrack(id, { error: (err as Error).message })
      }
    }

    Promise.all(trackUrls.map((url, i) => loadTrack(url, i))).then(() => {
      const allGood = buffersRef.current.every(b => b !== null)
      if (allGood) setAllLoaded(true)
    })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Wire up audio graph for all loaded buffers.
  // toggleMute is a no-op before the graph exists, so all gains start at 1.
  const buildGraph = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return

    buffersRef.current.forEach((buffer, i) => {
      if (!buffer) return

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true

      const gain = ctx.createGain()
      gain.gain.value = 1

      const analyser = ctx.createAnalyser()
      analyser.fftSize = BUFFER_SIZE
      analyser.smoothingTimeConstant = 0.85

      source.connect(gain)
      gain.connect(analyser)
      analyser.connect(ctx.destination)

      sourcesRef.current[i] = source
      gainsRef.current[i] = gain
      analysersRef.current[i] = analyser
    })
  }, [])

  const startPlayback = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx || !allLoaded) return

    buildGraph()

    // Resume context if suspended (autoplay policy)
    ctx.resume().then(() => {
      const startAt = ctx.currentTime
      startTimeRef.current = startAt
      offsetRef.current = 0

      sourcesRef.current.forEach(source => {
        source?.start(startAt)
      })

      setIsPlaying(true)
      setHasStarted(true)
    })
  }, [allLoaded, buildGraph])

  const togglePlayback = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return

    if (isPlaying) {
      offsetRef.current = ctx.currentTime - startTimeRef.current
      ctx.suspend().then(() => setIsPlaying(false))
    } else {
      ctx.resume().then(() => setIsPlaying(true))
    }
  }, [isPlaying])

  const toggleMute = useCallback((id: number) => {
    const gain = gainsRef.current[id]
    if (!gain) return

    setTracks(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        const nextMuted = !t.muted
        gain.gain.setTargetAtTime(nextMuted ? 0 : 1, gain.context.currentTime, 0.05)
        return { ...t, muted: nextMuted }
      })
    )
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sourcesRef.current.forEach(s => {
        try { s?.stop() } catch { /* already stopped */ }
      })
      audioCtxRef.current?.close()
    }
  }, [])

  return {
    tracks,
    allLoaded,
    isPlaying,
    hasStarted,
    analysers: analysersRef.current,
    toggleMute,
    startPlayback,
    togglePlayback,
  }
}
