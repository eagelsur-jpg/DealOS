import type { PrismaClient } from '@prisma/client';
import { DealStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { activeCouponWhere, activeDealWhere } from '../visibility.js';
import type { DealFilters, DealSort } from '@dealos/types';

export type DealListMode = 'featured' | 'trending' | 'newest' | 'hot' | 'expired' | 'hidden';

export interface DealQueryInput {
  mode?: DealListMode;
  filters?: DealFilters;
  page: number;
  pageSize: number;
  sort?: DealSort;
  minSavingsPercent?: number;
}

export class DealRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private buildWhere(
    mode: DealListMode | undefined,
    filters: DealFilters = {},
  ): Prisma.DealWhereInput {
    const now = new Date();
    const where: Prisma.DealWhereInput =
      mode === 'expired' || mode === 'hidden' || (filters.status && filters.status !== 'ACTIVE')
        ? {}
        : activeDealWhere(now);

    if (mode === 'featured') {
      where.isFeatured = true;
      where.status = DealStatus.ACTIVE;
    } else if (mode === 'hot') {
      where.isHot = true;
      where.status = DealStatus.ACTIVE;
    } else if (mode === 'expired') {
      where.isHidden = false;
      where.product = { isActive: true };
      where.merchant = { isActive: true };
      where.status = { in: [DealStatus.ACTIVE, DealStatus.EXPIRED] };
      where.OR = [{ status: DealStatus.EXPIRED }, { endsAt: { lte: now } }];
    } else if (mode === 'hidden') {
      where.OR = [{ status: DealStatus.HIDDEN }, { isHidden: true }];
    } else if (mode === 'newest' || mode === 'trending') {
      where.status = DealStatus.ACTIVE;
      where.isHidden = false;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.query) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          OR: [
            { title: { contains: filters.query, mode: 'insensitive' } },
            { description: { contains: filters.query, mode: 'insensitive' } },
            { product: { name: { contains: filters.query, mode: 'insensitive' } } },
            { merchant: { name: { contains: filters.query, mode: 'insensitive' } } },
            {
              coupons: {
                some: {
                  ...activeCouponWhere(now),
                  code: { contains: filters.query, mode: 'insensitive' },
                },
              },
            },
          ],
        },
      ];
    }

    if (filters.categorySlug) {
      where.product = {
        is: {
          isActive: true,
          category: {
            slug: filters.categorySlug,
          },
        },
      };
    }

    if (filters.merchantSlug) {
      where.merchant = {
        isActive: true,
        slug: filters.merchantSlug,
      };
    }

    if (filters.hasCoupon !== undefined) {
      where.coupons = {
        ...(filters.hasCoupon
          ? { some: activeCouponWhere(now) }
          : { none: activeCouponWhere(now) }),
      };
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.currentPrice = {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
      };
    }

    return where;
  }

  private buildOrderBy(
    mode: DealListMode | undefined,
    sort?: DealSort,
  ): Prisma.DealOrderByWithRelationInput[] {
    if (sort) {
      if (sort.field === 'price') {
        return [{ currentPrice: sort.direction }];
      }
      if (sort.field === 'createdAt') {
        return [{ createdAt: sort.direction }];
      }
      if (sort.field === 'score') {
        return [{ score: sort.direction }];
      }
      if (sort.field === 'savings') {
        return [{ previousPrice: sort.direction }, { currentPrice: sort.direction }];
      }
    }

    if (mode === 'newest') return [{ createdAt: 'desc' }];
    if (mode === 'trending') return [{ score: 'desc' }, { createdAt: 'desc' }];
    if (mode === 'featured') return [{ score: 'desc' }, { createdAt: 'desc' }];
    if (mode === 'hot') return [{ score: 'desc' }, { createdAt: 'desc' }];
    if (mode === 'expired') return [{ endsAt: 'desc' }];
    if (mode === 'hidden') return [{ updatedAt: 'desc' }];
    return [{ score: 'desc' }, { createdAt: 'desc' }];
  }

  async list(input: DealQueryInput) {
    const where = this.buildWhere(input.mode, input.filters);
    const orderBy = this.buildOrderBy(input.mode, input.sort);
    let orderedIds: string[] | undefined;
    let matchedTotal: number | undefined;
    if (input.sort?.field === 'savings' || input.minSavingsPercent !== undefined) {
      const candidates = await this.prisma.deal.findMany({
        where,
        select: { id: true, currentPrice: true, previousPrice: true },
      });
      const savings = (item: (typeof candidates)[number]) =>
        item.previousPrice && Number(item.previousPrice) > 0
          ? ((Number(item.previousPrice) - Number(item.currentPrice)) /
              Number(item.previousPrice)) *
            100
          : 0;
      const matched = candidates.filter(
        (item) => input.minSavingsPercent === undefined || savings(item) >= input.minSavingsPercent,
      );
      matched.sort(
        (a, b) =>
          (savings(a) - savings(b)) * (input.sort?.direction === 'asc' ? 1 : -1) ||
          a.id.localeCompare(b.id),
      );
      matchedTotal = matched.length;
      orderedIds = matched
        .slice((input.page - 1) * input.pageSize, input.page * input.pageSize)
        .map((item) => item.id);
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.deal.findMany({
        where: orderedIds ? { id: { in: orderedIds } } : where,
        include: {
          product: { include: { category: true } },
          merchant: true,
          coupons: { where: activeCouponWhere() },
          affiliateLinks: { where: { isActive: true }, take: 1 },
          _count: { select: { clicks: true } },
        },
        orderBy,
        skip: orderedIds ? 0 : (input.page - 1) * input.pageSize,
        take: input.pageSize,
      }),
      matchedTotal !== undefined
        ? Promise.resolve(matchedTotal)
        : this.prisma.deal.count({ where }),
    ]);

    return {
      items: orderedIds
        ? items.sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id))
        : items,
      totalItems,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.max(1, Math.ceil(totalItems / input.pageSize)),
    };
  }

  async getById(id: string) {
    return this.prisma.deal.findUnique({
      where: { id },
      include: {
        product: { include: { category: true } },
        merchant: true,
        coupons: { where: activeCouponWhere() },
        affiliateLinks: { where: { isActive: true } },
      },
    });
  }

  async create(input: Prisma.DealUncheckedCreateInput) {
    return this.prisma.deal.create({ data: input });
  }

  async update(id: string, input: Prisma.DealUncheckedUpdateInput) {
    return this.prisma.deal.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    return this.prisma.deal.delete({ where: { id } });
  }

  async search(searchTerm: string, page: number, pageSize: number) {
    return this.list({
      mode: undefined,
      filters: { query: searchTerm },
      page,
      pageSize,
    });
  }

  async autocomplete(query: string, limit = 8) {
    const [deals, products, merchants, coupons, categories] = await Promise.all([
      this.prisma.deal.findMany({
        where: { ...activeDealWhere(), title: { contains: query, mode: 'insensitive' } },
        take: limit,
        select: { id: true, title: true, slug: true },
      }),
      this.prisma.product.findMany({
        where: { name: { contains: query, mode: 'insensitive' }, isActive: true },
        take: limit,
        select: { id: true, name: true, slug: true },
      }),
      this.prisma.merchant.findMany({
        where: { name: { contains: query, mode: 'insensitive' }, isActive: true },
        take: limit,
        select: { id: true, name: true, slug: true },
      }),
      this.prisma.coupon.findMany({
        where: { ...activeCouponWhere(), code: { contains: query, mode: 'insensitive' } },
        take: limit,
        select: { id: true, code: true },
      }),
      this.prisma.category.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: limit,
        select: { id: true, name: true, slug: true },
      }),
    ]);

    return [
      ...deals.map((item) => ({ type: 'deal' as const, value: item.slug, label: item.title })),
      ...products.map((item) => ({ type: 'product' as const, value: item.slug, label: item.name })),
      ...merchants.map((item) => ({
        type: 'merchant' as const,
        value: item.slug,
        label: item.name,
      })),
      ...coupons.map((item) => ({ type: 'coupon' as const, value: item.code, label: item.code })),
      ...categories.map((item) => ({
        type: 'category' as const,
        value: item.slug,
        label: item.name,
      })),
    ].slice(0, limit);
  }
}
