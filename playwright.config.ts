import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testDir: './e2e/chromium',
      testMatch: ['popup.spec.ts', 'options.spec.ts', 'content-script.spec.ts'],
      use: {...devices['Desktop Chrome']},
    },
    {
      name: 'chromium-tigrmail',
      testDir: './e2e/chromium',
      testMatch: ['tigrmail.spec.ts'],
      use: {...devices['Desktop Chrome']},
      timeout: 120000,
    },
    {
      name: 'chromium-gmail',
      testDir: './e2e/chromium',
      testMatch: ['gmail.spec.ts'],
      use: {...devices['Desktop Chrome']},
      timeout: 120000,
    },
    {
      name: 'chromium-nightly',
      testDir: './e2e/chromium',
      testMatch: ['nightly-*.spec.ts'],
      use: {...devices['Desktop Chrome']},
      timeout: 180000,
    },
  ],
});
