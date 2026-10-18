import { DataTable, createBdd } from 'playwright-bdd';
import { SORT_OPTIONS, SortOrder } from '../pages/inventory.page';
import { expect, test } from '../fixtures/test.fixture';

const { Given, When, Then } = createBdd(test);

Given('I am on the products page', async ({ inventoryPage }) => {
  await inventoryPage.goto();
  await expect(inventoryPage.title).toHaveText('Products');
});

Then('I should see {int} products', async ({ inventoryPage }, count: number) => {
  await expect(inventoryPage.items).toHaveCount(count);
});

Then('every product should show a name and a positive price', async ({ inventoryPage }) => {
  for (const product of await inventoryPage.products()) {
    expect(product.name.trim(), 'product name').not.toBe('');
    expect(product.price, `price of ${product.name}`).toBeGreaterThan(0);
  }
});

Then('every product should show a different image', async ({ inventoryPage }) => {
  const sources = await inventoryPage.imageSources();
  expect(new Set(sources).size, `image sources: ${sources.join(', ')}`).toBe(sources.length);
});

When('I sort the products by {string}', async ({ inventoryPage }, order: string) => {
  if (!(order in SORT_OPTIONS)) throw new Error(`Unknown sort order "${order}". Expected one of: ${Object.keys(SORT_OPTIONS).join(', ')}.`);
  await inventoryPage.sortBy(order as SortOrder);
});

/**
 * Compares the page's order against the same list sorted here, not against a hard-coded list.
 * A new product added to the store then cannot break the test — only a wrong order can.
 */
Then('the products should be in {string} order', async ({ inventoryPage }, order: string) => {
  const products = await inventoryPage.products();
  const [field, direction] = order.split(' ') as ['name' | 'price', 'ascending' | 'descending'];
  const sign = direction === 'ascending' ? 1 : -1;
  const expected = [...products].sort((a, b) =>
    sign * (field === 'name' ? a.name.localeCompare(b.name) : a.price - b.price));
  expect(products.map((p) => p.name)).toEqual(expected.map((p) => p.name));
});

When('I add {string} to the cart', async ({ inventoryPage, scenario }, name: string) => {
  scenario.addedProducts.push(await inventoryPage.addToCart(name));
});

When('I add these products to the cart:', async ({ inventoryPage, scenario }, table: DataTable) => {
  for (const [name] of table.raw()) {
    scenario.addedProducts.push(await inventoryPage.addToCart(name));
  }
});

When('I open the cart', async ({ inventoryPage }) => {
  await inventoryPage.openCart();
});

Then('the cart badge should show {int}', async ({ inventoryPage }, count: number) => {
  await expect(inventoryPage.cartBadge).toHaveText(String(count));
});

Then('the cart badge should not be shown', async ({ inventoryPage }) => {
  await expect(inventoryPage.cartBadge).toHaveCount(0);
});
