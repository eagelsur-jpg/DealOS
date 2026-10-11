import { prisma, activeDealWhere } from '@dealos/database';

export const getMetrics = async () => {
  const now = new Date();
  const [activeDeals, expiredCoupons, clicks, products, merchants, topDeals] = await Promise.all([
    prisma.deal.count({ where: activeDealWhere(now) }),
    prisma.coupon.count({ where: { expiresAt: { lte: now } } }),
    prisma.click.count(),
    prisma.product.count(),
    prisma.merchant.count(),
    prisma.deal.findMany({
      take: 10,
      orderBy: { clicks: { _count: 'desc' } },
      select: {
        id: true,
        title: true,
        merchant: { select: { name: true } },
        _count: { select: { clicks: true } },
      },
    }),
  ]);
  return { activeDeals, expiredCoupons, clicks, products, merchants, topDeals };
};
