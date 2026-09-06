import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSessionToken, setAuthCookie } from '@/lib/auth';
import { getAdminEnv } from '@/lib/env';

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
    return NextResponse.redirect(new URL('/login?error=invalid_credentials', request.url), {
      status: 302
    });
  }

  const token = await createSessionToken({
    sub: email,
    email
  });

  await setAuthCookie(token);
  return NextResponse.redirect(new URL('/', request.url), {
    status: 302
  });
}
