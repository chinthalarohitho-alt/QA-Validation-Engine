import { Locator, Page } from '@playwright/test';
import { parseMoney } from '../../money.helper';
import { waitForPage } from './navigation';
import { readProducts } from './product-list';

export interface Product {
  readonly name: string;
  readonly price: number;
}

/** The sort dropdown's visible labels, keyed by the words a feature file uses. */
export const SORT_OPTIONS = {
  'name ascending': 'Name (A to Z)',
  'name descending': 'Name (Z to A)',
  'price ascending': 'Price (low to high)',
  'price descending': 'Price (high to low)',
} as const;

export type SortOrder = keyof typeof SORT_OPTIONS;

export class InventoryPage {
  readonly title: Locator;
  readonly items: Locator;
  readonly sort: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.items = page.getByTestId('inventory-item');
    this.sort = page.getByTestId('product-sort-container');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
    this.cartLink = page.getByTestId('shopping-cart-link');
  }

  async goto(): Promise<void> {
    await this.page.goto('/inventory.html');
    await waitForPage(this.page, 'Products');
  }

  /** A product card, found by its visible name rather than by a slug derived from it. */
  item(name: string): Locator {
    return this.items.filter({ has: this.page.getByTestId('inventory-item-name').getByText(name, { exact: true }) });
  }

  async products(): Promise<Product[]> {
    return readProducts(this.items);
  }

  async imageSources(): Promise<string[]> {
    return this.items.locator('img').evaluateAll((images) => images.map((img) => (img as HTMLImageElement).src));
  }

  async sortBy(order: SortOrder): Promise<void> {
    await this.sort.selectOption({ label: SORT_OPTIONS[order] });
  }

  /** Adds a product and returns it with the price shown on its card at the time. */
  async addToCart(name: string): Promise<Product> {
    const card = this.item(name);
    const price = parseMoney(await card.getByTestId('inventory-item-price').innerText());
    await card.getByRole('button', { name: 'Add to cart' }).click();
    return { name, price };
  }

  async openCart(): Promise<void> {
    // Every navigation waits for its destination, so the next step never reads the page it left.
    await this.cartLink.click();
    await waitForPage(this.page, 'Your Cart');
  }
}
