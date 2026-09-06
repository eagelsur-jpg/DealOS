import { unstable_cache } from 'next/cache';
import { DealRepository, DealService, prisma } from '@dealos/database';
import type { DealSort } from '@dealos/types';

type DealListMode = 'featured' | 'trending' | 'newest' | 'hot' | 'expired' | 'hidden';

const deals = new DealService(new DealRepository(prisma));

const toNumber = (value: unknown): number => Number(value);

export interface DealCardData {
  id: string;
  slug: string;
  title: string;
  merchantName: string;
  merchantSlug: string;
  productName: string;
  productImageUrl: string | null;
  currentPrice: number;
  previousPrice: number | null;
  score: number;
  isHot: boolean;
  isFeatured: boolean;
  endsAt: Date | null;
  couponCode: string | null;
  affiliateLinkId: string | null;
}

const mapDealCard = (deal: {
  id: string;
  slug: string;
  title: string;
  merchant: { name: string; slug: string };
  product: { name: string; imageUrl: string | null };
  currentPrice: unknown;
  previousPrice: unknown;
  score: number;
  isHot: boolean;
  isFeatured: boolean;
  endsAt: Date | null;
  coupons: Array<{ code: string }>;
  affiliateLinks?: Array<{ id: string }>;
}): DealCardData => ({
  id: deal.id,
  slug: deal.slug,
  title: deal.title,
  merchantName: deal.merchant.name,
  merchantSlug: deal.merchant.slug,
  productName: deal.product.name,
  productImageUrl: deal.product.imageUrl,
  currentPrice: toNumber(deal.currentPrice),
  previousPrice: deal.previousPrice ? toNumber(deal.previousPrice) : null,
  score: deal.score,
  isHot: deal.isHot,
  isFeatured: deal.isFeatured,
  endsAt: deal.endsAt,
  couponCode: deal.coupons[0]?.code ?? null,
  affiliateLinkId: deal.affiliateLinks?.[0]?.id ?? null
});

const getDealsByModeCached = (mode: DealListMode, count = 8) =>
  unstable_cache(
    async () => {
      const result = await deals.listDeals({ mode, page: 1, pageSize: count });
      return result.items.map(mapDealCard);
    },
    [`home-${mode}-${count}`],
    { revalidate: 300 },
  )();

export const getHomePageData = unstable_cache(
  async () => {
    const [trendingDeals, featuredDeals, newestDeals, categories, merchants, latestCoupons] = await Promise.all([
      getDealsByModeCached('trending', 8),
      getDealsByModeCached('featured', 8),
      getDealsByModeCached('newest', 8),
      prisma.category.findMany({
        take: 10,
        orderBy: {
          products: {
            _count: 'desc'
          }
        },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      }),
      prisma.merchant.findMany({
        where: { isActive: true },
        take: 10,
        orderBy: {
          deals: {
            _count: 'desc'
          }
        },
        include: {
          _count: {
            select: {
              deals: true
            }
          }
        }
      }),
      prisma.coupon.findMany({
        where: {
          isActive: true,
          isHidden: false
        },
        take: 8,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          merchant: true
        }
      })
    ]);

    return {
      trendingDeals,
      featuredDeals,
      newestDeals,
      categories,
      merchants,
      latestCoupons
    };
  },
  ['homepage-data'],
  { revalidate: 300 },
);

export const getDealsListing = async (input: {
  mode?: DealListMode;
  query?: string;
  category?: string;
  merchant?: string;
  hasCoupon?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  pageSize: number;
  sort?: DealSort;
}) => {
  const result = await deals.listDeals({
    mode: input.mode,
    page: input.page,
    pageSize: input.pageSize,
    filters: {
      query: input.query,
      categorySlug: input.category,
      merchantSlug: input.merchant,
      hasCoupon: input.hasCoupon,
      minPrice: input.minPrice,
      maxPrice: input.maxPrice
    },
    sort: input.sort
  });

  return {
    ...result,
    items: result.items.map(mapDealCard)
  };
};

