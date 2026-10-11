import { activeCouponWhere } from '../visibility.js';
import type { PrismaClient } from '@prisma/client';

export class CouponRepository {
  constructor(private readonly prisma: PrismaClient) {}

  list(includeUnavailable = false) {
    return this.prisma.coupon.findMany({
      where: includeUnavailable ? {} : activeCouponWhere(),
      include: { merchant: true, deal: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  search(query: string) {
    return this.prisma.coupon.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        ...activeCouponWhere(),
      },
      include: { merchant: true, deal: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  getById(id: string) {
    return this.prisma.coupon.findUnique({
      where: { id },
      include: { merchant: true, deal: true },
    });
  }

  create(data: {
    code: string;
    description?: string;
    dealId?: string;
    merchantId: string;
    startsAt?: Date;
    expiresAt?: Date;
    isActive?: boolean;
    isHidden?: boolean;
  }) {
    return this.prisma.coupon.create({
      data: {
        ...data,
        description: data.description ?? null,
        dealId: data.dealId ?? null,
      },
    });
  }

  update(
    id: string,
    data: Partial<{
      code: string;
      description: string;
      dealId: string | null;
      merchantId: string;
      startsAt: Date | null;
      expiresAt: Date | null;
      isActive: boolean;
      isHidden: boolean;
    }>,
  ) {
    return this.prisma.coupon.update({
      where: { id },
      data,
    });
  }

  remove(id: string) {
    return this.prisma.coupon.delete({ where: { id } });
  }
}
