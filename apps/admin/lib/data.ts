import { prisma, activeDealWhere } from '@dealos/database';

const sampleAgents = ['seed-script', 'DealOS-runtime-verification', 'DealOS-rejected-example-verification'];
const genuineClickWhere = {
  OR: [{ userAgent: null }, { userAgent: { notIn: sampleAgents } }],
};

export const getMetrics = async () => {
  const now = new Date();
  const [activeDeals, expiredCoupons, clicks, products, merchants, clickGroups, excludedSampleClicks] =
    await Promise.all([
      prisma.deal.count({ where: activeDealWhere(now) }),
      prisma.coupon.count({ where: { expiresAt: { lte: now } } }),
      prisma.click.count({ where: genuineClickWhere }),
      prisma.product.count(),
      prisma.merchant.count(),
      prisma.click.groupBy({
        by: ['dealId'],
        where: { ...genuineClickWhere, dealId: { not: null } },
        _count: { dealId: true },
        orderBy: { _count: { dealId: 'desc' } },
        take: 10,
      }),
      prisma.click.count({ where: { userAgent: { in: sampleAgents } } }),
    ]);
  const deals = clickGroups.length
    ? await prisma.deal.findMany({
        where: { id: { in: clickGroups.flatMap((group) => group.dealId ? [group.dealId] : []) } },
        select: { id: true, title: true, merchant: { select: { name: true } } },
      })
    : [];
  const byId = new Map(deals.map((deal) => [deal.id, deal]));
  const topDeals = clickGroups.flatMap((group) => {
    const deal = group.dealId ? byId.get(group.dealId) : undefined;
    return deal ? [{ ...deal, _count: { clicks: group._count.dealId } }] : [];
  });
  return { activeDeals, expiredCoupons, clicks, products, merchants, topDeals, excludedSampleClicks };
};
