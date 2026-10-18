import { createBdd } from 'playwright-bdd';
import { expect, test } from '../fixtures/test.fixture';

const { When, Then } = createBdd(test);

Then('the cart should list exactly the products I added, at the prices I saw', async ({ cartPage, scenario }) => {
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  expect([...(await cartPage.products())].sort(byName)).toEqual([...scenario.addedProducts].sort(byName));
});

When('I remove {string} from the cart', async ({ cartPage, scenario }, name: string) => {
  await cartPage.remove(name);
  scenario.addedProducts = scenario.addedProducts.filter((p) => p.name !== name);
});

Then('the cart should be empty', async ({ cartPage }) => {
  await expect(cartPage.items).toHaveCount(0);
});

When('I go to checkout', async ({ cartPage }) => {
  await cartPage.checkout();
});
