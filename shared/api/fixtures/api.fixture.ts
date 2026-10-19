import { request } from '@playwright/test';
import { test as base } from 'playwright-bdd';
import { current } from '../../config/env.config';
import { mintToken } from '../auth.helper';
import { ApiClient, ApiResponse } from '../request.client';

/** What one scenario remembers between its steps. */
export class ApiScenario {
  private latest?: ApiResponse;
  /** Values a step saved for a later one, e.g. the lines a cart was created with. */
  readonly saved = new Map<string, unknown>();

  record(response: ApiResponse): void {
    this.latest = response;
  }

  /** The last response. Fails with a stated reason when a `Then` runs before any `When`. */
  get response(): ApiResponse {
    if (!this.latest) throw new Error('No request has been sent in this scenario yet.');
    return this.latest;
  }
}

type WorkerFixtures = { apiToken: () => Promise<string> };
type TestFixtures = { api: ApiClient; scenario: ApiScenario };

export const test = base.extend<TestFixtures, WorkerFixtures>({
  /**
   * One token per worker, minted on first use in a throwaway context — see `api` below for why.
   *
   * Lazy: the sign-in runs only when a scenario first presents a token, so the scenarios that
   * test sign-in itself, or the route guard without a token, do not depend on it.
   */
  apiToken: [async ({}, use) => {
    let minted: Promise<string> | undefined;
    await use(() => (minted ??= (async () => {
      const context = await request.newContext({ baseURL: current.apiUrl, timeout: 30_000 });
      try {
        return await mintToken(context);
      } finally {
        await context.dispose();
      }
    })()));
  }, { scope: 'worker' }],

  /**
   * A fresh connection per scenario, carrying the worker's token only when a step asks for it.
   *
   * Per scenario, not per worker, because `/auth/login` also sets an `accessToken` COOKIE. A
   * shared context keeps that cookie in its jar and sends it on every later request, so a
   * "no-token" scenario is silently authenticated by the cookie and the route guard appears to
   * be broken. A context per scenario gives each one an empty cookie jar.
   *
   * Nothing in the API lane asks for `page`, so Playwright never launches a browser here.
   */
  api: async ({ apiToken }, use) => {
    const context = await request.newContext({ baseURL: current.apiUrl, timeout: 30_000 });
    await use(new ApiClient(context, apiToken));
    await context.dispose();
  },

  scenario: async ({}, use) => {
    await use(new ApiScenario());
  },
});

export { expect } from '@playwright/test';
