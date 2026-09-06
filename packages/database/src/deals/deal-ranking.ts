import type { Deal } from '@prisma/client';

const hoursSince = (date: Date): number => (Date.now() - date.getTime()) / (1000 * 60 * 60);

export const computeDealScore = (deal: Deal, clickCount = 0): number => {
  const previousPrice = deal.previousPrice ? Number(deal.previousPrice) : null;
  const currentPrice = Number(deal.currentPrice);
  const savingsPercent =
    previousPrice && previousPrice > 0 ? ((previousPrice - currentPrice) / previousPrice) * 100 : 0;
  const freshness = Math.max(0, 1 - hoursSince(deal.createdAt) / 168);
  const clickBoost = Math.min(25, Math.log10(clickCount + 1) * 10);
  const featureBoost = deal.isFeatured ? 10 : 0;
  const hotBoost = deal.isHot ? 15 : 0;

  return Number((savingsPercent * 0.45 + freshness * 30 + clickBoost + featureBoost + hotBoost).toFixed(2));
};

export const rankDeals = <T extends Deal & { clickCount?: number }>(deals: T[]): T[] =>
  [...deals]
    .map((deal) => ({
      ...deal,
      score: computeDealScore(deal, deal.clickCount ?? 0)
    }))
    .sort((a, b) => b.score - a.score);
