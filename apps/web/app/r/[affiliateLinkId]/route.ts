import { NextResponse } from 'next/server';
import { AffiliateEngine, prisma } from '@dealos/database';

const affiliate = new AffiliateEngine(prisma);

export async function GET(
  request: Request,
  context: {
    params: Promise<{ affiliateLinkId: string }>;
  },
) {
  const { affiliateLinkId } = await context.params;
  const userAgent = request.headers.get('user-agent') ?? undefined;
  const referrer = request.headers.get('referer') ?? undefined;
  const tracked = await affiliate.trackClick(affiliateLinkId, {
    // Forwarded IP headers are untrusted without an explicit proxy policy.
    userAgent,
    referrer
  });

  return NextResponse.redirect(tracked.redirectUrl, 302);
}
