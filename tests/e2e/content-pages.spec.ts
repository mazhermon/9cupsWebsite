import { test, expect } from '@playwright/test'

const PAGES = [
  { route: '/mixes', title: 'Mixes' },
  { route: '/originals', title: 'Originals' },
  { route: '/about', title: 'Beat maker & DJ' },
] as const

test.describe('content pages', () => {
  for (const { route, title } of PAGES) {
    test(`${route} loads cleanly with one h1`, async ({ page }) => {
      const errors: string[] = []
      const failed: string[] = []
      page.on('console', m => m.type() === 'error' && errors.push(m.text()))
      page.on('requestfailed', r => failed.push(`${r.url()} ${r.failure()?.errorText ?? ''}`))

      await page.goto(route)
      await page.waitForLoadState('load')

      await expect(page.locator('h1')).toHaveCount(1)
      await expect(page.locator('h1')).toHaveText(title)
      expect(errors).toEqual([])
      expect(failed).toEqual([])
    })
  }

  test('list pages contact no third party before a player is asked for', async ({ page }) => {
    // The whole point of the facade: no SoundCloud/Bandcamp/Mixcloud request
    // until a visitor presses something.
    const thirdParty: string[] = []
    page.on('request', r => {
      const u = r.url()
      if (/soundcloud|bandcamp|mixcloud/i.test(u)) thirdParty.push(u)
    })
    await page.goto('/mixes')
    await page.waitForLoadState('load')
    await page.waitForTimeout(1500)
    expect(thirdParty, `third-party requests before interaction: ${thirdParty.join(', ')}`).toEqual([])
  })

  test('about page never renders a dead press-pack link', async ({ page }) => {
    await page.goto('/about')
    const link = page.locator('.about-download')
    if (await link.count()) {
      const href = await link.getAttribute('href')
      expect(href).toMatch(/^https?:\/\//)
    }
  })

  test('about page exposes a working contact route', async ({ page }) => {
    await page.goto('/about')
    const mailto = page.locator('a[href^="mailto:"]')
    await expect(mailto.first()).toBeVisible()
    expect(await mailto.first().getAttribute('href')).toContain('@')
  })
})
