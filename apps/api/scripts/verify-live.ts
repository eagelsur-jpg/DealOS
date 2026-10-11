import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { resolve } from 'node:path';
for (const path of ['../../.env.local', '../../.env', '../admin/.env.local', '../admin/.env'])
  config({ path: resolve(path), override: false });

const api = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3004';
const admin = process.env.ADMIN_INTERNAL_URL ?? 'http://127.0.0.1:3003';
const web = process.env.WEB_INTERNAL_URL ?? 'http://127.0.0.1:3002';
const assert = (ok: boolean, message: string) => {
  if (!ok) throw new Error(message);
};
const check = async (path: string, status = 200) => {
  const response = await fetch(`${api}${path}`);
  assert(response.status === status, `${path}: expected ${status}, received ${response.status}`);
  console.log(`PASS ${path} ${status}`);
  return response;
};
for (const path of [
  '/health',
  '/ready',
  '/docs',
  '/openapi.json',
  '/v1/deals',
  '/v1/merchants',
  '/v1/products',
  '/v1/coupons',
  '/v1/categories',
  '/v1/search?q=sony',
  '/v1/search/categories?q=electronics',
  '/v1/search/merchants?q=amazon',
  '/v1/search/coupons?q=save',
  '/v1/search/autocomplete?q=sony',
])
  await check(path);
await check('/v1/search?q=', 400);
await check('/v1/deals/missing-runtime-verification-id', 404);
for (const path of [
  '/',
  '/deals',
  '/coupons',
  '/clearance',
  '/categories',
  '/merchants',
  '/search?q=sony',
]) {
  const response = await fetch(`${web}${path}`);
  assert(response.ok, `Web ${path}: ${response.status}`);
  console.log(`PASS Web ${path}`);
}
const unauthorized = await fetch(`${api}/v1/products`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
});
assert(unauthorized.status === 401, 'API must reject anonymous mutation');
assert(
  Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD),
  'Admin credentials must be configured in existing environment files',
);
const login = await fetch(`${admin}/api/auth/login`, {
  method: 'POST',
  redirect: 'manual',
  headers: { Origin: process.env.ADMIN_ORIGIN ?? admin },
  body: new URLSearchParams({
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
  }),
});
assert(login.status === 303, `Admin login failed (${login.status})`);
const cookie = login.headers.get('set-cookie')?.split(';')[0];
assert(Boolean(cookie?.startsWith('dealos-admin-session=')), 'Session cookie missing');
const token = cookie!.slice('dealos-admin-session='.length);
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
for (const path of ['/', '/products', '/deals', '/analytics']) {
  const response = await fetch(`${admin}${path}`, {
    redirect: 'manual',
    headers: { Cookie: cookie! },
  });
  assert(response.status === 200, `Admin ${path}: ${response.status}`);
  console.log(`PASS Admin ${path}`);
}
if (process.env.VERIFY_CRUD === 'true') {
  let productId: string | undefined;
  let dealId: string | undefined;
  try {
    const suffix = randomUUID();
    const response = await fetch(`${api}/v1/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Runtime verification (inactive)',
        slug: `runtime-verification-${suffix}`,
        isActive: false,
      }),
    });
    assert(response.status === 201, 'Product create failed');
    productId = (await response.json()).id;
    const merchants = await (await check('/v1/merchants')).json();
    assert(merchants.length > 0, 'CRUD deal test requires an existing merchant');
    const deal = await fetch(`${api}/v1/deals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Runtime verification (draft)',
        slug: `runtime-verification-deal-${suffix}`,
        productId,
        merchantId: merchants[0].id,
        currentPrice: 1,
        currency: 'USD',
        status: 'DRAFT',
      }),
    });
    assert(deal.status === 201, 'Deal create failed');
    dealId = (await deal.json()).id;
    const update = await fetch(`${api}/v1/deals/${dealId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title: 'Runtime verification updated (draft)' }),
    });
    assert(update.ok, 'Deal update failed');
    console.log('PASS CRUD: created inactive product and draft deal, updated own draft');
  } finally {
    for (const [entity, id] of [
      ['deals', dealId],
      ['products', productId],
    ])
      if (id) {
        const response = await fetch(`${api}/v1/${entity}/${id}`, { method: 'DELETE', headers });
        assert(response.status === 204, `Archive verification ${entity} failed`);
      }
    console.log(
      'Own verification records archived and preserved; no existing catalog records modified',
    );
  }
} else
  console.log(
    'SKIP CRUD: set VERIFY_CRUD=true to create and archive isolated verification records',
  );
if (process.env.VERIFY_AFFILIATE_LINK_ID) {
  const response = await fetch(
    `${api}/r/${encodeURIComponent(process.env.VERIFY_AFFILIATE_LINK_ID)}`,
    { redirect: 'manual', headers: { 'User-Agent': 'DealOS-runtime-verification' } },
  );
  assert(
    response.status === 302 && Boolean(response.headers.get('location')?.startsWith('https://')),
    'Affiliate redirect failed',
  );
  console.log('PASS affiliate redirect: one recorded verification click, destination not visited');
} else console.log('SKIP affiliate: set VERIFY_AFFILIATE_LINK_ID to a reviewed active real link');
const logout = await fetch(`${admin}/api/auth/logout`, {
  method: 'POST',
  redirect: 'manual',
  headers: { Cookie: cookie!, Origin: process.env.ADMIN_ORIGIN ?? admin },
});
assert(
  logout.status === 303 &&
    Boolean(
      logout.headers.get('set-cookie')?.includes('1970') ||
      logout.headers.get('set-cookie')?.includes('Max-Age=0'),
    ),
  'Logout did not clear session',
);
console.log('PASS logout; no commission events or payments created');
