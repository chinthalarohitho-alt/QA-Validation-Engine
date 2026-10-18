/**
 * Money arithmetic for assertions — done in integer cents, never in floats.
 *
 * 0.1 + 0.2 !== 0.3 in JavaScript, so a test that sums prices as floats can fail on a correct
 * total or, worse, pass on a wrong one after a lenient toBeCloseTo. Every comparison here
 * converts to cents first and compares exactly.
 */

/** The store's sales-tax rate. */
export const TAX_RATE = 0.08;

/** "Item total: $29.99" -> 29.99. Throws when there is no amount, rather than returning NaN. */
export function parseMoney(text: string): number {
  const match = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  if (!match) throw new Error(`No amount found in "${text}".`);
  return Number(match[0]);
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function sumCents(amounts: readonly number[]): number {
  return amounts.reduce((sum, amount) => sum + toCents(amount), 0);
}

/** Tax on an amount, rounded half-up to the cent the way the store rounds it. */
export function expectedTaxCents(itemTotal: number): number {
  return Math.round(toCents(itemTotal) * TAX_RATE);
}
