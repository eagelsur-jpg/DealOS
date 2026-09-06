import {
  AffiliateEngine,
  CategoryRepository,
  CouponRepository,
  DealRepository,
  DealService,
  MerchantRepository,
  ProductRepository,
  prisma
} from '@dealos/database';
import type { CacheStore } from '@dealos/utils/dist/cache.js';
import { InMemoryCacheStore, RedisCacheStore, createRedisClient } from '@dealos/utils/dist/cache.js';
import { apiEnv } from './env.js';

export interface ApiDependencies {
  deals: DealService;
  merchants: MerchantRepository;
  products: ProductRepository;
  coupons: CouponRepository;
  categories: CategoryRepository;
  affiliate: AffiliateEngine;
  cache: CacheStore;
}

export const createDependencies = async (): Promise<ApiDependencies> => {
  const cache = apiEnv.REDIS_URL
    ? new RedisCacheStore(await createRedisClient(apiEnv.REDIS_URL))
    : new InMemoryCacheStore();

  return {
    deals: new DealService(new DealRepository(prisma)),
    merchants: new MerchantRepository(prisma),
    products: new ProductRepository(prisma),
    coupons: new CouponRepository(prisma),
    categories: new CategoryRepository(prisma),
    affiliate: new AffiliateEngine(prisma),
    cache
  };
};
