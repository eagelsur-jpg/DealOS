import type { PrismaClient } from '@prisma/client';
import { DealStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { DealFilters, DealSort } from '@dealos/types';

export type DealListMode = 'featured' | 'trending' | 'newest' | 'hot' | 'expired' | 'hidden';

export interface DealQueryInput {
  mode?: DealListMode;
  filters?: DealFilters;
  page: number;
  pageSize: number;
  sort?: DealSort;
}

export class DealRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private buildWhere(mode: DealListMode | undefined, filters: DealFilters = {}): Prisma.DealWhereInput {
    const now = new Date();
    const where: Prisma.DealWhereInput = {};

    if (mode === 'featured') {
      where.isFeatured = true;
      where.status = DealStatus.ACTIVE;
    } else if (mode === 'hot') {
      where.isHot = true;
      where.status = DealStatus.ACTIVE;
    } else if (mode === 'expired') {
      where.OR = [{ status: DealStatus.EXPIRED }, { endsAt: { lt: now } }];
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
      where.OR = [
        ...(where.OR ?? []),
        { title: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { product: { name: { contains: filters.query, mode: 'insensitive' } } },
        { merchant: { name: { contains: filters.query, mode: 'insensitive' } } },
        { coupons: { some: { code: { contains: filters.query, mode: 'insensitive' } } } }
      ];
    }

    if (filters.categorySlug) {
      where.product = {
        is: {
          category: {
            slug: filters.categorySlug
          }
        }
      };
    }

    if (filters.merchantSlug) {
      where.merchant = {
        slug: filters.merchantSlug
      };
    }

    if (filters.hasCoupon) {
      where.coupons = {
        some: {
          isActive: true,
          isHidden: false
        }
      };
    }

    if (filters.minPrice || filters.maxPrice) {
      where.currentPrice = {
        ...(filters.minPrice ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice ? { lte: filters.maxPrice } : {})
      };
    }

    return where;
  }

  private buildOrderBy(mode: DealListMode | undefined, sort?: DealSort): Prisma.DealOrderByWithRelationInput[] {
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

    const [items, totalItems] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        include: {
          product: { include: { category: true } },
          merchant: true,
          coupons: { where: { isActive: true, isHidden: false } },
          _count: { select: { clicks: true } }
        },
        orderBy,
        skip: (input.page - 1) * input.pageSize,
        take: input.pageSize
      }),
      this.prisma.deal.count({ where })
    ]);

    return {
      items,
      totalItems,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.max(1, Math.ceil(totalItems / input.pageSize))
    };
  }

  async getById(id: string) {
    return this.prisma.deal.findUnique({
      where: { id },
      include: {
        product: { include: { category: true } },
        merchant: true,
        coupons: true,
        affiliateLinks: true
      }
    });
  }

  async create(input: Prisma.DealUncheckedCreateInput) {
    return this.prisma.deal.create({ data: input });
  }

  async update(id: string, input: Prisma.DealUncheckedUpdateInput) {
    return this.prisma.deal.update({
      where: { id },
      data: input
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
      pageSize
    });
  }

  async autocomplete(query: string, limit = 8) {
    const [deals, products, merchants, coupons, categories] = await Promise.all([
      this.prisma.deal.findMany({
        where: { title: { contains: query, mode: 'insensitive' }, status: DealStatus.ACTIVE },
        take: limit,
        select: { id: true, title: true, slug: true }
      }),
      this.prisma.product.findMany({
        where: { name: { contains: query, mode: 'insensitive' }, isActive: true },
        take: limit,
        select: { id: true, name: true, slug: true }
      }),
      this.prisma.merchant.findMany({
        where: { name: { contains: query, mode: 'insensitive' }, isActive: true },
        take: limit,
        select: { id: true, name: true, slug: true }
      }),
      this.prisma.coupon.findMany({
        where: { code: { contains: query, mode: 'insensitive' }, isActive: true, isHidden: false },
        take: limit,
        select: { id: true, code: true }
      }),
      this.prisma.category.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        take: limit,
        select: { id: true, name: true, slug: true }
      })
    ]);

    return [
      ...deals.map((item) => ({ type: 'deal' as const, value: item.slug, label: item.title })),
      ...products.map((item) => ({ type: 'product' as const, value: item.slug, label: item.name })),
      ...merchants.map((item) => ({ type: 'merchant' as const, value: item.slug, label: item.name })),
      ...coupons.map((item) => ({ type: 'coupon' as const, value: item.code, label: item.code })),
      ...categories.map((item) => ({ type: 'category' as const, value: item.slug, label: item.name }))
    ].slice(0, limit);
  }
}
