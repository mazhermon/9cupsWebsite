import { describe, it, expect, afterEach, vi } from 'vitest'

// The gate decides whether a local-only surface exists at all, so its default
// matters more than its happy path: an unset variable must mean "off".
const original = process.env.NINECUPS_PRIVATE

afterEach(() => {
  if (original === undefined) delete process.env.NINECUPS_PRIVATE
  else process.env.NINECUPS_PRIVATE = original
  vi.resetModules()
})

async function gate() {
  vi.resetModules()
  return (await import('@/lib/private-gate')).isPrivateEnabled()
}

describe('isPrivateEnabled', () => {
  it('is off when the variable is unset — the state the live site is in', async () => {
    delete process.env.NINECUPS_PRIVATE
    expect(await gate()).toBe(false)
  })

  it('is on only for exactly "1"', async () => {
    process.env.NINECUPS_PRIVATE = '1'
    expect(await gate()).toBe(true)
  })

  for (const value of ['0', 'true', 'TRUE', 'yes', '', ' 1', '1 ']) {
    it(`is off for ${JSON.stringify(value)}`, async () => {
      process.env.NINECUPS_PRIVATE = value
      expect(await gate()).toBe(false)
    })
  }
})
