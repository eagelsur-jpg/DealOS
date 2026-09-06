import Link from 'next/link';
import { Flame } from 'lucide-react';
import { Button, Container, H1, MutedText } from '@dealos/ui';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { DealCard } from '@/components/deal-card';
import { EmptyState } from '@/components/empty-state';
import { createPageMetadata } from '@/lib/metadata';
import { getClearanceListing } from '@/lib/server/catalog';

export const metadata: Metadata = createPageMetadata({
  title: 'Clearance',
  description: 'Deep-discount clearance deals with 25%+ price cuts ranked by savings.',
  path: '/clearance'
});

export const revalidate = 180;
export const dynamic = 'force-dynamic';

export default async function ClearancePage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? '1'));
  const listing = await getClearanceListing(page, 12);

  return (
    <Container className="space-y-10 py-12">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Clearance' }]} />

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-extrabold text-rose-600 dark:text-rose-400">
          <Flame className="h-4 w-4 animate-pulse text-rose-500" />
          High-Discount Clearance Zone
        </div>
        <H1>Clearance & Deep Discounts</H1>
        <MutedText className="text-base max-w-2xl">
          Aggressive price cuts with at least 25% savings vs prior price. Ranked dynamically by discount magnitude and deal authenticity scores. ({listing.totalItems} total clearance items)
        </MutedText>
      </div>

      {listing.items.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {listing.items.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No clearance deals found"
          message="Clearance items with >25% discount will appear here as catalog telemetry updates."
        />
      )}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/60 px-6 py-4 backdrop-blur-xs">
        <span className="text-xs font-medium text-muted-foreground">
          Page {listing.page} of {listing.totalPages}
        </span>
        <div className="flex items-center gap-2">
          {listing.page > 1 ? (
            <Link href={`/clearance?page=${listing.page - 1}`}>
              <Button variant="outline" size="sm" className="text-xs font-semibold">
                Previous
              </Button>
            </Link>
          ) : null}
          {listing.page < listing.totalPages ? (
            <Link href={`/clearance?page=${listing.page + 1}`}>
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
