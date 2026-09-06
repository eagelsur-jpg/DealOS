import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, Tag, Ticket } from 'lucide-react';
import { Button, Container, H1, MutedText } from '@dealos/ui';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { DealCard } from '@/components/deal-card';
import { JsonLd } from '@/components/json-ld';
import { createPageMetadata } from '@/lib/metadata';
import { getCategoryBySlug } from '@/lib/server/catalog';
import { breadcrumbsJsonLd } from '@/lib/seo';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split('-')
    .map((value) => value[0]?.toUpperCase() + value.slice(1))
    .join(' ');

  return createPageMetadata({
    title: `${title} Deals & Prices`,
    description: `Browse ${title} deals, verified merchant discounts, and price drop trends.`,
    path: `/categories/${slug}`
  });
}

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? '1'));
  const minPrice = typeof query.minPrice === 'string' ? Number(query.minPrice) : undefined;
  const maxPrice = typeof query.maxPrice === 'string' ? Number(query.maxPrice) : undefined;
  const hasCoupon = query.hasCoupon === 'true';
  const sortField = typeof query.sortField === 'string' ? query.sortField : 'score';
  const sortDirection = typeof query.sortDirection === 'string' ? query.sortDirection : 'desc';

  const data = await getCategoryBySlug(
    slug,
    page,
    12,
    {
      field: ['createdAt', 'price', 'savings', 'score'].includes(sortField)
        ? (sortField as 'createdAt' | 'price' | 'savings' | 'score')
        : 'score',
      direction: sortDirection === 'asc' ? 'asc' : 'desc'
    },
    Number.isFinite(minPrice) ? minPrice : undefined,
    Number.isFinite(maxPrice) ? maxPrice : undefined,
    hasCoupon
  );

  const baseQuery = new URLSearchParams();
  if (typeof query.minPrice === 'string') baseQuery.set('minPrice', query.minPrice);
  if (typeof query.maxPrice === 'string') baseQuery.set('maxPrice', query.maxPrice);
  if (hasCoupon) baseQuery.set('hasCoupon', 'true');

  if (!data) {
    notFound();
  }

  return (
    <Container className="space-y-10 py-12">
      <JsonLd
        data={breadcrumbsJsonLd([
          { name: 'Home', item: '/' },
          { name: 'Categories', item: '/categories' },
          { name: data.category.name, item: `/categories/${data.category.slug}` }
        ])}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Categories', href: '/categories' },
          { label: data.category.name }
        ]}
      />

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300">
          <Tag className="h-3.5 w-3.5" />
          Category Feed
        </div>
        <H1>{data.category.name} Deals</H1>
        <MutedText className="text-base max-w-2xl">
          {data.deals.totalItems} active deals found in {data.category.name}. Compare prices, coupons, and seller reputation.
        </MutedText>
      </div>

      {/* Filter Control Toolbar */}
      <form method="get" className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mr-2">
          <SlidersHorizontal className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          Filter:
        </div>

        <input
          name="minPrice"
          type="number"
          step="0.01"
          placeholder="Min $"
          defaultValue={typeof query.minPrice === 'string' ? query.minPrice : ''}
          className="h-9 w-28 rounded-xl border border-border/80 bg-background px-3 text-xs outline-none placeholder:text-muted-foreground focus:border-teal-500/60"
        />

        <input
          name="maxPrice"
          type="number"
          step="0.01"
          placeholder="Max $"
          defaultValue={typeof query.maxPrice === 'string' ? query.maxPrice : ''}
          className="h-9 w-28 rounded-xl border border-border/80 bg-background px-3 text-xs outline-none placeholder:text-muted-foreground focus:border-teal-500/60"
        />

        <label className="flex items-center gap-2 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-semibold select-none cursor-pointer hover:bg-secondary">
          <input type="checkbox" name="hasCoupon" value="true" defaultChecked={hasCoupon} className="rounded accent-teal-600" />
          <Ticket className="h-3.5 w-3.5 text-amber-500" />
          Has Coupon
        </label>

        <Button type="submit" variant="brand" size="sm" className="h-9 px-4 text-xs font-bold">
          Apply Filters
        </Button>
      </form>

      {data.deals.items.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.deals.items.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <p className="text-lg font-bold text-foreground">No deals matching filter criteria</p>
          <MutedText className="text-xs max-w-sm mx-auto">Try resetting price constraints or coupon toggles to see all deals in this category.</MutedText>
          <Link href={`/categories/${slug}`} className="inline-block pt-2">
            <Button variant="outline" size="sm" className="text-xs">Reset Filters</Button>
          </Link>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-6 py-4 backdrop-blur-xs">
        <span className="text-xs font-medium text-muted-foreground">
          Page {data.deals.page} of {data.deals.totalPages}
        </span>
        <div className="flex items-center gap-2">
          {data.deals.page > 1 ? (
            <Link
              href={`/categories/${slug}?${new URLSearchParams({ ...Object.fromEntries(baseQuery.entries()), page: String(data.deals.page - 1) }).toString()}`}
            >
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Previous
              </Button>
            </Link>
          ) : null}
          {data.deals.page < data.deals.totalPages ? (
            <Link
              href={`/categories/${slug}?${new URLSearchParams({ ...Object.fromEntries(baseQuery.entries()), page: String(data.deals.page + 1) }).toString()}`}
            >
              <Button variant="brand" size="sm" className="text-xs font-semibold">
                Next
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
