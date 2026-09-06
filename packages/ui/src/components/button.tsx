'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../lib/cn.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md hover:shadow-primary/10',
        brand:
          'bg-teal-600 text-white shadow-md shadow-teal-600/25 hover:bg-teal-500 hover:shadow-lg hover:shadow-teal-500/30 active:bg-teal-700 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400 dark:hover:shadow-teal-400/30',
        gradient:
          'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-600/20 hover:from-teal-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-teal-500/30 dark:from-teal-500 dark:to-cyan-400 dark:text-zinc-950',
        secondary:
          'bg-secondary text-secondary-foreground shadow-2xs hover:bg-secondary/80 hover:text-foreground',
        outline:
          'border border-border/80 bg-background/60 backdrop-blur-xs text-foreground shadow-2xs hover:bg-accent hover:border-border/100 hover:text-foreground',
        ghost:
          'text-muted-foreground hover:bg-accent/80 hover:text-foreground',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs font-semibold',
        lg: 'h-12 rounded-xl px-6 text-base font-bold',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);

Button.displayName = 'Button';

