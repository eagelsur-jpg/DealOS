import { NextResponse } from 'next/server';
import { assertSafeAffiliateDestination } from '@dealos/database';

export async function GET(
  request: Request,
  context: { params: Promise<{ affiliateLinkId: string }> },
) {
  const { affiliateLinkId } = await context.params;
  try {
    const response = await fetch(
      `${process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:3004'}/r/${encodeURIComponent(affiliateLinkId)}`,
      {
        redirect: 'manual',
        cache: 'no-store',
        headers: {
          'user-agent': request.headers.get('user-agent') ?? '',
          referer: request.headers.get('referer') ?? '',
        },
      },
    );
    if (response.status === 302) {
      return NextResponse.redirect(
        assertSafeAffiliateDestination(response.headers.get('location') ?? ''),
        302,
      );
    }
    return NextResponse.json(
      { error: 'Affiliate link unavailable' },
      {
        status: [400, 404, 429].includes(response.status) ? response.status : 503,
        headers: response.headers.has('retry-after')
          ? { 'Retry-After': response.headers.get('retry-after')! }
          : {},
      },
    );
  } catch {
    return NextResponse.json({ error: 'Affiliate service unavailable' }, { status: 503 });
  }
}
