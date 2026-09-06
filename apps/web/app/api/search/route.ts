import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSearchDeals } from '@/lib/server/catalog';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(24).default(12),
  sortField: z.enum(['createdAt', 'price', 'savings', 'score']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  category: z.string().optional(),
  merchant: z.string().optional()
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.parse({
    q: searchParams.get('q'),
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    sortField: searchParams.get('sortField') ?? undefined,
    sortDirection: searchParams.get('sortDirection') ?? undefined,
    category: searchParams.get('category') ?? undefined,
    merchant: searchParams.get('merchant') ?? undefined
  });

  const result = await getSearchDeals({
    query: parsed.q,
    page: parsed.page,
    pageSize: parsed.pageSize,
    sort:
      parsed.sortField && parsed.sortDirection
        ? { field: parsed.sortField, direction: parsed.sortDirection }
        : undefined,
    category: parsed.category,
    merchant: parsed.merchant
  });

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
    }
  });
}
