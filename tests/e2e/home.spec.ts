import { test, expect, type Page } from '@playwright/test'

// The video is mounted only after window.load and then requestIdleCallback, so
// every video assertion has to wait for it rather than assume it is there.
async function waitForHeroVideo(page: Page) {
  await page.waitForLoadState('load')
  await page.waitForSelector('video', { timeout: 20_000 })
  await expect
    .poll(async () => page.evaluate(() => document.querySelector('video')?.readyState ?? 0), {
      timeout: 20_000,
    })
    .toBeGreaterThanOrEqual(2)
}

test.describe('home', () => {
  test('loads with no console errors or failed requests', async ({ page }) => {
    const errors: string[] = []
    const failed: string[] = []
    page.on('console', m => m.type() === 'error' && errors.push(m.text()))
    page.on('requestfailed', r => failed.push(`${r.url()} ${r.failure()?.errorText ?? ''}`))

    await page.goto('/')
    await waitForHeroVideo(page)

    expect(errors).toEqual([])
    expect(failed).toEqual([])
  })

  test('has exactly one h1', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveCount(1)
  })

  test('hero and landing share one audio transport', async ({ page }) => {
    // The contract: pressing the hero CTA must leave the landing's play button
    // showing the same state. Two independent players would not.
    await page.goto('/')
    await waitForHeroVideo(page)

    const heroButton = page.locator('.hero-enter')
    const landingButton = page.locator('.play-btn')

    await expect(heroButton).toBeEnabled({ timeout: 20_000 })
    await expect(landingButton).toHaveAttribute('aria-pressed', 'false')

    await heroButton.click()

    await expect(landingButton).toHaveAttribute('aria-pressed', 'true')
    await expect(heroButton).toContainText(/playing/i)
  })

  test('landing play button also drives the shared transport', async ({ page }) => {
    await page.goto('/')
    await waitForHeroVideo(page)

    const heroButton = page.locator('.hero-enter')
    const landingButton = page.locator('.play-btn')
    await expect(landingButton).toBeEnabled({ timeout: 20_000 })

    await landingButton.click()

    await expect(heroButton).toContainText(/playing/i)
    await expect(landingButton).toHaveAttribute('aria-pressed', 'true')
  })

  test('every outbound link is https, absolute, and opens safely', async ({ page }) => {
    await page.goto('/')
    const links = page.locator('.linkrow')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const link = links.nth(i)
      const href = await link.getAttribute('href')
      expect(href, `link ${i} href`).toMatch(/^https:\/\//)
      expect(await link.getAttribute('target')).toBe('_blank')
      const rel = (await link.getAttribute('rel')) ?? ''
      expect(rel).toContain('noreferrer')
      expect(rel).toContain('noopener')
    }
  })

  test('link hover does not animate a layout property', async ({ page }) => {
    // Regression guard: transitioning padding-left relayouts the row every
    // frame and was the cause of reported hover lag.
    await page.goto('/')
    const transition = await page
      .locator('.linkrow')
      .first()
      .evaluate(el => getComputedStyle(el).transitionProperty)

    for (const layoutProp of ['padding', 'padding-left', 'width', 'margin', 'margin-left', 'top', 'left']) {
      expect(transition).not.toContain(layoutProp)
    }
  })

  test('mixer doorway navigates to /mixer', async ({ page }) => {
    await page.goto('/')
    await page.locator('.landing-mixer-cta').click()
    await expect(page).toHaveURL(/\/mixer$/)
  })
})

test.describe('home · motion preferences', () => {
  test.use({ reducedMotion: 'reduce' })

  test('creates no video element and still shows the poster', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('load')
    // Give the idle callback more than enough time to have fired.
    await page.waitForTimeout(3_000)

    await expect(page.locator('video')).toHaveCount(0)
    await expect(page.locator('picture img').first()).toBeVisible()
    // The pause control only exists to pause motion; with no motion there is
    // nothing to pause.
    await expect(page.getByRole('button', { name: /motion/i })).toHaveCount(0)
  })
})
