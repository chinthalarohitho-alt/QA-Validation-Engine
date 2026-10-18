import { Locator, Page } from '@playwright/test';
import { Customer } from '../../factories/customer.factory';
import { parseMoney } from '../../money.helper';
import { waitForPage } from './navigation';

export interface OrderSummary {
  readonly itemTotal: number;
  readonly tax: number;
  readonly total: number;
}

export class CheckoutPage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly error: Locator;
  readonly completeHeader: Locator;

  constructor(private readonly page: Page) {
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.finishButton = page.getByTestId('finish');
    this.error = page.getByTestId('error');
    this.completeHeader = page.getByTestId('complete-header');
  }

  async enterCustomer(customer: Customer): Promise<void> {
    await this.firstName.fill(customer.firstName);
    await this.lastName.fill(customer.lastName);
    await this.postalCode.fill(customer.postalCode);
    await this.continueButton.click();
  }

  async waitForOverview(): Promise<void> {
    await waitForPage(this.page, 'Checkout: Overview');
  }

  /** The three money lines of the overview, read as numbers. */
  async summary(): Promise<OrderSummary> {
    await this.waitForOverview();
    return {
      itemTotal: parseMoney(await this.page.getByTestId('subtotal-label').innerText()),
      tax: parseMoney(await this.page.getByTestId('tax-label').innerText()),
      total: parseMoney(await this.page.getByTestId('total-label').innerText()),
    };
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
    await waitForPage(this.page, 'Checkout: Complete!');
  }
}
