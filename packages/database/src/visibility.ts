import type { Prisma } from '@prisma/client';

export const activeCouponWhere = (now = new Date()): Prisma.CouponWhereInput => ({
  isActive: true,
  isHidden: false,
  merchant: { isActive: true },
  AND: [
    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
  ],
});

export const activeDealWhere = (now = new Date()): Prisma.DealWhereInput => ({
  status: 'ACTIVE',
  isHidden: false,
  product: { isActive: true },
  merchant: { isActive: true },
  AND: [
    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    { OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
  ],
});
