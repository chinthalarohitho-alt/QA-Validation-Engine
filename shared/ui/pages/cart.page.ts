import { Locator, Page } from '@playwright/test';
import { waitForPage } from './navigation';
import { readProducts } from './product-list';
import { Product } from './inventory.page';

export class CartPage {
  readonly items: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async products(): Promise<Product[]> {
    return readProducts(this.items);
  }

  async remove(name: string): Promise<void> {
    const row = this.items.filter({ hasText: name });
    await row.getByRole('button', { name: 'Remove' }).click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
    await waitForPage(this.page, 'Checkout: Your Information');
  }
}
