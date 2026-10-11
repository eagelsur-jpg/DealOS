import { prisma } from '../src/client.js';
import { activeDealWhere, activeCouponWhere } from '../src/visibility.js';
import { verifyPassword } from '@dealos/utils';

try {
  const [
    activeDeals,
    activeCoupons,
    sampleProducts,
    placeholderImages,
    sampleClicks,
    sampleOrders,
    users,
  ] = await Promise.all([
    prisma.deal.count({ where: activeDealWhere() }),
    prisma.coupon.count({ where: activeCouponWhere() }),
    prisma.product.findMany({
      where: { slug: { in: ['macbook-pro-14-m4', 'sony-wh-1000xm5', 'dyson-v15-detect'] } },
      select: { id: true, slug: true },
    }),
    prisma.product.count({ where: { imageUrl: { contains: 'example.com', mode: 'insensitive' } } }),
    prisma.click.count({ where: { userAgent: 'seed-script' } }),
    prisma.commissionEvent.count({ where: { orderId: 'ORDER-1001' } }),
    prisma.user.findMany({
      where: { email: { in: ['admin@dealos.ai', 'member@dealos.ai'] } },
      select: { password: true, isActive: true },
    }),
  ]);
  const activeDefaultPasswordAccounts = users.filter(
    (user) =>
      user.isActive && user.password && verifyPassword('ChangeThisPassword123!', user.password),
  ).length;
  console.log(
    JSON.stringify(
      {
        readOnly: true,
        activeDeals,
        activeCoupons,
        sampleIdentifierMatches: sampleProducts,
        placeholderImages,
        sampleClicks,
        sampleOrderIdentifierMatches: sampleOrders,
        activeDefaultPasswordAccounts,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
