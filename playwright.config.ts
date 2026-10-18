import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { CURRENT_ENV, current } from './shared/config/env.config';

/**
 * Two BDD lanes, generated separately.
 *
 * The UI lane's fixtures open a browser and pick a persona; the API lane must never launch a
 * browser. Separate `defineBddConfig` calls keep each lane's steps and fixtures out of the
 * other's generated specs, so their `outputDir`s must differ.
 */
const uiTestDir = defineBddConfig({
  features: './projects/**/ui/**/*.feature',
  // The fixtures file is listed here, not only imported by the steps: playwright-bdd resolves
  // the custom `test` only from files its step loader actually loaded.
  steps: ['./shared/ui/steps/**/*.steps.ts', './shared/ui/fixtures/*.fixture.ts'],
  outputDir: '.features-gen/ui',
});

const apiTestDir = defineBddConfig({
  features: './projects/**/api/**/*.feature',
  steps: ['./shared/api/steps/**/*.steps.ts', './shared/api/fixtures/*.fixture.ts'],
  outputDir: '.features-gen/api',
});

export default defineConfig({
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: './shared/config/auth.setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.PW_RETRIES ? Number(process.env.PW_RETRIES) : process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    // CI shards write blob reports so the merge job can rebuild one HTML report from all of them.
    ...(process.env.CI ? [['blob'] as ['blob']] : []),
    ['allure-playwright', {
      // Per lane: the `test:api*` scripts point this at allure-results/api.
      resultsDir: process.env.ALLURE_RESULTS_DIR || 'allure-results/web',
      suiteTitle: true,
      environmentInfo: { ENV: CURRENT_ENV, NODE: process.version },
      categories: [
        { name: 'Known defects (expected to fail)', messageRegex: '.*Expected to fail, but passed.*', matchedStatuses: ['failed'] },
        { name: 'Assertion failures', messageRegex: '.*expect\\(.*', matchedStatuses: ['failed'] },
        { name: 'Timeouts', messageRegex: '.*(Timeout|timed out).*', matchedStatuses: ['failed', 'broken'] },
      ],
    }],
  ],

  use: {
    baseURL: current.baseAppUrl,
    // SauceDemo marks its elements with `data-test`, so getByTestId reads that attribute.
    testIdAttribute: 'data-test',
    // Recorded for every test, kept only for a first failure — the one worth debugging.
    trace: 'retain-on-first-failure',
    screenshot: 'only-on-failure',
    headless: true,
  },

  projects: [
    {
      name: 'web',
      testDir: uiTestDir,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      /**
       * No step here asks for `page`, so Playwright never launches a browser for this project.
       * Retries are off: an API scenario that fails once has told you what you need to know,
       * and a retry against a write endpoint would create a second record.
       */
      name: 'api',
      testDir: apiTestDir,
      retries: 0,
      use: { baseURL: current.apiUrl, trace: 'off' },
    },
  ],
});
