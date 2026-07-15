// @ts-check
const { defineConfig, devices } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev --prefix client',
      port: 5173,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev --prefix server',
      port: 3000,
      reuseExistingServer: true,
    },
  ],
})
