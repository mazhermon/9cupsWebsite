import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // Playwright specs live in tests/e2e and are run by Playwright, not Vitest.
    include: ['tests/unit/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
