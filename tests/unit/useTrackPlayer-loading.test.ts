import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTrackPlayer } from '@/hooks/useTrackPlayer'

// Regression tests for the "stuck on Loading…, never plays" bug.
//
// Cause: `el.src = url` ran BEFORE the 'canplay' listener was attached. With a
// warm HTTP cache the element could reach HAVE_ENOUGH_DATA and fire canplay in
// that gap, the event was missed, and `ready` never flipped — so the button
// stayed disabled forever. Intermittent precisely because it depended on cache.

function stubAudio(readyStateAtSrc = 0) {
  const el = document.createElement('audio')
  let readyState = 0
  Object.defineProperty(el, 'readyState', { get: () => readyState, configurable: true })
  // Assigning src simulates the browser resolving instantly from cache.
  const srcSetter = vi.fn(function (this: HTMLAudioElement) {
    readyState = readyStateAtSrc
    if (readyStateAtSrc >= 2) el.dispatchEvent(new Event('canplay'))
  })
  Object.defineProperty(el, 'src', { set: srcSetter, get: () => 'blob:test', configurable: true })
  Object.defineProperty(el, 'load', { value: vi.fn(), configurable: true })
  Object.defineProperty(el, 'pause', { value: vi.fn(), configurable: true })
  // MUST be a `function`, not an arrow: `new Audio()` requires a constructible
  // and an arrow throws "is not a constructor".
  vi.spyOn(window, 'Audio').mockImplementation(function (this: unknown) { return el } as unknown as typeof Audio)
  return el
}

afterEach(() => { vi.restoreAllMocks() })

describe('useTrackPlayer · loading robustness', () => {
  it('becomes ready when the source resolves instantly from cache', async () => {
    // readyState 4 the moment src is assigned: the canplay event fires during
    // the assignment. Listeners must already be attached, or the readyState
    // fallback must catch it.
    stubAudio(4)
    const { result } = renderHook(() => useTrackPlayer('/audio/test.mp3'))
    await waitFor(() => expect(result.current.ready).toBe(true))
  })

  it('does not report buffering before any play attempt', () => {
    stubAudio(0)
    const { result } = renderHook(() => useTrackPlayer('/audio/test.mp3'))
    expect(result.current.buffering).toBe(false)
  })

  it('reports buffering on waiting and clears it on playing', async () => {
    const el = stubAudio(0)
    const { result } = renderHook(() => useTrackPlayer('/audio/test.mp3'))

    act(() => { el.dispatchEvent(new Event('waiting')) })
    await waitFor(() => expect(result.current.buffering).toBe(true))

    act(() => { el.dispatchEvent(new Event('playing')) })
    await waitFor(() => expect(result.current.buffering).toBe(false))
    // 'playing' also proves data arrived.
    expect(result.current.ready).toBe(true)
  })

  it('treats loadeddata as a ready signal, not only canplay', async () => {
    const el = stubAudio(0)
    const { result } = renderHook(() => useTrackPlayer('/audio/test.mp3'))
    expect(result.current.ready).toBe(false)

    act(() => { el.dispatchEvent(new Event('loadeddata')) })
    await waitFor(() => expect(result.current.ready).toBe(true))
  })

  it('does not assign src during the initial render', () => {
    // Withholding `src` is what defers the fetch — assigning it starts a
    // download immediately, even at preload="none". The assignment is queued
    // for the first idle slot after paint, so the track never competes with
    // the hero poster, and there is exactly one request rather than a
    // start-abort-restart sequence.
    const el = stubAudio(0)
    const srcSetter = vi.fn()
    Object.defineProperty(el, 'src', { set: srcSetter, get: () => '', configurable: true })

    renderHook(() => useTrackPlayer('/audio/test.mp3'))

    expect(srcSetter).not.toHaveBeenCalled()
    // preload is 'auto' from the start: it only describes how much to fetch
    // once a source exists, so it costs nothing before src is set.
    expect(el.preload).toBe('auto')
  })
})
