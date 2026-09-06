import { describe, expect, it } from 'vitest';
import { DealStatus, Prisma } from '@prisma/client';
import { computeDealScore, rankDeals } from './deal-ranking.js';

const createDeal = (overrides: Partial<{
  currentPrice: number;
  previousPrice: number | null;
  createdAt: Date;
  isFeatured: boolean;
  isHot: boolean;
}> = {}) =>
  ({
    id: 'd1',
    slug: 'deal-1',
    title: 'Deal 1',
    description: null,
    productId: 'p1',
    merchantId: 'm1',
    currentPrice: new Prisma.Decimal(overrides.currentPrice ?? 100),
    previousPrice:
      overrides.previousPrice === null
        ? null
        : new Prisma.Decimal(overrides.previousPrice ?? 150),
    currency: 'USD',
    startsAt: null,
    endsAt: null,
    source: null,
    status: DealStatus.ACTIVE,
    isFeatured: overrides.isFeatured ?? false,
    isHot: overrides.isHot ?? false,
    isHidden: false,
    score: 0,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: new Date()
  }) satisfies Parameters<typeof computeDealScore>[0];

describe('deal ranking', () => {
  it('computes higher scores for featured hot deals', () => {
    const normal = createDeal({ currentPrice: 120, previousPrice: 200 });
    const premium = createDeal({
      currentPrice: 120,
      previousPrice: 200,
      isFeatured: true,
      isHot: true
    });

    expect(computeDealScore(premium, 50)).toBeGreaterThan(computeDealScore(normal, 1));
  });

  it('ranks deals in descending score order', () => {
    const items = [
      { ...createDeal({ currentPrice: 150, previousPrice: 200 }), clickCount: 5 },
      { ...createDeal({ currentPrice: 100, previousPrice: 220, isFeatured: true }), clickCount: 50 }
    ];
    const result = rankDeals(items);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });
});
