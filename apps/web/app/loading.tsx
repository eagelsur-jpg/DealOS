import { Container, Skeleton } from '@dealos/ui';
import { ListSkeleton } from '@/components/list-skeletons';

export default function Loading() {
  return (
    <Container className="space-y-8 py-10">
      <Skeleton className="h-4 w-40" />
      <div className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <ListSkeleton />
    </Container>
  );
}
