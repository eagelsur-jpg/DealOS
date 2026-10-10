import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSessionToken, setAuthCookie } from '@/lib/auth';
import { getAdminEnv } from '@/lib/env';


const externalUrl = (request: Request, path: string) => {
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host');

  const proto =
    request.headers.get('x-forwarded-proto') ??
    'http';

  if (!host) {
    return new URL(path, request.url);
  }

  return new URL(path, `${proto}://${host}`);
};

const safeCompare = (left: string, right: string): boolean => {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
};

export async function POST(request: Request) {
  const adminEnv = getAdminEnv();
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  const validEmail = safeCompare(email, adminEnv.ADMIN_EMAIL);
  const validPassword = safeCompare(password, adminEnv.ADMIN_PASSWORD);

  if (!validEmail || !validPassword) {
    return NextResponse.redirect(
      externalUrl(request, '/login?error=invalid_credentials'),
      302
    );
  }

  const token = await createSessionToken({
    sub: email,
    email,
    role: 'ADMIN'
  });

  await setAuthCookie(token);
  return NextResponse.redirect(
    externalUrl(request, '/'),
    302
  );
}
