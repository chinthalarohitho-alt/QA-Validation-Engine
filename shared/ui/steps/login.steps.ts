import { createBdd } from 'playwright-bdd';
import { CREDENTIALS } from '../../config/env.config';
import { expect, test } from '../fixtures/test.fixture';

const { Given, When, Then } = createBdd(test);

Given('I am on the login page', async ({ loginPage }) => {
  await loginPage.goto();
});

When('I sign in as {string}', async ({ loginPage }, username: string) => {
  await loginPage.signIn(username, CREDENTIALS.saucePassword);
});

When('I sign in as {string} with password {string}', async ({ loginPage }, username: string, password: string) => {
  await loginPage.signIn(username, password);
});

When('I open {string} without signing in', async ({ page }, path: string) => {
  await page.goto(path);
});

Then('I should land on the products page', async ({ inventoryPage }) => {
  await expect(inventoryPage.title).toHaveText('Products');
});

Then('I should land on the products page within {int} ms', async ({ page, inventoryPage }, budget: number) => {
  // Measured from the click that submitted the form to the products title being visible.
  const started = Date.now();
  await page.waitForURL('**/inventory.html', { timeout: budget + 10_000 });
  await expect(inventoryPage.title).toBeVisible();
  const elapsed = Date.now() - started;
  expect(elapsed, `products page took ${elapsed} ms, budget is ${budget} ms`).toBeLessThanOrEqual(budget);
});

Then('I should see the login error {string}', async ({ loginPage }, message: string) => {
  await expect(loginPage.error).toHaveText(message);
});

Then('I should still be on the login page', async ({ page, loginPage }) => {
  await expect(page).toHaveURL(/saucedemo\.com\/?$/);
  await expect(loginPage.submit).toBeVisible();
});
