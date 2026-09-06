import { Loader2 } from 'lucide-react';
import type * as React from 'react';
import { cn } from '../lib/cn.js';

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export const Loading = ({ className, label = 'Loading...', ...props }: LoadingProps) => (
  <div className={cn('flex items-center gap-2 text-sm text-muted-foreground', className)} {...props}>
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>{label}</span>
  </div>
);
