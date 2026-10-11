import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { getAdminEnv } from './env';

const AUTH_COOKIE = 'dealos-admin-session';
const encoder = new TextEncoder();

export interface AdminSessionPayload extends JWTPayload {
  sub: string;
  email: string;
  role: 'ADMIN';
}

export const createSessionToken = async (payload: AdminSessionPayload): Promise<string> =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(encoder.encode(getAdminEnv().ADMIN_JWT_SECRET));

export const verifySessionToken = async (token: string): Promise<AdminSessionPayload> => {
  const result = await jwtVerify(token, encoder.encode(getAdminEnv().ADMIN_JWT_SECRET), {
    algorithms: ['HS256'],
  });
  if (result.payload.role !== 'ADMIN' || !result.payload.sub || !result.payload.exp)
    throw new Error('Invalid admin session');
  return result.payload as unknown as AdminSessionPayload;
};

export const setAuthCookie = async (token: string) => {
  const adminEnv = getAdminEnv();
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: adminEnv.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
};

export const clearAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
};

export const getAuthCookieName = () => AUTH_COOKIE;
