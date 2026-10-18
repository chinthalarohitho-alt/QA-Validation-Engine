import { test as base } from 'playwright-bdd';
import { RoleName, roleFromTags, stateFileFor } from '../../config/roles.config';
import { CartPage } from '../pages/cart.page';
import { CheckoutPage } from '../pages/checkout.page';
import { InventoryPage, Product } from '../pages/inventory.page';
import { LoginPage } from '../pages/login.page';

/** What one scenario remembers between its steps. Fresh per test — nothing leaks. */
export interface ScenarioState {
  addedProducts: Product[];
}

export type UiFixtures = {
  /** The persona this scenario runs as, resolved from its tags. */
  role: RoleName;
  scenario: ScenarioState;
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<UiFixtures>({
  role: async ({ $tags }, use) => {
    await use(roleFromTags($tags));
  },

  /**
   * Points the browser context at the scenario's persona.
   *
   * This has to be a fixture override, not a Given step: Playwright loads `storageState` while
   * it builds the context, before the first step runs, so a step is too late to change identity.
   */
  storageState: async ({ role }, use) => {
    await use(stateFileFor(role));
  },

  scenario: async ({}, use) => {
    await use({ addedProducts: [] });
  },

  // Page objects are lazy: a scenario that never names one never constructs it.
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  inventoryPage: async ({ page }, use) => use(new InventoryPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
});

export { expect } from '@playwright/test';
