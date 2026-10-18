export const productSchema = {
  type: 'object',
  required: ['id', 'title', 'price', 'stock', 'category'],
  properties: {
    id: { type: 'integer', minimum: 1 },
    title: { type: 'string', minLength: 1 },
    price: { type: 'number', exclusiveMinimum: 0 },
    discountPercentage: { type: 'number', minimum: 0, maximum: 100 },
    rating: { type: 'number', minimum: 0, maximum: 5 },
    stock: { type: 'integer', minimum: 0 },
    category: { type: 'string' },
    tags: { type: 'array', items: { type: 'string' } },
  },
};

export const productListSchema = {
  type: 'object',
  required: ['products', 'total', 'skip', 'limit'],
  properties: {
    products: { type: 'array', items: { type: 'object', required: ['id'] } },
    total: { type: 'integer', minimum: 0 },
    skip: { type: 'integer', minimum: 0 },
    limit: { type: 'integer', minimum: 0 },
  },
};
