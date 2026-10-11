'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuthCookieName, verifySessionToken } from './auth';

export async function saveRecord(form: FormData) {
  const token = (await cookies()).get(getAuthCookieName())?.value;
  if (!token) redirect('/login');
  await verifySessionToken(token);
  const entity = String(form.get('entity'));
  if (!['products', 'deals'].includes(entity)) throw new Error('Invalid entity');
  const id = String(form.get('id') ?? '');
  const payload: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (['entity', 'id'].includes(key)) continue;
    if (key === 'currentPrice' || key === 'previousPrice') {
      if (value !== '') payload[key] = Number(value);
    } else if (value !== '') payload[key] = String(value);
  }
  if (entity === 'products') payload.isActive = form.get('isActive') === 'on';
  const base = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3004';
  let failed = false;
  try {
    const response = await fetch(`${base}/v1/${entity}${id ? `/${encodeURIComponent(id)}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    failed = !response.ok;
  } catch {
    failed = true;
  }
  redirect(`/${entity}?${failed ? 'error=save_failed' : 'saved=1'}`);
}
