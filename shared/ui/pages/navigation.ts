import { Page } from '@playwright/test';

/**
 * Waits until the page titled `title` is the one on screen.
 *
 * The store is a single-page app: the URL changes the instant the router runs, while the old
 * page's DOM can stay mounted for a moment longer. Waiting for the URL alone let a step read the
 * 6-row products list while the address bar already said /cart.html. The page's own title is
 * rendered by the new page, so it is proof the new page is the one being read.
 */
export async function waitForPage(page: Page, title: string): Promise<void> {
  await page.getByTestId('title').filter({ hasText: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).waitFor();
}
