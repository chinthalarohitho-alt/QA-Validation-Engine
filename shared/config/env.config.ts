import fs from 'fs';
import path from 'path';
import { config as loadEnvFile } from 'dotenv';

/**
 * The single source of truth for hosts and credentials.
 *
 * Every Node-side suite — Playwright's web and API lanes, and the k6 runner — reaches the
 * environment through this import. k6 itself never imports it (k6 has no `process`); the
 * runner reads it here and forwards each URL to k6 as an `-e` variable instead.
 */
function repoEnvFile(): string | undefined {
  let directory = process.cwd();
  for (let depth = 0; depth < 6; depth++) {
    const candidate = path.join(directory, '.env');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return undefined;
}

const envFile = repoEnvFile();
if (envFile) loadEnvFile({ path: envFile, quiet: true });

/**
 * One block per environment, one URL per product surface.
 *
 * The three targets are deliberately three different public systems — a web store, a REST
 * API and a load-testing sandbox — so the framework proves it can hold several products in
 * one repository the way a real multi-product platform needs. Add a `staging` block with the
 * same keys and `TEST_ENV=staging` points every lane at it with no other change.
 */
export const ENV = {
  demo: {
    /** SauceDemo — the web UI lane. */
    baseAppUrl: 'https://www.saucedemo.com',
    /** DummyJSON — the API lane. */
    apiUrl: 'https://dummyjson.com',
    /** QuickPizza — Grafana's own k6 demo service, built to be load-tested. */
    loadApiUrl: 'https://quickpizza.grafana.com',
  },
} as const;

export type EnvName = keyof typeof ENV;

export const CURRENT_ENV = (process.env.TEST_ENV || 'demo') as EnvName;

if (!(CURRENT_ENV in ENV)) {
  throw new Error(`Unknown TEST_ENV "${CURRENT_ENV}". Expected one of: ${Object.keys(ENV).join(', ')}.`);
}

export const current = ENV[CURRENT_ENV];

/**
 * Credentials. The defaults are the targets' own published demo logins, so a fresh clone runs
 * with no setup; a real project would leave these undefined and fail loudly instead.
 */
export const CREDENTIALS = {
  saucePassword: process.env.SAUCE_PASSWORD || 'secret_sauce',
  apiUsername: process.env.API_USERNAME || 'emilys',
  apiPassword: process.env.API_PASSWORD || 'emilyspass',
  loadApiToken: process.env.K6_API_TOKEN || 'abcdef0123456789',
};
