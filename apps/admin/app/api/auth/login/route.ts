import { localRedirect, sameOriginRequest } from '@/lib/request-security';
import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSessionToken, setAuthCookie } from '@/lib/auth';
import { getAdminEnv } from '@/lib/env';

let attempts = 0;
let resetAt = 0;

const safeCompare = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
};

export async function POST(request: Request) {
  if (!sameOriginRequest(request))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const now = Date.now();
  if (now >= resetAt) {
    attempts = 0;
    resetAt = now + 60000;
  }
  if (++attempts > 20)
    return NextResponse.json(
      { error: 'Too many sign-in attempts' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > 8192) return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  const adminEnv = getAdminEnv();
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const validEmail = safeCompare(email, adminEnv.ADMIN_EMAIL);
  const validPassword = safeCompare(password, adminEnv.ADMIN_PASSWORD);

  if (!validEmail || !validPassword) {
    return localRedirect('/login?error=invalid_credentials');
  }

  const token = await createSessionToken({
    sub: email,
    email,
    role: 'ADMIN',
  });

  await setAuthCookie(token);
  return localRedirect('/');
}
