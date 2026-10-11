import { NextResponse } from 'next/server';

export const localRedirect = (path: string) =>
  new NextResponse(null, { status: 303, headers: { Location: path } });
export const sameOriginRequest = (request: Request): boolean => {
  const origin = request.headers.get('origin');
  if (!origin) return request.headers.get('sec-fetch-site') !== 'cross-site';
  try {
    const expected = process.env.ADMIN_ORIGIN;
    if (expected) return origin === new URL(expected).origin;
    const url = new URL(origin);
    // Forwarded host is only accepted when explicitly enabled behind a trusted proxy.
    const host =
      process.env.TRUST_PROXY === 'true'
        ? (request.headers.get('x-forwarded-host') ?? request.headers.get('host'))
        : request.headers.get('host');
    return url.host === host && ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

export const middlewareRedirectUrl = (request: Request, path: string): URL => {
  if (process.env.ADMIN_ORIGIN) return new URL(path, process.env.ADMIN_ORIGIN);
  const forwarded = process.env.TRUST_PROXY === 'true';
  const host =
    (forwarded ? request.headers.get('x-forwarded-host') : null) ?? request.headers.get('host');
  const protocol =
    (forwarded ? request.headers.get('x-forwarded-proto') : null) ??
    new URL(request.url).protocol.replace(':', '');
  if (host && /^[a-z0-9.-]+(?::[0-9]+)?$/i.test(host) && ['http', 'https'].includes(protocol)) {
    return new URL(path, `${protocol}://${host}`);
  }
  return new URL(path, request.url);
};
