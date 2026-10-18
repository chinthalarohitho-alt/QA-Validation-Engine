import { createBdd } from 'playwright-bdd';
import { assertJsonSchema } from '../schema.validator';
import { productSchema } from '../schemas/product.schema';
import { expect, test } from '../fixtures/api.fixture';

const { Then } = createBdd(test);

type ProductRow = Record<string, any>;

const naturalOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

const productsOf = (body: any): ProductRow[] => body?.products ?? [];

Then('the response should contain {int} products', async ({ scenario }, count: number) => {
  expect(productsOf(scenario.response.json)).toHaveLength(count);
});

Then('every listed product should match the product schema', async ({ scenario }) => {
  productsOf(scenario.response.json).forEach((product, i) => assertJsonSchema(product, productSchema, `products[${i}]`));
});

Then('every product should mention {string} in its title or description', async ({ scenario }, term: string) => {
  const products = productsOf(scenario.response.json);
  expect(products.length, 'search returned nothing, so it proved nothing').toBeGreaterThan(0);
  for (const { id, title, description } of products) {
    expect(`${title} ${description}`.toLowerCase(), `product ${id}`).toContain(term.toLowerCase());
  }
});

Then('every product should carry only the fields {string}', async ({ scenario }, fields: string) => {
  // `id` is always returned, whatever `select` asks for.
  const expected = ['id', ...fields.split(',').map((f) => f.trim())].sort();
  for (const product of productsOf(scenario.response.json)) {
    expect(Object.keys(product).sort()).toEqual(expected);
  }
});

Then('the products should be sorted by {word} {word}', async ({ scenario }, field: string, order: string) => {
  const values = productsOf(scenario.response.json).map((p) => p[field]);
  // The server sorts text naturally and case-insensitively — "Galaxy S7" before "Galaxy S10",
  // "iPhone" beside "IWC". A plain string sort would fail a correct server.
  const sorted = [...values].sort((a, b) => (typeof a === 'number' ? a - b : naturalOrder.compare(a, b)));
  expect(values).toEqual(order === 'desc' ? sorted.reverse() : sorted);
});

Then('the products should be ids {int} to {int}', async ({ scenario }, first: number, last: number) => {
  const ids = productsOf(scenario.response.json).map((p) => p.id);
  expect(ids).toEqual(Array.from({ length: last - first + 1 }, (_, i) => first + i));
});
