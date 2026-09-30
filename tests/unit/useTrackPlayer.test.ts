import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTrackPlayer } from '@/hooks/useTrackPlayer'

// ---------------------------------------------------------------------------
// jsdom does not implement HTMLMediaElement.play()/pause() (they throw "Not
// implemented"), nor does it track a real `paused` flag, nor does it have
// AudioContext at all. We stub the minimum surface useTrackPlayer touches.
// ---------------------------------------------------------------------------

/** Per-element paused state, since the real jsdom getter never changes. */
const pausedState = new WeakMap<HTMLMediaElement, boolean>()

/** Elements created via `new Audio()` inside the hook, in creation order. */
let createdEls: HTMLAudioElement[] = []

/** The fake AudioContext constructor installed for the current test. */
let audioContextCtor: ReturnType<typeof vi.fn>
/** Analyser-like objects returned by createAnalyser(), most recent last. */
let createdAnalysers: Record<string, unknown>[] = []

function installFakeAudioContext() {
  createdAnalysers = []
  // Must use `function`, not an arrow, so the mock is constructable when the
  // hook calls `new AudioContext()` (vitest warns and the `new` call throws
  // otherwise, since arrow functions can never be constructors).
  audioContextCtor = vi.fn().mockImplementation(function () {
    return {
      createMediaElementSource: vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() })),
      createAnalyser: vi.fn(() => {
        const analyser = {
          fftSize: 0,
          smoothingTimeConstant: 0,
          connect: vi.fn(),
          getByteFrequencyData: vi.fn(),
        }
        createdAnalysers.push(analyser)
        return analyser
      }),
      destination: {},
      resume: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
    }
  })
  globalThis.AudioContext = audioContextCtor
  // @ts-expect-error - Safari-prefixed alias the hook may also check for
  globalThis.webkitAudioContext = audioContextCtor
}

function uninstallFakeAudioContext() {
  // @ts-expect-error - cleanup of the test double
  delete globalThis.AudioContext
  // @ts-expect-error - cleanup of the test double
  delete globalThis.webkitAudioContext
}

beforeEach(() => {
  createdEls = []

  // Capture every element the hook constructs via `new Audio()`.
  vi.spyOn(window, 'Audio').mockImplementation(function () {
    const el = document.createElement('audio')
    pausedState.set(el, true)
    createdEls.push(el)
    return el as unknown as HTMLAudioElement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  // play() resolves and fires a real 'play' event, like a real browser would.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    pausedState.set(this, false)
    this.dispatchEvent(new Event('play'))
    return Promise.resolve()
  })

  // pause() fires a real 'pause' event.
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    pausedState.set(this, true)
    this.dispatchEvent(new Event('pause'))
  })

  // `paused` is a getter-only accessor in jsdom that never reflects the
  // stubbed play()/pause() above, so back it with our own WeakMap.
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    return pausedState.get(this) ?? true
  })

  installFakeAudioContext()
})

afterEach(() => {
  uninstallFakeAudioContext()
})

