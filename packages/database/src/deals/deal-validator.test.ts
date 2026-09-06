import { describe, expect, it } from 'vitest';
import { dealCreateSchema } from './deal-validator.js';

describe('deal validator', () => {
  it('accepts valid deal payloads', () => {
    const result = dealCreateSchema.parse({
      slug: 'sony-xm5-sale',
      title: 'Sony XM5 Sale',
      productId: 'p1',
      merchantId: 'm1',
      currentPrice: 299,
      previousPrice: 399
    });
    expect(result.slug).toBe('sony-xm5-sale');
  });

  it('rejects invalid pricing payloads', () => {
    expect(() =>
      dealCreateSchema.parse({
        slug: 'x',
        title: 'x',
        productId: 'p1',
        merchantId: 'm1',
        currentPrice: -20
      }),
    ).toThrow();
  });
});
