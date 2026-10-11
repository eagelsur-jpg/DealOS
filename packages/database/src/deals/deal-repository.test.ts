import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { DealRepository } from './deal-repository.js';

describe('deal repository', () => {
  it('builds featured query correctly', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const prisma = {
      deal: { findMany, count },
      product: {},
      merchant: {},
      coupon: {},
      category: {},
    } as unknown as PrismaClient;

    const repository = new DealRepository(prisma);
    await repository.list({
      mode: 'featured',
      page: 1,
      pageSize: 20,
    });

    expect(findMany).toHaveBeenCalled();
    const call = findMany.mock.calls[0][0];
    expect(call.where.isFeatured).toBe(true);
    expect(call.where.status).toBe('ACTIVE');
  });
  it('combines expiration and keyword constraints without broadening either', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new DealRepository({
      deal: { findMany, count: vi.fn().mockResolvedValue(0) },
    } as unknown as PrismaClient);
    await repository.list({
      mode: 'expired',
      filters: { query: 'sony', minPrice: 0, hasCoupon: false },
      page: 1,
      pageSize: 20,
    });
    const where = findMany.mock.calls[0][0].where;
    expect(where.OR).toHaveLength(2);
    expect(where.AND[0].OR).toHaveLength(5);
    expect(where.currentPrice.gte).toBe(0);
    expect(where.coupons.none).toBeDefined();
    expect(where.isHidden).toBe(false);
  });
});
