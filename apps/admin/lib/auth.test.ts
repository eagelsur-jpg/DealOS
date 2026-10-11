import { describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import { createSessionToken, verifySessionToken } from './auth';
import { sameOriginRequest, localRedirect, middlewareRedirectUrl } from './request-security';

const secret = 'isolated-test-secret-with-more-than-32-characters';
process.env.ADMIN_JWT_SECRET = secret;
process.env.ADMIN_EMAIL = 'admin@test.invalid';
process.env.ADMIN_PASSWORD = 'test-only-password';

describe('administrator authentication', () => {
  it('accepts signed administrator sessions', async () => {
    const token = await createSessionToken({
      sub: 'admin',
      email: 'admin@test.invalid',
      role: 'ADMIN',
    });
    expect((await verifySessionToken(token)).role).toBe('ADMIN');
  });
  it('rejects member tokens even when signed by the same key', async () => {
    const token = await new SignJWT({ role: 'MEMBER' })
      .setSubject('member')
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(secret));
    await expect(verifySessionToken(token)).rejects.toThrow();
  });
  it('rejects cross-origin credential submissions', () => {
    expect(
      sameOriginRequest(
        new Request('http://admin.test/api/auth/login', {
          headers: { host: 'admin.test', origin: 'https://attacker.test' },
        }),
      ),
    ).toBe(false);
    expect(
      sameOriginRequest(
        new Request('http://admin.test/api/auth/login', {
          headers: { host: 'admin.test', origin: 'http://admin.test' },
        }),
      ),
    ).toBe(true);
  });
  it('uses relative redirects instead of forwarded host values', () => {
    expect(localRedirect('/login').headers.get('location')).toBe('/login');
    expect(localRedirect('/login').status).toBe(303);
  });
  it('preserves the real request host for middleware redirects', () => {
    const request = new Request('http://localhost:3003/private', {
      headers: { host: '157.173.124.25:3003', 'x-forwarded-host': 'attacker.test' },
    });
    expect(middlewareRedirectUrl(request, '/login').href).toBe('http://157.173.124.25:3003/login');
  });
});
