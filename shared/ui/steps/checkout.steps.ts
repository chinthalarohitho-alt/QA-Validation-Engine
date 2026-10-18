import { createBdd } from 'playwright-bdd';
import { buildCustomer, Customer } from '../../factories/customer.factory';
import { expectedTaxCents, sumCents, toCents } from '../../money.helper';
import { expect, test } from '../fixtures/test.fixture';

const { When, Then } = createBdd(test);

When('I enter valid customer details', async ({ checkoutPage }) => {
  await checkoutPage.enterCustomer(buildCustomer());
});

/** Feature files say "blank" for an empty field, so the intent is visible in the table. */
When('I enter customer details with {word} left blank', async ({ checkoutPage }, field: string) => {
  if (!['firstName', 'lastName', 'postalCode'].includes(field)) throw new Error(`Unknown checkout field "${field}".`);
  await checkoutPage.enterCustomer(buildCustomer({ [field as keyof Customer]: '' }));
});

Then('I should see the checkout error {string}', async ({ checkoutPage }, message: string) => {
  await expect(checkoutPage.error).toHaveText(message);
});

// The three money checks are separate steps on purpose: when one fails, the report names the
// rule that broke — subtotal, tax or total — instead of a single "summary is wrong".

Then('the item total should equal the sum of the prices I added', async ({ checkoutPage, scenario }) => {
  const { itemTotal } = await checkoutPage.summary();
  expect(toCents(itemTotal)).toBe(sumCents(scenario.addedProducts.map((p) => p.price)));
});

Then('the tax should be 8% of the item total', async ({ checkoutPage }) => {
  const { itemTotal, tax } = await checkoutPage.summary();
  expect(toCents(tax)).toBe(expectedTaxCents(itemTotal));
});

Then('the order total should equal the item total plus tax', async ({ checkoutPage }) => {
  const { itemTotal, tax, total } = await checkoutPage.summary();
  expect(toCents(total)).toBe(toCents(itemTotal) + toCents(tax));
});

Then('the order total should be {string}', async ({ checkoutPage }, expected: string) => {
  const { total } = await checkoutPage.summary();
  expect(total.toFixed(2)).toBe(expected.replace('$', ''));
});

When('I finish the order', async ({ checkoutPage }) => {
  await checkoutPage.finish();
});

Then('I should see the order confirmation', async ({ checkoutPage }) => {
  await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
});
