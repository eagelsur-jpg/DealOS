'use client';

import { Menu, ShoppingBag, Sparkles, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/cn.js';
import { Container } from './container.js';

export interface NavItem {
  href: string;
  label: string;
}

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  brand: string;
  items: NavItem[];
  rightSlot?: React.ReactNode;
}

export const Navbar = ({ brand, items, rightSlot, className, ...props }: NavbarProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 shadow-xs backdrop-blur-xl transition-all duration-200',
        className,
      )}
      {...props}
    >
      <Container className="flex h-16 items-center justify-between">
        <a href="/" className="group flex items-center gap-2.5 text-base font-bold tracking-tight">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-teal-500/35 dark:from-teal-500 dark:to-cyan-400 dark:text-zinc-950">
            <ShoppingBag className="h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-6" aria-hidden="true" />
            <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-300 opacity-90 animate-pulse" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-foreground transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-400">
            {brand}
          </span>
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-xl px-3.5 py-1.5 text-sm font-semibold text-muted-foreground transition-all duration-200 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 active:scale-95"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          {rightSlot}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/60 text-foreground transition-all hover:bg-accent hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </Container>
      {open ? (
        <Container className="pb-4 md:hidden">
          <nav className="grid gap-1 rounded-2xl border border-border/80 bg-card/95 p-3 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </Container>
      ) : null}
    </header>
  );
};

