import { test, expect } from '@playwright/test'

test.describe('stems', () => {
  test('the old /mixer URL still resolves', async ({ page }) => {
    // /mixer was public before the rename, so it redirects rather than 404s.
    await page.goto('/mixer')
    await expect(page).toHaveURL(/\/stems$/)
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('loads with no console errors or failed requests', async ({ page }) => {
    const errors: string[] = []
    const failed: string[] = []
    page.on('console', m => m.type() === 'error' && errors.push(m.text()))
    page.on('requestfailed', r => failed.push(`${r.url()} ${r.failure()?.errorText ?? ''}`))

    await page.goto('/stems')
    await page.waitForLoadState('load')

    expect(errors).toEqual([])
    expect(failed).toEqual([])
  })

  test('has exactly one h1', async ({ page }) => {
    await page.goto('/stems')
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('shows four stem toggles, enabled once stems load', async ({ page }) => {
    await page.goto('/stems')
    const stamps = page.locator('.stem-stamp')
    await expect(stamps).toHaveCount(4)
    // 4.4MB of stems must download and decode before these enable.
    await expect(stamps.first()).toBeEnabled({ timeout: 60_000 })
  })

  test('press-play starts the stem player and reveals the transport', async ({ page }) => {
    await page.goto('/stems')
    const press = page.locator('.cta-press-play')
    await expect(press).toBeEnabled({ timeout: 60_000 })
    await press.click()
    await expect(page.locator('.play-btn')).toBeVisible()
  })

  test('listen row links are https and open safely', async ({ page }) => {
    await page.goto('/stems')
    const pills = page.locator('.listen-pill')
    const count = await pills.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      expect(await pills.nth(i).getAttribute('href')).toMatch(/^https:\/\//)
      const rel = (await pills.nth(i).getAttribute('rel')) ?? ''
      expect(rel).toContain('noopener')
    }
  })
})
