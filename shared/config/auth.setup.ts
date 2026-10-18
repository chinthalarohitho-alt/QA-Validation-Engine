import fs from 'fs';
import path from 'path';
import { chromium, FullConfig } from '@playwright/test';
import { CREDENTIALS, current } from './env.config';
import { ROLES, RoleName, stateFileFor } from './roles.config';

/** A saved state is reused only while its session has at least this long left to live. */
const MIN_REMAINING_MS = 5 * 60 * 1000;

/**
 * Whether a saved state's session cookie outlives the run about to start.
 *
 * Judged by the cookie's own expiry, not the file's age: SauceDemo's session lasts ~10 minutes,
 * so a state that was "only 15 minutes old" had already expired, and every scenario then failed
 * on the products page as if the store were broken.
 */
function isFresh(file: string): boolean {
  if (!fs.existsSync(file)) return false;
  const { cookies } = JSON.parse(fs.readFileSync(file, 'utf8')) as { cookies: { expires: number }[] };
  const session = cookies.filter((c) => c.expires > 0);
  return session.length > 0 && session.every((c) => c.expires * 1000 - Date.now() > MIN_REMAINING_MS);
}

/**
 * Signs every persona in once, before any worker starts, and saves its storage state.
 *
 * One sign-in per persona per run, not per scenario: a scenario then starts already on the
 * page it tests, which is both faster and means a login regression fails the login feature
 * instead of every scenario in the repository at once.
 *
 * The API lane sets PW_SKIP_AUTH_SETUP=1 — it never opens a browser, so it never needs this.
 */
export default async function globalSetup(_config: FullConfig): Promise<void> {
  if (process.env.PW_SKIP_AUTH_SETUP === '1') return;

  const browser = await chromium.launch();
  try {
    for (const [role, username] of Object.entries(ROLES) as [Exclude<RoleName, 'anonymous'>, string][]) {
      const file = stateFileFor(role) as string;
      if (isFresh(file)) continue;

      const context = await browser.newContext({ baseURL: current.baseAppUrl });
      const page = await context.newPage();

      await page.goto('/');
      await page.locator('[data-test="username"]').fill(username);
      await page.locator('[data-test="password"]').fill(CREDENTIALS.saucePassword);
      await page.locator('[data-test="login-button"]').click();
      // performance_glitch_user is slow by design; give it room rather than flake.
      await page.waitForURL('**/inventory.html', { timeout: 30_000 });

      fs.mkdirSync(path.dirname(file), { recursive: true });
      await context.storageState({ path: file });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}
