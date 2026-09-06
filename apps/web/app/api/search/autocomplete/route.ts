import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAutocomplete } from '@/lib/server/catalog';

export const dynamic = 'force-dynamic';

const schema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(20).default(8)
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = schema.parse({
    q: searchParams.get('q'),
    limit: searchParams.get('limit') ?? undefined
  });

  const result = await getAutocomplete(parsed.q, parsed.limit);
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 's-maxage=30, stale-while-revalidate=60'
    }
  });
}
