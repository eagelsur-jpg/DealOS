import { describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
import { createApp } from './app.js';
import type { ApiDependencies } from './dependencies.js';

const createDependenciesMock = (): ApiDependencies =>
  ({
    deals: {
      listDeals: vi.fn().mockResolvedValue({
        items: [{ id: 'd1', title: 'Test Deal' }],
        page: 1,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
      }),
      getDeal: vi.fn().mockResolvedValue({ id: 'd1', title: 'Test Deal' }),
      createDeal: vi.fn().mockResolvedValue({ id: 'd2' }),
      updateDeal: vi.fn().mockResolvedValue({ id: 'd1', title: 'Updated' }),
      deleteDeal: vi.fn().mockResolvedValue(undefined),
      searchDeals: vi.fn().mockResolvedValue({
        items: [{ id: 'd1', title: 'Search Deal' }],
        page: 1,
        pageSize: 10,
        totalItems: 1,
        totalPages: 1,
      }),
      autocomplete: vi
        .fn()
        .mockResolvedValue([{ label: 'Sony XM5', value: 'sony-xm5', type: 'deal' }]),
    },
    merchants: {
      search: vi.fn().mockResolvedValue([]),
      list: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue({ id: 'm1' }),
      create: vi.fn().mockResolvedValue({ id: 'm1' }),
      update: vi.fn().mockResolvedValue({ id: 'm1' }),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    products: {
      search: vi.fn().mockResolvedValue([]),
      list: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue({ id: 'p1' }),
      create: vi.fn().mockResolvedValue({ id: 'p1' }),
      update: vi.fn().mockResolvedValue({ id: 'p1' }),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    coupons: {
      search: vi.fn().mockResolvedValue([]),
      list: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue({ id: 'c1' }),
      create: vi.fn().mockResolvedValue({ id: 'c1' }),
      update: vi.fn().mockResolvedValue({ id: 'c1' }),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    categories: {
      search: vi.fn().mockResolvedValue([]),
      list: vi.fn().mockResolvedValue([]),
      getById: vi.fn().mockResolvedValue({ id: 'cat1' }),
      create: vi.fn().mockResolvedValue({ id: 'cat1' }),
      update: vi.fn().mockResolvedValue({ id: 'cat1' }),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    affiliate: {
      trackClick: vi
        .fn()
        .mockResolvedValue({ clickId: 'cl1', redirectUrl: 'https://merchant.test?tag=x' }),
      recordCommission: vi.fn().mockResolvedValue({ id: 'cm1' }),
    },
    cache: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    },
  }) as unknown as ApiDependencies;

describe('api', () => {
  const adminSecret = 'test-admin-secret-that-is-longer-than-32-characters';
  const createAdminToken = () =>
    new SignJWT({ email: 'admin@dealos.ai', role: 'ADMIN' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('admin@dealos.ai')
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(adminSecret));

  it('returns health status', async () => {
    const app = createApp(createDependenciesMock());
    const response = await app.request('/health');
    expect(response.status).toBe(200);
  });

  it('lists deals', async () => {
    const app = createApp(createDependenciesMock());
    const response = await app.request('/v1/deals');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(1);
  });

  it('rejects an unauthenticated privileged mutation', async () => {
    const app = createApp(createDependenciesMock(), { adminJwtSecret: adminSecret });
    const response = await app.request('/v1/deals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
  });

  it('permits an authorized privileged mutation', async () => {
    const dependencies = createDependenciesMock();
    const app = createApp(dependencies, { adminJwtSecret: adminSecret });
    const response = await app.request('/v1/deals', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${await createAdminToken()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        slug: 'test-deal',
        title: 'Test Deal',
        productId: 'product-1',
        merchantId: 'merchant-1',
        currentPrice: 10,
      }),
    });

    expect(response.status).toBe(201);
    expect(dependencies.deals.createDeal).toHaveBeenCalledOnce();
  });

  it('rejects unsafe affiliate redirect destinations', async () => {
    const dependencies = createDependenciesMock();
    vi.mocked(dependencies.affiliate.trackClick).mockResolvedValue({
      clickId: 'cl1',
      redirectUrl: 'javascript:alert(1)',
    });
    const app = createApp(dependencies);

    const response = await app.request('/r/link-1');

    expect(response.status).toBe(400);
  });

  it('rate limits public redirect requests', async () => {
    const app = createApp(createDependenciesMock(), {
      publicRateLimit: { limit: 1, windowMs: 60_000 },
    });

    expect((await app.request('/r/link-1')).status).toBe(302);
    expect((await app.request('/r/link-1')).status).toBe(429);
  });

  it('does not accept anonymous commission ingestion', async () => {
    const dependencies = createDependenciesMock();
    const app = createApp(dependencies);
    const response = await app.request('/v1/commissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ affiliateLinkId: 'link-1', amount: 10 }),
    });

    expect(response.status).toBe(503);
    expect(dependencies.affiliate.recordCommission).not.toHaveBeenCalled();
  });

  it('generates openapi spec', async () => {
    const app = createApp(createDependenciesMock());
    const response = await app.request('/openapi.json');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.openapi).toBe('3.0.0');
  });
  it('routes deal search before ID lookup', async () => {
    const deps = createDependenciesMock();
    expect((await createApp(deps).request('/v1/deals/search?q=sony')).status).toBe(200);
    expect(deps.deals.searchDeals).toHaveBeenCalledWith('sony', undefined, undefined);
    expect(deps.deals.getDeal).not.toHaveBeenCalled();
  });
  it('parses false coupon filter without treating it as true', async () => {
    const deps = createDependenciesMock();
    await createApp(deps).request('/v1/deals?hasCoupon=false');
    expect(vi.mocked(deps.deals.listDeals).mock.calls[0][0].filters?.hasCoupon).toBe(false);
  });
  it('returns 400 for invalid search query', async () => {
    expect((await createApp(createDependenciesMock()).request('/v1/search?q=')).status).toBe(400);
  });
  it('continues reading the database during cache failure', async () => {
    const deps = createDependenciesMock();
    vi.mocked(deps.cache.get).mockRejectedValue(new Error('offline'));
    vi.mocked(deps.cache.set).mockRejectedValue(new Error('offline'));
    expect((await createApp(deps).request('/v1/deals')).status).toBe(200);
    expect(deps.deals.listDeals).toHaveBeenCalledOnce();
  });
  it('does not expose hidden listings anonymously', async () => {
    expect(
      (await createApp(createDependenciesMock()).request('/v1/deals?mode=hidden')).status,
    ).toBe(401);
  });
  it('paginates non-deal search results before returning them', async () => {
    const deps = createDependenciesMock();
    vi.mocked(deps.products.search).mockResolvedValue([
      { id: 'p1' },
      { id: 'p2' },
      { id: 'p3' },
    ] as never);
    const response = await createApp(deps).request('/v1/search?q=sony&page=2&pageSize=1');
    const result = await response.json();
    expect(result.products.items).toEqual([{ id: 'p2' }]);
    expect(result.products.totalItems).toBe(3);
  });

  it.each([
    '/docs',
    '/v1/deals/d1',
    '/v1/search?q=sony',
    '/v1/search/categories?q=sony',
    '/v1/search/merchants?q=sony',
    '/v1/search/coupons?q=sony',
    '/v1/search/autocomplete?q=sony',
    '/v1/merchants',
    '/v1/merchants/m1',
    '/v1/products',
    '/v1/products/p1',
    '/v1/coupons',
    '/v1/coupons/c1',
    '/v1/categories',
    '/v1/categories/cat1',
  ])('serves %s with injected repositories', async (path) => {
    expect((await createApp(createDependenciesMock()).request(path)).status).toBe(200);
  });
  it.each(['deals', 'products', 'merchants', 'coupons', 'categories'])(
    'protects all %s mutations',
    async (entity) => {
      const app = createApp(createDependenciesMock());
      for (const method of ['POST', 'PATCH', 'DELETE']) {
        const path = `/v1/${entity}${method === 'POST' ? '' : '/id'}`;
        expect((await app.request(path, { method })).status).toBe(401);
      }
    },
  );
  it('returns not found for missing deals', async () => {
    const deps = createDependenciesMock();
    vi.mocked(deps.deals.getDeal).mockResolvedValue(null);
    expect((await createApp(deps).request('/v1/deals/missing')).status).toBe(404);
  });
  it('returns a sanitized database failure', async () => {
    const deps = createDependenciesMock();
    vi.mocked(deps.products.list).mockRejectedValue(new Error('database unavailable'));
    const response = await createApp(deps).request('/v1/products');
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('database unavailable');
  });
  it('archives a deal on DELETE without deleting production data', async () => {
    const deps = createDependenciesMock();
    const response = await createApp(deps, { adminJwtSecret: adminSecret }).request(
      '/v1/deals/d1',
      { method: 'DELETE', headers: { authorization: `Bearer ${await createAdminToken()}` } },
    );
    expect(response.status).toBe(204);
    expect(deps.deals.updateDeal).toHaveBeenCalledWith('d1', { status: 'HIDDEN', isHidden: true });
    expect(deps.deals.deleteDeal).not.toHaveBeenCalled();
  });
});
