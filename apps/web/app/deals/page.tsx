import Link from 'next/link';
import { Button, Container, H1, MutedText } from '@dealos/ui';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { DealCard } from '@/components/deal-card';
import { EmptyState } from '@/components/empty-state';
import { JsonLd } from '@/components/json-ld';
import { createPageMetadata } from '@/lib/metadata';
import { getDealsListing } from '@/lib/server/catalog';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Deals',
  description: 'Browse active deals with filtering, sorting, and transparent pricing data.',
  path: '/deals'
});

export const revalidate = 180;
export const dynamic = 'force-dynamic';

interface DealsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const parseSort = (sortField?: string, sortDirection?: string) => {
  if (!sortField || !sortDirection) return undefined;
  if (!['createdAt', 'price', 'savings', 'score'].includes(sortField)) return undefined;
  if (!['asc', 'desc'].includes(sortDirection)) return undefined;
  return {
    field: sortField as 'createdAt' | 'price' | 'savings' | 'score',
    direction: sortDirection as 'asc' | 'desc'
  };
};

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const params = await searchParams;
  const mode = typeof params.mode === 'string' ? params.mode : undefined;
  const page = Math.max(1, Number(params.page ?? '1'));
  const pageSize = Math.min(24, Math.max(1, Number(params.pageSize ?? '12')));
  const query = typeof params.q === 'string' ? params.q : undefined;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const merchant = typeof params.merchant === 'string' ? params.merchant : undefined;
  const hasCoupon = params.hasCoupon === 'true' ? true : undefined;
  const minPrice = typeof params.minPrice === 'string' ? Number(params.minPrice) : undefined;
  const maxPrice = typeof params.maxPrice === 'string' ? Number(params.maxPrice) : undefined;
  const sortField = typeof params.sortField === 'string' ? params.sortField : undefined;
  const sortDirection = typeof params.sortDirection === 'string' ? params.sortDirection : undefined;

  const results = await getDealsListing({
    mode:
      mode === 'featured' || mode === 'trending' || mode === 'newest' || mode === 'hot' || mode === 'expired'
        ? mode
        : undefined,
    query,
    category,
    merchant,
    hasCoupon,
    minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
    page,
    pageSize,
    sort: parseSort(sortField, sortDirection)
  });

  const filterModes = [
    { label: 'All Deals', value: undefined },
    { label: 'Trending 🔥', value: 'trending' },
    { label: 'Featured ⭐', value: 'featured' },
    { label: 'Newest ⚡', value: 'newest' }
  ];

  return (
    <Container className="space-y-10 py-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: results.items.map((deal, index) => ({
            '@type': 'Offer',
            position: index + 1,
            name: deal.title,
            price: deal.currentPrice,
            priceCurrency: 'USD',
            seller: {
              '@type': 'Organization',
              name: deal.merchantName
            },
            url: absoluteUrl(`/deals/${deal.slug}`)
          }))
        }}
      />

      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Deals' }]} />

      {/* Header & Filter Chips */}
      <div className="space-y-6">
        <div className="space-y-2">
          <H1>Explore Live Deals</H1>
          <MutedText className="text-base max-w-2xl">
            Verified active deals with transparent discount math, price drop tracking, and merchant attribution.
          </MutedText>
        </div>

        {/* Floating Filter Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-card/80 p-2 backdrop-blur-md shadow-xs">
          {filterModes.map((chip) => {
            const isActive = mode === chip.value;
            const targetUrl = chip.value ? `/deals?mode=${chip.value}` : '/deals';
            return (
              <Link key={chip.label} href={targetUrl}>
                <span
                  className={`inline-flex items-center rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20 dark:bg-teal-500 dark:text-zinc-950'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {chip.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {results.items.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {results.items.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No deals matched"
          message="Try a broader search, remove a filter, or browse the latest verified deals."
        />
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-6 py-4 backdrop-blur-xs">
        <span className="text-xs font-medium text-muted-foreground">
          Showing Page {results.page} of {results.totalPages} ({results.totalItems} total deals)
        </span>
        <div className="flex items-center gap-2">
          {results.page > 1 ? (
            <Link href={`/deals?page=${results.page - 1}${mode ? `&mode=${mode}` : ''}`}>
              <Button variant="outline" size="sm" className="text-xs">
                Previous
              </Button>
            </Link>
          ) : null}
          {results.page < results.totalPages ? (
            <Link href={`/deals?page=${results.page + 1}${mode ? `&mode=${mode}` : ''}`}>
              <Button variant="brand" size="sm" className="text-xs">
                Next
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
