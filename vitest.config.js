import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Exclude Playwright E2E tests from unit test runs
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/two-player*.spec.js',
      '**/tests/visual.spec.js',
      '**/tests/test-scenario-1.spec.js'
    ],
    globals: true,
    environment: 'node'
  }
})
