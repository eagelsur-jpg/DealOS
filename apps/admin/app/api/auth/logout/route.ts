import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';
import { localRedirect, sameOriginRequest } from '@/lib/request-security';
export async function POST(request: Request) {
  if (!sameOriginRequest(request))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await clearAuthCookie();
  return localRedirect('/login');
}
