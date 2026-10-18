import { currentUserSchema, errorSchema, loginSchema } from './auth.schema';
import { cartSchema } from './cart.schema';
import { productListSchema, productSchema } from './product.schema';

/** Schemas by the name a feature file uses: `Then the response should match the "cart" schema`. */
export const SCHEMAS: Record<string, object> = {
  login: loginSchema,
  'current-user': currentUserSchema,
  error: errorSchema,
  product: productSchema,
  'product-list': productListSchema,
  cart: cartSchema,
};
