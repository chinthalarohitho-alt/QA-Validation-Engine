import { uniqueSuffix } from '../unique.helper';

export interface Customer {
  readonly firstName: string;
  readonly lastName: string;
  readonly postalCode: string;
}

const FIRST_NAMES = ['Asha', 'Ravi', 'Meera', 'Arjun', 'Priya', 'Kiran'];
const LAST_NAMES = ['Rao', 'Iyer', 'Shah', 'Nair', 'Reddy', 'Das'];

/**
 * A checkout customer: realistic, unique per call, and overridable field by field.
 *
 * A scenario states only the field it is about — `buildCustomer({ postalCode: '' })` — and
 * everything else stays valid, so a failure always points at the field under test.
 */
export function buildCustomer(overrides: Partial<Customer> = {}): Customer {
  const suffix = uniqueSuffix();
  const seed = [...suffix].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    firstName: FIRST_NAMES[seed % FIRST_NAMES.length],
    lastName: `${LAST_NAMES[seed % LAST_NAMES.length]}-${suffix}`,
    postalCode: String(100000 + ((seed * 7919) % 900000)),
    ...overrides,
  };
}
