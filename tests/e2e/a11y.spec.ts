import { test, expect, type Page } from '@playwright/test'

const ROUTES = ['/', '/mixer', '/mixes', '/originals', '/about'] as const

// WCAG AA: 4.5:1 for normal text, 3:1 for large (>=24px, or >=18.66px bold).
const AA_NORMAL = 4.5
const AA_LARGE = 3

async function contrastReport(page: Page) {
  return page.evaluate(
    ({ normal, large }) => {
      const srgb = (c: number) => {
        c /= 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      }
      const lum = (rgb: number[]) => 0.2126 * srgb(rgb[0]) + 0.7152 * srgb(rgb[1]) + 0.0722 * srgb(rgb[2])
      const parse = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number)

      // Walk up for the first opaque background, compositing translucent
      // layers as we go — text over a transparent parent inherits what is
      // behind it, and judging against the element's own background lies.
      const effectiveBg = (el: Element): number[] => {
        let node: Element | null = el
        const stack: number[][] = []
        while (node) {
          const c = parse(getComputedStyle(node).backgroundColor)
          if (c.length >= 3) {
            const a = c.length > 3 ? c[3] : 1
            if (a > 0) {
              stack.push([c[0], c[1], c[2], a])
              if (a === 1) break
            }
          }
          node = node.parentElement
        }
        let base = [18, 4, 31]
        for (let i = stack.length - 1; i >= 0; i--) {
          const [r, g, b, a] = stack[i]
          base = [0, 1, 2].map(j => [r, g, b][j] * a + base[j] * (1 - a))
        }
        return base
      }

      const failures: { text: string; ratio: number; needed: number; selector: string }[] = []
      const unverifiable: string[] = []

      // True when the nearest painted ancestor uses a background-image
      // (gradient or bitmap). Its effective colour can't be read from
      // computed styles, so any ratio we compute would be fiction.
      const paintedByImage = (el: Element): boolean => {
        let node: Element | null = el
        while (node) {
          const cs = getComputedStyle(node)
          if (cs.backgroundImage && cs.backgroundImage !== 'none') return true
          const c = parse(cs.backgroundColor)
          if (c.length >= 3 && (c.length > 3 ? c[3] : 1) === 1) return false
          node = node.parentElement
        }
        return false
      }
      const els = Array.from(document.querySelectorAll<HTMLElement>('a, button, p, h1, h2, h3, span, li'))

      for (const el of els) {
        const text = (el.textContent ?? '').trim()
        if (!text) continue
        // Only leaf-ish nodes, so we don't score a wrapper by its child's text.
        if (el.children.length > 0 && Array.from(el.childNodes).every(n => n.nodeType !== Node.TEXT_NODE)) continue
        const cs = getComputedStyle(el)
        if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) continue
        // Skip visually-hidden helpers.
        if (r.width <= 1 && r.height <= 1) continue

        const fg = parse(cs.color)
        if (fg.length < 3) continue
        if (paintedByImage(el)) {
          unverifiable.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0])
          continue
        }
        const alpha = fg.length > 3 ? fg[3] : 1
        if (alpha === 0) continue
        const bg = effectiveBg(el)
        const composited = [0, 1, 2].map(i => fg[i] * alpha + bg[i] * (1 - alpha))

        const L1 = lum(composited)
        const L2 = lum(bg)
        const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1]
        const ratio = (hi + 0.05) / (lo + 0.05)

        const px = parseFloat(cs.fontSize)
        const bold = parseInt(cs.fontWeight, 10) >= 700
        const needed = px >= 24 || (px >= 18.66 && bold) ? large : normal
        if (ratio < needed) {
          failures.push({
            text: text.slice(0, 40),
            ratio: Math.round(ratio * 100) / 100,
            needed,
            selector: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0],
          })
        }
      }
      return { failures, unverifiable }
    },
    { normal: AA_NORMAL, large: AA_LARGE },
  )
}

for (const route of ROUTES) {
  test.describe(`a11y · ${route}`, () => {
    test('text meets WCAG AA contrast', async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('load')
      await page.waitForTimeout(1500)
      const { failures, unverifiable } = await contrastReport(page)
      // Surfaced, not swallowed: these sit on gradient/image backgrounds whose
      // effective colour can't be read from computed styles. They are checked
      // by eye and by their token values instead.
      if (unverifiable.length) {
        // eslint-disable-next-line no-console
        console.log(`  [contrast] ${unverifiable.length} element(s) on image/gradient backgrounds not machine-checkable: ${[...new Set(unverifiable)].join(', ')}`)
      }
      expect(failures, `contrast failures on ${route}: ${JSON.stringify(failures, null, 2)}`).toEqual([])
    })

    test('has exactly one h1 and no skipped heading levels', async ({ page }) => {
      await page.goto(route)
      const levels = await page.evaluate(() =>
        Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => Number(h.tagName[1])),
      )
      expect(levels.filter(l => l === 1)).toHaveLength(1)
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i] - levels[i - 1], `heading jump at index ${i}: ${levels.join(',')}`).toBeLessThanOrEqual(1)
      }
    })

    test('every interactive element is reachable and shows a focus ring', async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('load')
      await page.waitForTimeout(1200)

      const noRing: string[] = []
      for (let i = 0; i < 25; i++) {
        await page.keyboard.press('Tab')
        const info = await page.evaluate(() => {
          const a = document.activeElement as HTMLElement | null
          if (!a || a === document.body) return null
          const cs = getComputedStyle(a)
          const ring = cs.boxShadow !== 'none' || (cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px')
          return { tag: a.tagName.toLowerCase(), cls: String(a.className).split(' ')[0], ring }
        })
        if (info && !info.ring) noRing.push(`${info.tag}.${info.cls}`)
      }
      expect(noRing, `focusable elements without a visible focus indicator: ${noRing.join(', ')}`).toEqual([])
    })

    test('no horizontal overflow at 390px', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(route)
      await page.waitForLoadState('load')
      await page.waitForTimeout(1500)
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }))
      expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.client + 1)
    })

    test('interactive targets are at least 44px', async ({ page }) => {
      await page.goto(route)
      await page.waitForLoadState('load')
      await page.waitForTimeout(1200)
      const small = await page.evaluate(() => {
        // WCAG 2.5.8 exempts targets "in a sentence or block of text" — an
        // inline link inside a paragraph is allowed to be line-height tall,
        // and padding it to 44px would wreck the reading rhythm. Everything
        // that stands alone as a control still has to meet the minimum.
        const inlineInProse = (el: HTMLElement) => {
          const parent = el.parentElement
          if (!parent) return false
          if (getComputedStyle(el).display !== 'inline') return false
          if (!/^(P|LI|SPAN|EM|STRONG|TD|DD|BLOCKQUOTE|H[1-6])$/.test(parent.tagName)) return false
          // Only a genuine exception when there is other text around it.
          const own = (el.textContent ?? '').trim().length
          const all = (parent.textContent ?? '').trim().length
          return all > own
        }

        return Array.from(document.querySelectorAll<HTMLElement>('a[href], button'))
          .filter(el => {
            const r = el.getBoundingClientRect()
            if (r.width === 0 || r.height === 0) return false
            // The skip link is parked off-screen until focused.
            if (el.classList.contains('skip-link')) return false
            if (inlineInProse(el)) return false
            return r.height < 44
          })
          .map(el => `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}`)
      })
      expect(small, `targets under 44px: ${small.join(', ')}`).toEqual([])
    })
  })
}
