export interface CartLineRequest {
  readonly id: number;
  readonly quantity: number;
}

/** The body for `POST /carts/add`. */
export function newCartBody(userId: number, lines: readonly CartLineRequest[]) {
  return { userId, products: lines.map(({ id, quantity }) => ({ id, quantity })) };
}
