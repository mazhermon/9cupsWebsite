import { test, expect } from '@playwright/test'

const ROUTES = ['/', '/mixes', '/originals', '/stems', '/about'] as const
const LABELS = ['Home', 'Mixes', 'Originals', 'Stems', 'About']

test.describe('navigation', () => {
  for (const route of ROUTES) {
    test(`is present and marks the current page on ${route}`, async ({ page }) => {
      await page.goto(route)
      const links = page.locator('.nav-link')
      await expect(links).toHaveCount(LABELS.length)
      await expect(links).toHaveText(LABELS)

      // Exactly one link claims to be the current page.
      await expect(page.locator('.nav-link[aria-current="page"]')).toHaveCount(1)
    })
  }

  test('every nav destination actually resolves', async ({ page }) => {
    for (const [i, route] of ROUTES.entries()) {
      await page.goto('/')
      // On narrow viewports the links live inside a collapsed panel.
      const toggle = page.locator('.nav-toggle')
      if (await toggle.isVisible()) await toggle.click()
      await page.locator('.nav-link').nth(i).click()
      await expect(page).toHaveURL(new RegExp(`${route === '/' ? '/$' : route + '$'}`))
    }
  })

  test('brand mark returns home', async ({ page }) => {
    await page.goto('/about')
    await page.locator('.nav-brand').click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('stays transparent over the hero and gains a scrim on scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await page.waitForTimeout(600)
    // The nav must not dim the hero before anyone scrolls.
    await expect(page.locator('.nav')).toHaveAttribute('data-solid', 'false')

    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(500)
    await expect(page.locator('.nav')).toHaveAttribute('data-solid', 'true')
  })

  test('carries its scrim from the start on pages without a hero', async ({ page }) => {
    await page.goto('/about')
    await expect(page.locator('.nav')).toHaveAttribute('data-solid', 'true')
  })
})

test.describe('private surfaces', () => {
  test('/todo is never linked from a public page', async ({ page }) => {
    // The route is gated by NINECUPS_PRIVATE, which lives in gitignored
    // .env.local and so is absent on the deployed build. Belt and braces: it
    // must also never be advertised. (The 404 itself can't be asserted here —
    // Playwright's server loads .env.local like any local run.)
    for (const route of ROUTES) {
      await page.goto(route)
      await expect(page.locator('a[href^="/todo"]')).toHaveCount(0)
    }
  })
})

test.describe('navigation · narrow screens', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('menu opens, navigates, and closes on Escape', async ({ page }) => {
    await page.goto('/')
    const toggle = page.locator('.nav-toggle')
    const nav = page.locator('.nav')

    await expect(toggle).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(nav).toHaveAttribute('data-open', 'true')

    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  test('closes itself after navigating', async ({ page }) => {
    // Without this the panel sits open over whatever page you landed on.
    await page.goto('/')
    await page.locator('.nav-toggle').click()
    await page.locator('.nav-link', { hasText: 'About' }).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.locator('.nav')).toHaveAttribute('data-open', 'false')
  })
})
