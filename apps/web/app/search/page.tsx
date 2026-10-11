import { prisma } from '@dealos/database';
import { Search } from 'lucide-react';
import { Container, H1, MutedText } from '@dealos/ui';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { JsonLd } from '@/components/json-ld';
import { SearchExperience } from '@/components/search-experience';
import { createPageMetadata } from '@/lib/metadata';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Search',
  description:
    'Search deals, merchants, categories, and coupons with autocomplete and instant filters.',
  path: '/search',
});

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : '';
  const category = typeof params.category === 'string' ? params.category : undefined;
  const merchant = typeof params.merchant === 'string' ? params.merchant : undefined;

  const [categories, merchants] = await Promise.all([
    prisma.category.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.merchant.findMany({
      where: { isActive: true },
      select: { slug: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  return (
    <Container className="space-y-10 py-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SearchResultsPage',
          name: 'DealOS Search',
          url: absoluteUrl(`/search?q=${encodeURIComponent(q)}`),
        }}
      />
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Search' }]} />

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
          <Search className="h-3.5 w-3.5" />
          Real-Time Search Engine
        </div>
        <H1>Search Deal Catalog</H1>
        <MutedText className="text-base max-w-2xl">
          Search products, merchants, categories, and active promo codes with live autocomplete and
          infinite scroll.
        </MutedText>
      </div>

      <SearchExperience
        initialQuery={q}
        initialCategory={category}
        initialMerchant={merchant}
        categories={categories}
        merchants={merchants}
      />
    </Container>
  );
}
