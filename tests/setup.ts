import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// jsdom implements neither matchMedia nor the Web Audio API. Components here
// read both on mount, so provide the minimum surface they touch.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

if (!('requestIdleCallback' in window)) {
  Object.defineProperty(window, 'requestIdleCallback', {
    writable: true,
    value: (cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 }), 0),
  })
  Object.defineProperty(window, 'cancelIdleCallback', {
    writable: true,
    value: (id: number) => window.clearTimeout(id),
  })
}
