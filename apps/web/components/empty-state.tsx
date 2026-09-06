import Link from 'next/link';
import { SearchX } from 'lucide-react';
import { Button, MutedText } from '@dealos/ui';

export const EmptyState = ({
  title,
  message,
  actionHref = '/deals',
  actionLabel = 'Browse deals'
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) => (
  <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed bg-secondary/60 p-8 text-center">
    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,#14b8a6,#f97316)] text-white shadow-xl shadow-orange-500/20">
      <SearchX className="h-9 w-9" aria-hidden="true" />
    </div>
    <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
    <MutedText className="mt-2 max-w-md leading-6">{message}</MutedText>
    <Link href={actionHref} className="mt-6">
      <Button>{actionLabel}</Button>
    </Link>
  </div>
);