export const getDealBySlug = async (slug: string) => {
  const deal = await prisma.deal.findUnique({
    where: { slug },
    include: {
      merchant: true,
      product: {
        include: {
          category: true,
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 5
          },
          priceHistory: {
            orderBy: { recordedAt: 'desc' },
            take: 30
          }
        }
      },
      coupons: {
        where: { isActive: true, isHidden: false },
        take: 5
      },
      affiliateLinks: {
        where: { isActive: true },
        take: 1
      },
      _count: {
        select: {
          clicks: true
        }
      }
    }
  });

  if (!deal) {
    return null;
  }

  const related = await prisma.deal.findMany({
    where: {
      status: 'ACTIVE',
      isHidden: false,
      id: {
        not: deal.id
      },
      OR: [{ productId: deal.productId }, { product: { categoryId: deal.product.categoryId } }]
    },
    take: 4,
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    include: {
      product: true,
      merchant: true,
      coupons: {
        where: { isActive: true, isHidden: false },
        take: 1
      },
      affiliateLinks: {
        where: { isActive: true },
        take: 1
      }
    }
  });

  return {
    deal: {
      ...deal,
      currentPrice: toNumber(deal.currentPrice),
      previousPrice: deal.previousPrice ? toNumber(deal.previousPrice) : null
    },
    priceHistory: deal.product.priceHistory.map((entry) => ({
      ...entry,
      price: toNumber(entry.price)
    })),
    relatedDeals: related.map(mapDealCard)
  };
};

export const getCategoriesPageData = unstable_cache(
  () =>
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    }),
  ['categories-page'],
  { revalidate: 900 },
);

export const getCategoryBySlug = async (
  slug: string,
  page: number,
  pageSize: number,
  sort?: DealSort,
  minPrice?: number,
  maxPrice?: number,
  hasCoupon?: boolean,
) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          products: true
        }
      }
    }
  });

  if (!category) {
    return null;
  }

  const dealsResult = await getDealsListing({
    category: slug,
    page,
    pageSize,
    sort,
    minPrice,
    maxPrice,
    hasCoupon
  });

  return {
    category,
    deals: dealsResult
  };
};

export const getMerchantsPageData = unstable_cache(
  () =>
    prisma.merchant.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            deals: true,
            coupons: true
          }
        }
      }
    }),
  ['merchants-page'],
  { revalidate: 900 },
);

export const getMerchantBySlug = async (slug: string, page: number, pageSize: number, sort?: DealSort) => {
  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    include: {
      _count: {
        select: {
          deals: true,
          coupons: true
        }
      }
    }
  });

  if (!merchant) {
    return null;
  }

  const [dealsResult, coupons] = await Promise.all([
    getDealsListing({ merchant: slug, page, pageSize, sort }),
    prisma.coupon.findMany({
      where: {
        merchantId: merchant.id,
        isActive: true,
        isHidden: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })
  ]);

  return {
    merchant,
    deals: dealsResult,
    coupons
  };
};

export const getCouponsListing = async (page: number, pageSize: number) => {
  const skip = (page - 1) * pageSize;
  const [items, totalItems] = await Promise.all([
    prisma.coupon.findMany({
      where: {
        isActive: true,
        isHidden: false
      },
      include: {
        merchant: true,
        deal: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageSize
    }),
    prisma.coupon.count({
      where: {
        isActive: true,
        isHidden: false
      }
    })
  ]);

  return {
    items,
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize))
  };
};

export const getClearanceListing = async (page: number, pageSize: number) => {
  const base = await getDealsListing({
    page,
    pageSize,
    sort: {
      field: 'savings',
      direction: 'desc'
    }
  });

  return {
    ...base,
    items: base.items.filter((deal) => {
      if (!deal.previousPrice || deal.previousPrice <= 0) {
        return false;
      }

      const discountPercent = ((deal.previousPrice - deal.currentPrice) / deal.previousPrice) * 100;
      return discountPercent >= 25;
    })
  };
};

export const getAutocomplete = (query: string, limit = 8) => deals.autocomplete(query, limit);

export const getSearchDeals = async (input: {
  query: string;
  page: number;
  pageSize: number;
  sort?: DealSort;
  category?: string;
  merchant?: string;
}) =>
  getDealsListing({
    query: input.query,
    page: input.page,
    pageSize: input.pageSize,
    sort: input.sort,
    category: input.category,
    merchant: input.merchant
  });
