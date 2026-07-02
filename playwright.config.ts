import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env.PLEBEIAN_URL || 'https://plebeian.market'

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: './reports/html', open: 'never' }],
    ['json', { outputFile: './reports/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'on',
    actionTimeout: 15_000,
    ignoreHTTPSErrors: true,
    launchOptions: {
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    },
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
        recordVideo: { dir: './videos', size: { width: 1280, height: 900 } },
      },
    },
  ],
})
