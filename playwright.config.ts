import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
});