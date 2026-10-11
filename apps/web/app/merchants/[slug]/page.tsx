import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, Info, ShieldCheck, Store, Ticket } from 'lucide-react';
import { Button, Container, H1, MutedText } from '@dealos/ui';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { DealCard } from '@/components/deal-card';
import { JsonLd } from '@/components/json-ld';
import { createPageMetadata } from '@/lib/metadata';
import { getMerchantBySlug } from '@/lib/server/catalog';
import { absoluteUrl, breadcrumbsJsonLd } from '@/lib/seo';

interface MerchantPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: MerchantPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split('-')
    .map((value) => value[0]?.toUpperCase() + value.slice(1))
    .join(' ');

  return createPageMetadata({
    title: `${title} Deals & Coupons`,
    description: `Browse recorded ${title} deals, active promo codes, and pricing history.`,
    path: `/merchants/${slug}`,
  });
}

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default async function MerchantPage({ params, searchParams }: MerchantPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? '1'));
  const data = await getMerchantBySlug(slug, page, 12, { field: 'score', direction: 'desc' });

  if (!data) {
    notFound();
  }

  return (
    <Container className="space-y-12 py-10">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: data.merchant.name,
          url: data.merchant.websiteUrl,
          sameAs: [absoluteUrl(`/merchants/${data.merchant.slug}`)],
        }}
      />
      <JsonLd
        data={breadcrumbsJsonLd([
          { name: 'Home', item: '/' },
          { name: 'Merchants', item: '/merchants' },
          { name: data.merchant.name, item: `/merchants/${data.merchant.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Merchants', href: '/merchants' },
          { label: data.merchant.name },
        ]}
      />

      {/* Merchant Header Hero Card */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-r from-card via-card to-secondary/50 p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-sm border border-amber-500/20">
              <Store className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <H1 className="text-2xl sm:text-3xl">{data.merchant.name}</H1>
                <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  Verified Merchant
                </span>
              </div>
              <MutedText className="text-xs sm:text-sm mt-1">
                {data.deals.totalItems} active deals · {data.coupons.length} coupon codes available
              </MutedText>
            </div>
          </div>

          <a
            href={data.merchant.websiteUrl}
            target="_blank"
            rel="nofollow sponsored noopener"
            className="shrink-0"
          >
            <Button variant="outline" className="gap-2 text-xs font-semibold">
              Visit Merchant Store
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </a>
        </div>

        {/* Affiliate Disclosure Box */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-border/60 bg-background/60 p-4 text-xs text-muted-foreground">
          <Info className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-foreground">Affiliate Disclosure:</strong> DealOS may earn
            qualifying commissions from purchases made via partner links to{' '}
            <span className="font-semibold text-foreground">{data.merchant.name}</span>. All listed
            deals undergo autonomous price validation.
          </p>
        </div>
      </div>

      {/* Merchant Deals Grid */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Live {data.merchant.name} Deals
        </h2>
        {data.deals.items.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.deals.items.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active deals right now for this merchant.
          </p>
        )}
      </section>

      {/* Merchant Coupons Section */}
      {data.coupons.length ? (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="h-5 w-5 text-amber-500" />
            Active {data.merchant.name} Promo Codes
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="rounded-2xl border border-dashed border-amber-500/40 bg-card p-5 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-extrabold text-foreground select-all">
                    {coupon.code}
                  </span>
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    Promo Code
                  </span>
                </div>
                <MutedText className="text-xs">
                  {coupon.description ?? 'Active promotion code'}
                </MutedText>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-6 py-4 backdrop-blur-xs">
        <span className="text-xs font-medium text-muted-foreground">
          Page {data.deals.page} of {data.deals.totalPages}
        </span>
        <div className="flex gap-2">
          {data.deals.page > 1 ? (
            <Link href={`/merchants/${slug}?page=${data.deals.page - 1}`}>
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Previous
              </Button>
            </Link>
          ) : null}
          {data.deals.page < data.deals.totalPages ? (
            <Link href={`/merchants/${slug}?page=${data.deals.page + 1}`}>
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