describe('useTrackPlayer', () => {
  it('starts with ready=false and flips to true after canplay fires', async () => {
    const { result } = renderHook(() => useTrackPlayer('/track.mp3'))

    expect(result.current.ready).toBe(false)
    const el = createdEls[0]

    act(() => {
      el.dispatchEvent(new Event('canplay'))
    })

    await waitFor(() => expect(result.current.ready).toBe(true))
  })

  it('toggle() plays and flips isPlaying to true when ready', async () => {
    const { result } = renderHook(() => useTrackPlayer('/track.mp3'))
    const el = createdEls[0]
    act(() => el.dispatchEvent(new Event('canplay')))
    await waitFor(() => expect(result.current.ready).toBe(true))

    expect(result.current.isPlaying).toBe(false)

    act(() => {
      result.current.toggle()
    })

    expect(el.play).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(result.current.isPlaying).toBe(true))
  })

  it('a second toggle() pauses and flips isPlaying back to false', async () => {
    const { result } = renderHook(() => useTrackPlayer('/track.mp3'))
    const el = createdEls[0]
    act(() => el.dispatchEvent(new Event('canplay')))
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.toggle())
    await waitFor(() => expect(result.current.isPlaying).toBe(true))

    act(() => {
      result.current.toggle()
    })

    expect(el.pause).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(result.current.isPlaying).toBe(false))
  })

  it('hasStarted becomes true after a successful play()', async () => {
    const { result } = renderHook(() => useTrackPlayer('/track.mp3'))
    const el = createdEls[0]
    act(() => el.dispatchEvent(new Event('canplay')))
    await waitFor(() => expect(result.current.ready).toBe(true))

    expect(result.current.hasStarted).toBe(false)

    act(() => {
      result.current.toggle()
    })

    await waitFor(() => expect(result.current.hasStarted).toBe(true))
  })

  it('an error event sets a non-null error and leaves ready false', async () => {
    const { result } = renderHook(() => useTrackPlayer('/track.mp3'))
    const el = createdEls[0]
    // jsdom's MediaError is null by default; the hook falls back to a
    // default message when el.error is unset.
    act(() => {
      el.dispatchEvent(new Event('error'))
    })

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(typeof result.current.error).toBe('string')
    expect(result.current.ready).toBe(false)
  })

  it('does not claim isPlaying when play() rejects (autoplay blocked)', async () => {
    const { result } = renderHook(() => useTrackPlayer('/track.mp3'))
    const el = createdEls[0]
    act(() => el.dispatchEvent(new Event('canplay')))
    await waitFor(() => expect(result.current.ready).toBe(true))

    // Override play() for this test only: reject instead of resolving, and do
    // NOT dispatch a 'play' event, matching a real autoplay-blocked call.
    ;(el.play as ReturnType<typeof vi.fn>).mockImplementation(() =>
      Promise.reject(new Error('NotAllowedError'))
    )

    act(() => {
      result.current.toggle()
    })

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.hasStarted).toBe(false)
  })

  it('does not construct an AudioContext on mount, only inside the first toggle()', async () => {
    const { result } = renderHook(() => useTrackPlayer('/track.mp3'))
    const el = createdEls[0]
    act(() => el.dispatchEvent(new Event('canplay')))
    await waitFor(() => expect(result.current.ready).toBe(true))

    expect(audioContextCtor).not.toHaveBeenCalled()

    act(() => {
      result.current.toggle()
    })

    expect(audioContextCtor).toHaveBeenCalledTimes(1)
  })

  it('analyser is null before the first toggle and non-null after', async () => {
    const { result } = renderHook(() => useTrackPlayer('/track.mp3'))
    const el = createdEls[0]
    act(() => el.dispatchEvent(new Event('canplay')))
    await waitFor(() => expect(result.current.ready).toBe(true))

    expect(result.current.analyser).toBeNull()

    act(() => {
      result.current.toggle()
    })

    await waitFor(() => expect(result.current.analyser).not.toBeNull())
    expect(createdAnalysers).toHaveLength(1)
  })

  it('still plays audio when AudioContext construction throws, with analyser staying null', async () => {
    audioContextCtor.mockImplementation(() => {
      throw new Error('AudioContext limit reached')
    })

    const { result } = renderHook(() => useTrackPlayer('/track.mp3'))
    const el = createdEls[0]
    act(() => el.dispatchEvent(new Event('canplay')))
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => {
      result.current.toggle()
    })

    expect(el.play).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(result.current.isPlaying).toBe(true))
    expect(result.current.analyser).toBeNull()
  })

  it('pauses the element and closes the AudioContext on unmount', async () => {
    const { result, unmount } = renderHook(() => useTrackPlayer('/track.mp3'))
    const el = createdEls[0]
    act(() => el.dispatchEvent(new Event('canplay')))
    await waitFor(() => expect(result.current.ready).toBe(true))

    act(() => result.current.toggle())
    await waitFor(() => expect(result.current.isPlaying).toBe(true))

    const ctxInstance = audioContextCtor.mock.results[0].value

    unmount()

    expect(el.pause).toHaveBeenCalled()
    expect(ctxInstance.close).toHaveBeenCalledTimes(1)
  })
})
