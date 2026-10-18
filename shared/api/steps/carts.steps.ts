import { DataTable, createBdd } from 'playwright-bdd';
import { sumCents, toCents } from '../../money.helper';
import { CartLineRequest, newCartBody } from '../payloads/cart.payloads';
import { expect, test } from '../fixtures/api.fixture';

const { When, Then } = createBdd(test);

interface CartLine { id: number; price: number; quantity: number; total: number; discountedTotal?: number }

const linesOf = (body: any): CartLine[] => body?.products ?? [];

When('I create a cart for user {int} with:', async ({ api, scenario }, userId: number, table: DataTable) => {
  const lines: CartLineRequest[] = table.hashes().map((row) => ({ id: Number(row.product), quantity: Number(row.quantity) }));
  scenario.saved.set('requestedLines', lines);
  scenario.record(await api.send('POST', '/carts/add', 'authorized', newCartBody(userId, lines)));
});

// Each money rule is its own step so a failure names the rule — line, total, or discount.

Then('every cart line total should equal price times quantity', async ({ scenario }) => {
  for (const line of linesOf(scenario.response.json)) {
    expect(toCents(line.total), `line for product ${line.id}`).toBe(toCents(line.price * line.quantity));
  }
});

Then('the cart total should equal the sum of its line totals', async ({ scenario }) => {
  const cart = scenario.response.json;
  expect(toCents(cart.total)).toBe(sumCents(linesOf(cart).map((l) => l.total)));
});

Then('the cart counts should match its lines', async ({ scenario }) => {
  const cart = scenario.response.json;
  const lines = linesOf(cart);
  expect(cart.totalProducts, 'totalProducts').toBe(lines.length);
  expect(cart.totalQuantity, 'totalQuantity').toBe(lines.reduce((sum, l) => sum + l.quantity, 0));
});

Then('the discounted total should not exceed the total', async ({ scenario }) => {
  const cart = scenario.response.json;
  expect(toCents(cart.discountedTotal)).toBeLessThanOrEqual(toCents(cart.total));
});

Then('the cart should hold exactly the quantities I asked for', async ({ scenario }) => {
  const requested = scenario.saved.get('requestedLines') as CartLineRequest[];
  const actual = linesOf(scenario.response.json).map(({ id, quantity }) => ({ id, quantity }));
  expect(actual).toEqual(requested);
});
