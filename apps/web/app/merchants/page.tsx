import Link from 'next/link';
import { ArrowRight, ShieldCheck, Store, Ticket } from 'lucide-react';
import { Container, H1, MutedText } from '@dealos/ui';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { EmptyState } from '@/components/empty-state';
import { createPageMetadata } from '@/lib/metadata';
import { getMerchantsPageData } from '@/lib/server/catalog';

export const metadata: Metadata = createPageMetadata({
  title: 'Merchants',
  description: 'Browse catalog merchants with active deal and coupon inventory.',
  path: '/merchants',
});

export const revalidate = 900;
export const dynamic = 'force-dynamic';

export default async function MerchantsPage() {
  const merchants = await getMerchantsPageData();

  return (
    <Container className="space-y-10 py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Merchants' }]} />

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
          <Store className="h-4 w-4" />
          Verified Merchant Network
        </div>
        <H1>Trusted Merchants</H1>
        <MutedText className="text-base max-w-2xl">
          Compare merchant reputation, live deal counts, coupon availability, and affiliate
          transparency standards across top retailers.
        </MutedText>
      </div>

      {merchants.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {merchants.map((merchant) => (
            <Link
              key={merchant.id}
              href={`/merchants/${merchant.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-6 shadow-2xs transition-all duration-300 hover:-translate-y-1.5 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10"
            >
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 transition-transform duration-300 group-hover:scale-110">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      {merchant.name}
                    </h2>
                    <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 font-semibold">
                      {merchant._count.deals} Live Deals
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 font-bold text-amber-700 dark:text-amber-300">
                      <Ticket className="h-3 w-3" />
                      {merchant._count.coupons} Coupons
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/40 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>View Merchant Storefront</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No merchants found"
          message="Trusted merchant profiles will appear as catalog telemetry updates."
        />
      )}
    </Container>
  );
}
