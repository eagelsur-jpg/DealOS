import { describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
import { createApp } from './app.js';
import type { ApiDependencies } from './dependencies.js';

const createDependenciesMock = (): ApiDependencies => ({
  deals: {
    listDeals: vi.fn().mockResolvedValue({
      items: [{ id: 'd1', title: 'Test Deal' }],
      page: 1,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1
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
      totalPages: 1
    }),
    autocomplete: vi.fn().mockResolvedValue([{ label: 'Sony XM5', value: 'sony-xm5', type: 'deal' }])
  },
  merchants: {
    list: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({ id: 'm1' }),
    create: vi.fn().mockResolvedValue({ id: 'm1' }),
    update: vi.fn().mockResolvedValue({ id: 'm1' }),
    remove: vi.fn().mockResolvedValue(undefined)
  },
  products: {
    list: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({ id: 'p1' }),
    create: vi.fn().mockResolvedValue({ id: 'p1' }),
    update: vi.fn().mockResolvedValue({ id: 'p1' }),
    remove: vi.fn().mockResolvedValue(undefined)
  },
  coupons: {
    list: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({ id: 'c1' }),
    create: vi.fn().mockResolvedValue({ id: 'c1' }),
    update: vi.fn().mockResolvedValue({ id: 'c1' }),
    remove: vi.fn().mockResolvedValue(undefined)
  },
  categories: {
    list: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({ id: 'cat1' }),
    create: vi.fn().mockResolvedValue({ id: 'cat1' }),
    update: vi.fn().mockResolvedValue({ id: 'cat1' }),
    remove: vi.fn().mockResolvedValue(undefined)
  },
  affiliate: {
    trackClick: vi.fn().mockResolvedValue({ clickId: 'cl1', redirectUrl: 'https://example.com?tag=x' }),
    recordCommission: vi.fn().mockResolvedValue({ id: 'cm1' })
  },
  cache: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined)
  }
} as unknown as ApiDependencies);

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
      body: JSON.stringify({})
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
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        slug: 'test-deal',
        title: 'Test Deal',
        productId: 'product-1',
        merchantId: 'merchant-1',
        currentPrice: 10
      })
    });

    expect(response.status).toBe(201);
    expect(dependencies.deals.createDeal).toHaveBeenCalledOnce();
  });

  it('rejects unsafe affiliate redirect destinations', async () => {
    const dependencies = createDependenciesMock();
    vi.mocked(dependencies.affiliate.trackClick).mockResolvedValue({
      clickId: 'cl1',
      redirectUrl: 'javascript:alert(1)'
    });
    const app = createApp(dependencies);

    const response = await app.request('/r/link-1');

    expect(response.status).toBe(400);
  });

  it('rate limits public redirect requests', async () => {
    const app = createApp(createDependenciesMock(), { publicRateLimit: { limit: 1, windowMs: 60_000 } });

    expect((await app.request('/r/link-1')).status).toBe(302);
    expect((await app.request('/r/link-1')).status).toBe(429);
  });

  it('does not accept anonymous commission ingestion', async () => {
    const dependencies = createDependenciesMock();
    const app = createApp(dependencies);
    const response = await app.request('/v1/commissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ affiliateLinkId: 'link-1', amount: 10 })
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
});
