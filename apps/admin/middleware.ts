import { middlewareRedirectUrl } from '@/lib/request-security';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthCookieName, verifySessionToken } from '@/lib/auth';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (isPublic) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getAuthCookieName())?.value;
  if (!token) {
    return NextResponse.redirect(middlewareRedirectUrl(request, '/login'));
  }

  try {
    await verifySessionToken(token);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(middlewareRedirectUrl(request, '/login'));
    response.cookies.delete(getAuthCookieName());
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
