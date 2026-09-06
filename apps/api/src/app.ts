import type { ApiDependencies } from './dependencies.js';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { AppError, createPaginationMeta, isAppError, logger, paginate } from '@dealos/utils';

const dealModeSchema = z.enum(['featured', 'trending', 'newest', 'hot', 'expired', 'hidden']).optional();
const sortFieldSchema = z.enum(['createdAt', 'price', 'savings', 'score']).optional();
const sortDirectionSchema = z.enum(['asc', 'desc']).optional();

const listDealsQuerySchema = z.object({
  mode: dealModeSchema,
  q: z.string().optional(),
  category: z.string().optional(),
  merchant: z.string().optional(),
  hasCoupon: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'HIDDEN']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  sortField: sortFieldSchema,
  sortDirection: sortDirectionSchema
});

const createDealSchema = z.object({
  slug: z.string().min(3),
  title: z.string().min(3),
  description: z.string().optional(),
  productId: z.string().min(1),
  merchantId: z.string().min(1),
  currentPrice: z.number().positive(),
  previousPrice: z.number().positive().optional(),
  currency: z.string().length(3).default('USD'),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  source: z.string().optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'EXPIRED', 'HIDDEN']).optional(),
  isFeatured: z.boolean().optional(),
  isHot: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  score: z.number().min(0).max(100).optional()
});

const updateDealSchema = createDealSchema.partial();

const merchantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  websiteUrl: z.string().url(),
  affiliateNetwork: z.enum(['AMAZON', 'IMPACT', 'CJ', 'AWIN', 'PARTNERIZE', 'SHAREASALE', 'CUSTOM']),
  isActive: z.boolean().optional()
});

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional()
});

const couponSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  dealId: z.string().optional(),
  merchantId: z.string().min(1),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
  isHidden: z.boolean().optional()
});

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2)
});

const searchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional()
});

const autocompleteQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(20).optional()
});

const commissionSchema = z.object({
  affiliateLinkId: z.string().min(1),
  clickId: z.string().optional(),
  orderId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional()
});

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  responses: {
    200: {
      description: 'Health response',
      content: {
        'application/json': {
          schema: z.object({
            status: z.literal('ok'),
            timestamp: z.string()
          })
        }
      }
    }
  }
});

const dealsRoute = createRoute({
  method: 'get',
  path: '/v1/deals',
  request: {
    query: listDealsQuerySchema
  },
  responses: {
    200: {
      description: 'Deals listing',
      content: {
        'application/json': {
          schema: z.any()
        }
      }
    }
  }
});

