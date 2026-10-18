import { defineConfig } from 'allure';

/**
 * Allure Report 3 — TypeScript, no Java runtime needed.
 *
 * Name and history path come from the environment so one config serves all four reports
 * (web, api, k6 and the combined one), each with its own trend line. Allure 3 keeps history in
 * a single append-only `.jsonl` file; CI caches that file between runs to draw the trend.
 *
 * Every npm script passes `--clean`: without it `generate` writes over the previous report and
 * leaves its files behind, and a stale file is served as part of the new report.
 */
export default defineConfig({
  name: process.env.ALLURE_REPORT_NAME || 'QA Validation Engine',
  historyPath: process.env.ALLURE_HISTORY_PATH || undefined,
  plugins: {
    awesome: { options: { reportLanguage: 'en', groupBy: ['parentSuite', 'suite', 'subSuite'] } },
    // Trends live in the dashboard plugin in Allure 3; without it no chart renders at all.
    dashboard: {
      options: {
        layout: [
          { type: 'currentStatus' },
          { type: 'statusDynamics' },
          { type: 'testBaseGrowthDynamics' },
          { type: 'durationDynamics' },
        ],
      },
    },
  },
});
