import Link from 'next/link';
import { ArrowRight, Store, Ticket } from 'lucide-react';
import { Button, Container, H1, MutedText } from '@dealos/ui';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { EmptyState } from '@/components/empty-state';
import { JsonLd } from '@/components/json-ld';
import { createPageMetadata } from '@/lib/metadata';
import { getCouponsListing } from '@/lib/server/catalog';
import { absoluteUrl } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Coupons',
  description: 'Browse verified active merchant coupons, promo codes, and discount opportunities.',
  path: '/coupons'
});

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default async function CouponsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? '1'));
  const listing = await getCouponsListing(page, 18);

  return (
    <Container className="space-y-10 py-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: listing.items.map((coupon, index) => ({
            '@type': 'Coupon',
            position: index + 1,
            name: coupon.code,
            description: coupon.description ?? 'Merchant coupon',
            url: absoluteUrl(`/coupons?page=${listing.page}`),
            provider: {
              '@type': 'Organization',
              name: coupon.merchant.name
            }
          }))
        }}
      />

      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Coupons' }]} />

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
          <Ticket className="h-4 w-4" />
          Verified Merchant Promo Codes
        </div>
        <H1>Active Coupons & Codes</H1>
        <MutedText className="text-base max-w-2xl">
          Verified active merchant codes ready to copy. Save instantly at checkout across trusted online retailers. ({listing.totalItems} total codes available)
        </MutedText>
      </div>

      {listing.items.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {listing.items.map((coupon) => (
            <div
              key={coupon.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-dashed border-amber-500/40 bg-card p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/merchants/${coupon.merchant.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                  >
                    <Store className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    {coupon.merchant.name}
                  </Link>

                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                    <Ticket className="h-3 w-3" />
                    Verified
                  </span>
                </div>

                {/* Coupon Code Banner */}
                <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">Code</p>
                    <p className="font-mono text-xl font-extrabold text-foreground select-all tracking-wider">{coupon.code}</p>
                  </div>
                </div>

                <MutedText className="text-xs leading-relaxed line-clamp-2">
                  {coupon.description ?? 'Active promotion code provided by merchant.'}
                </MutedText>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-border/40 mt-4">
                {coupon.deal ? (
                  <Link href={`/deals/${coupon.deal.slug}`}>
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs font-semibold">
                      <span>View Related Deal</span>
                      <ArrowRight className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    </Button>
                  </Link>
                ) : (
                  <Link href={`/merchants/${coupon.merchant.slug}`}>
                    <Button variant="outline" size="sm" className="w-full justify-between text-xs font-semibold">
                      <span>Visit Merchant Deals</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No active coupons" message="Active merchant codes will surface here as feeds update." />
      )}

      {/* Pagination Bar */}
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-6 py-4 backdrop-blur-xs">
        <span className="text-xs font-medium text-muted-foreground">
          Showing Page {listing.page} of {listing.totalPages}
        </span>
        <div className="flex items-center gap-2">
          {listing.page > 1 ? (
            <Link href={`/coupons?page=${listing.page - 1}`}>
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Previous
              </Button>
            </Link>
          ) : null}
          {listing.page < listing.totalPages ? (
            <Link href={`/coupons?page=${listing.page + 1}`}>
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