export const createApp = (dependencies: ApiDependencies) => {
  const app = new OpenAPIHono();

  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      title: 'DealOS API',
      version: '2.0.0',
      description: 'Core Deals Engine API with affiliate and search capabilities.'
    }
  });

  app.get('/docs', swaggerUI({ url: '/openapi.json' }));

  app.openapi(healthRoute, (context) =>
    context.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    }),
  );

  app.openapi(dealsRoute, async (context) => {
    const query = listDealsQuerySchema.parse(context.req.query());
    const pagination = createPaginationMeta({
      page: query.page,
      pageSize: query.pageSize,
      maxPageSize: 100
    });
    const cacheKey = `deals:${JSON.stringify(query)}:${pagination.page}:${pagination.pageSize}`;

    const cached = await dependencies.cache.get<unknown>(cacheKey);
    if (cached) {
      return context.json(cached);
    }

    const data = await dependencies.deals.listDeals({
      mode: query.mode,
      filters: {
        query: query.q,
        categorySlug: query.category,
        merchantSlug: query.merchant,
        hasCoupon: query.hasCoupon,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        status: query.status
      },
      page: pagination.page,
      pageSize: pagination.pageSize,
      sort:
        query.sortField && query.sortDirection
          ? { field: query.sortField, direction: query.sortDirection }
          : undefined
    });

    await dependencies.cache.set(cacheKey, data, 60);
    return context.json(data);
  });

  app.get('/v1/deals/:id', async (context) => {
    const deal = await dependencies.deals.getDeal(context.req.param('id'));
    if (!deal) {
      throw new AppError('Deal not found', { statusCode: 404, code: 'DEAL_NOT_FOUND' });
    }
    return context.json(deal);
  });

  app.post('/v1/deals', async (context) => {
    const payload: z.infer<typeof createDealSchema> = createDealSchema.parse(await context.req.json());
    const created = await dependencies.deals.createDeal({
      ...payload,
      isFeatured: payload.isFeatured ?? false,
      isHot: payload.isHot ?? false,
      isHidden: payload.isHidden ?? false,
      score: payload.score ?? 0
    });
    return context.json(created, 201);
  });

  app.patch('/v1/deals/:id', async (context) => {
    const payload: z.infer<typeof updateDealSchema> = updateDealSchema.parse(await context.req.json());
    const updated = await dependencies.deals.updateDeal(context.req.param('id'), payload);
    return context.json(updated);
  });

  app.delete('/v1/deals/:id', async (context) => {
    await dependencies.deals.deleteDeal(context.req.param('id'));
    return context.body(null, 204);
  });

  app.get('/v1/deals/search', async (context) => {
    const query = searchQuerySchema.parse(context.req.query());
    const result = await dependencies.deals.searchDeals(query.q, query.page, query.pageSize);
    return context.json(result);
  });

  app.get('/v1/search', async (context) => {
    const query = searchQuerySchema.parse(context.req.query());
    const pagination = createPaginationMeta({
      page: query.page,
      pageSize: query.pageSize,
      maxPageSize: 100
    });

    const [deals, products, merchants, coupons] = await Promise.all([
      dependencies.deals.searchDeals(query.q, pagination.page, pagination.pageSize),
      dependencies.products.search(query.q),
      dependencies.merchants.search(query.q),
      dependencies.coupons.search(query.q)
    ]);

    return context.json({
      deals,
      products: paginate(products, products.length, pagination),
      merchants: paginate(merchants, merchants.length, pagination),
      coupons: paginate(coupons, coupons.length, pagination)
    });
  });

  app.get('/v1/search/categories', async (context) => {
    const query = z.object({ q: z.string().min(1) }).parse(context.req.query());
    return context.json(await dependencies.categories.search(query.q));
  });

  app.get('/v1/search/merchants', async (context) => {
    const query = z.object({ q: z.string().min(1) }).parse(context.req.query());
    return context.json(await dependencies.merchants.search(query.q));
  });

  app.get('/v1/search/coupons', async (context) => {
    const query = z.object({ q: z.string().min(1) }).parse(context.req.query());
    return context.json(await dependencies.coupons.search(query.q));
  });

  app.get('/v1/search/autocomplete', async (context) => {
    const query = autocompleteQuerySchema.parse(context.req.query());
    const result = await dependencies.deals.autocomplete(query.q, query.limit ?? 8);
    return context.json(result);
  });

  app.get('/v1/merchants', async (context) => context.json(await dependencies.merchants.list()));
  app.get('/v1/merchants/:id', async (context) => {
    const merchant = await dependencies.merchants.getById(context.req.param('id'));
    if (!merchant) throw new AppError('Merchant not found', { statusCode: 404, code: 'MERCHANT_NOT_FOUND' });
    return context.json(merchant);
  });
  app.post('/v1/merchants', async (context) => {
    const payload = merchantSchema.parse(await context.req.json());
    return context.json(await dependencies.merchants.create(payload), 201);
  });
  app.patch('/v1/merchants/:id', async (context) => {
    const payload = merchantSchema.partial().parse(await context.req.json());
    return context.json(await dependencies.merchants.update(context.req.param('id'), payload));
  });
  app.delete('/v1/merchants/:id', async (context) => {
    await dependencies.merchants.remove(context.req.param('id'));
    return context.body(null, 204);
  });

  app.get('/v1/products', async (context) => context.json(await dependencies.products.list()));
  app.get('/v1/products/:id', async (context) => {
    const product = await dependencies.products.getById(context.req.param('id'));
    if (!product) throw new AppError('Product not found', { statusCode: 404, code: 'PRODUCT_NOT_FOUND' });
    return context.json(product);
  });
  app.post('/v1/products', async (context) => {
    const payload = productSchema.parse(await context.req.json());
    return context.json(await dependencies.products.create(payload), 201);
  });
  app.patch('/v1/products/:id', async (context) => {
    const payload = productSchema.partial().parse(await context.req.json());
    return context.json(await dependencies.products.update(context.req.param('id'), payload));
  });
  app.delete('/v1/products/:id', async (context) => {
    await dependencies.products.remove(context.req.param('id'));
    return context.body(null, 204);
  });

  app.get('/v1/coupons', async (context) => context.json(await dependencies.coupons.list()));
  app.get('/v1/categories', async (context) => context.json(await dependencies.categories.list()));
  app.get('/v1/categories/:id', async (context) => {
    const category = await dependencies.categories.getById(context.req.param('id'));
    if (!category) throw new AppError('Category not found', { statusCode: 404, code: 'CATEGORY_NOT_FOUND' });
    return context.json(category);
  });
  app.post('/v1/categories', async (context) => {
    const payload = categorySchema.parse(await context.req.json());
    return context.json(await dependencies.categories.create(payload), 201);
  });
  app.patch('/v1/categories/:id', async (context) => {
    const payload = categorySchema.partial().parse(await context.req.json());
    return context.json(await dependencies.categories.update(context.req.param('id'), payload));
  });
  app.delete('/v1/categories/:id', async (context) => {
    await dependencies.categories.remove(context.req.param('id'));
    return context.body(null, 204);
  });
  app.get('/v1/coupons/:id', async (context) => {
    const coupon = await dependencies.coupons.getById(context.req.param('id'));
    if (!coupon) throw new AppError('Coupon not found', { statusCode: 404, code: 'COUPON_NOT_FOUND' });
    return context.json(coupon);
  });
  app.post('/v1/coupons', async (context) => {
    const payload = couponSchema.parse(await context.req.json());
    return context.json(await dependencies.coupons.create(payload), 201);
  });
  app.patch('/v1/coupons/:id', async (context) => {
    const payload = couponSchema.partial().parse(await context.req.json());
    return context.json(await dependencies.coupons.update(context.req.param('id'), payload));
  });
  app.delete('/v1/coupons/:id', async (context) => {
    await dependencies.coupons.remove(context.req.param('id'));
    return context.body(null, 204);
  });

  app.get('/r/:affiliateLinkId', async (context) => {
    const affiliateLinkId = context.req.param('affiliateLinkId');
    const tracked = await dependencies.affiliate.trackClick(affiliateLinkId, {
      ipAddress: context.req.header('x-forwarded-for'),
      userAgent: context.req.header('user-agent'),
      referrer: context.req.header('referer')
    });
    return context.redirect(tracked.redirectUrl, 302);
  });

  app.post('/v1/commissions', async (context) => {
    const payload: z.infer<typeof commissionSchema> = commissionSchema.parse(await context.req.json());
    const event = await dependencies.affiliate.recordCommission(payload);
    return context.json(event, 201);
  });

  app.onError((error, context) => {
    if (isAppError(error)) {
      const status = error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 500;
      return context.json(
        {
          error: error.code,
          message: error.message,
          details: error.details
        },
        status as 400 | 401 | 403 | 404 | 409 | 422 | 500,
      );
    }

    logger.error({ error }, 'Unexpected API error');
    return context.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.'
      },
      500,
    );
  });

  return app;
};
