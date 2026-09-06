import * as React from 'react';
import { cn } from '../lib/cn.js';

export const H1 = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h1 className={cn('scroll-m-20 text-4xl font-extrabold tracking-tighter sm:text-5xl lg:text-6xl text-foreground', className)} {...props} />
);

export const H2 = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2 className={cn('scroll-m-20 text-2xl font-bold tracking-tight sm:text-3xl text-foreground', className)} {...props} />
);

export const H3 = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('scroll-m-20 text-xl font-semibold tracking-tight text-foreground', className)} {...props} />
);

export const Text = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('leading-relaxed text-foreground/90 [&:not(:first-child)]:mt-3', className)} {...props} />
);

export const MutedText = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-muted-foreground leading-relaxed', className)} {...props} />
);
