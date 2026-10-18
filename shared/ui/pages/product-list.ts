import { Locator } from '@playwright/test';
import { parseMoney } from '../../money.helper';
import type { Product } from './inventory.page';

/**
 * Reads a list of product rows — the catalogue and the cart share the same markup.
 *
 * Waits for the first row, then reads each row's name and price TOGETHER. Two separate
 * `allInnerTexts()` calls can run while the list is still rendering and return lists of
 * different lengths, pairing a name with the wrong price or with none at all.
 */
export async function readProducts(rows: Locator): Promise<Product[]> {
  await rows.first().waitFor();
  const products: Product[] = [];
  for (const row of await rows.all()) {
    products.push({
      name: await row.getByTestId('inventory-item-name').innerText(),
      price: parseMoney(await row.getByTestId('inventory-item-price').innerText()),
    });
  }
  return products;
}
