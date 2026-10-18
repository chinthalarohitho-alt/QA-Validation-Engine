const cartLine = {
  type: 'object',
  required: ['id', 'title', 'price', 'quantity', 'total'],
  properties: {
    id: { type: 'integer' },
    title: { type: 'string' },
    price: { type: 'number', exclusiveMinimum: 0 },
    quantity: { type: 'integer', minimum: 1 },
    total: { type: 'number', minimum: 0 },
  },
};

export const cartSchema = {
  type: 'object',
  required: ['id', 'products', 'total', 'discountedTotal', 'userId', 'totalProducts', 'totalQuantity'],
  properties: {
    id: { type: 'integer' },
    products: { type: 'array', minItems: 1, items: cartLine },
    total: { type: 'number', minimum: 0 },
    discountedTotal: { type: 'number', minimum: 0 },
    userId: { type: 'integer' },
    totalProducts: { type: 'integer', minimum: 1 },
    totalQuantity: { type: 'integer', minimum: 1 },
  },
};
