import { Skeleton } from '@dealos/ui';

export const DealCardSkeleton = () => (
  <div className="h-full overflow-hidden rounded-2xl border bg-card shadow-sm">
    <Skeleton className="aspect-[4/3] rounded-none" />
    <div className="space-y-4 p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-end justify-between pt-3">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  </div>
);

export const CouponCardSkeleton = () => (
  <div className="rounded-2xl border bg-card p-5 shadow-sm">
    <Skeleton className="h-5 w-28" />
    <Skeleton className="mt-4 h-4 w-36" />
    <Skeleton className="mt-6 h-16 w-full" />
  </div>
);

export const ListSkeleton = ({ count = 8, variant = 'deals' }: { count?: number; variant?: 'deals' | 'coupons' }) => (
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, index) =>
      variant === 'deals' ? <DealCardSkeleton key={index} /> : <CouponCardSkeleton key={index} />,
    )}
  </div>
);
