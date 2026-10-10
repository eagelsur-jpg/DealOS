import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthCookieName, verifySessionToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

const externalUrl = (request: NextRequest, path: string) => {
  const host =
    request.headers.get('x-forwarded-host') ??
    request.headers.get('host');

  const proto =
    request.headers.get('x-forwarded-proto') ??
    request.nextUrl.protocol.replace(':', '') ??
    'http';

  if (!host) {
    return new URL(path, request.url);
  }

  return new URL(path, `${proto}://${host}`);
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isPublic) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getAuthCookieName())?.value;
  if (!token) {
    return NextResponse.redirect(externalUrl(request, '/login'));
  }

  try {
    await verifySessionToken(token);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(externalUrl(request, '/login'));
    response.cookies.delete(getAuthCookieName());
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
