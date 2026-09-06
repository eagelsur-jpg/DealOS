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
      category: {}
    } as unknown as PrismaClient;

    const repository = new DealRepository(prisma);
    await repository.list({
      mode: 'featured',
      page: 1,
      pageSize: 20
    });

    expect(findMany).toHaveBeenCalled();
    const call = findMany.mock.calls[0][0];
    expect(call.where.isFeatured).toBe(true);
    expect(call.where.status).toBe('ACTIVE');
  });
});
