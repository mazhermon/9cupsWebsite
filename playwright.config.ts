import { defineConfig, devices } from '@playwright/test'

// E2E runs against a PRODUCTION build on purpose. `next dev` carries Turbopack
// and React dev-mode overhead that makes timing-sensitive assertions flaky and
// perf numbers meaningless — see docs/STATE.md.
const PORT = 3100
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    {
      // Chromium at an iPhone viewport rather than devices['iPhone 13'], which
      // defaults to WebKit. What these specs actually assert is responsive
      // layout, touch-target size and the portrait video swap — all of which
      // Chromium exercises, and it keeps CI to a single browser download.
      // NOTE: this means no real Safari coverage. The HEVC video path and
      // Safari's audio quirks are therefore NOT covered by CI.
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    // CI builds once in the `check` job and hands .next to this job, so
    // rebuilding here would double the pipeline's wall clock.
    command: process.env.PLAYWRIGHT_SKIP_BUILD
      ? `npx next start -p ${PORT}`
      : `npx next build && npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
