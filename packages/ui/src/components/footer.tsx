'use client';

import { CheckCircle2, Facebook, Github, Instagram, Linkedin, Mail, ShoppingBag, Sparkles } from 'lucide-react';
import * as React from 'react';
import { cn } from '../lib/cn.js';
import { Container } from './container.js';

export interface FooterLink {
  href: string;
  label: string;
}

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  links: FooterLink[];
  copyright: string;
}

export const Footer = ({ links, copyright, className, ...props }: FooterProps) => {
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const subscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, source: 'footer' })
      });

      if (!response.ok) {
        setMessage('Subscription failed. Please try again.');
        setLoading(false);
        return;
      }

      setEmail('');
      setMessage('Verification email sent! Check your inbox.');
    } catch {
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className={cn('border-t border-border/80 bg-card/60 backdrop-blur-md py-16', className)} {...props}>
      <Container className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_1fr]">
        <div className="space-y-4">
          <a href="/" className="group inline-flex items-center gap-2 text-xl font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/20 transition-transform group-hover:scale-105 dark:from-teal-500 dark:to-cyan-400 dark:text-zinc-950">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <span className="text-foreground transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-400">
              DealOS
            </span>
          </a>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Verified deals, coupon intelligence, and merchant transparency for smarter shopping decisions.
          </p>
          <div className="flex gap-2.5 pt-2">
            {[
              { href: 'https://www.facebook.com/', label: 'Facebook', icon: Facebook },
              { href: 'https://www.instagram.com/', label: 'Instagram', icon: Instagram },
              { href: 'https://www.linkedin.com/', label: 'LinkedIn', icon: Linkedin },
              { href: 'https://github.com/', label: 'GitHub', icon: Github }
            ].map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/80 bg-background/80 text-muted-foreground transition-all duration-200 hover:border-teal-500/50 hover:bg-teal-500/10 hover:text-teal-600 dark:hover:text-teal-400 active:scale-95"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Navigation</p>
          <nav className="grid gap-2.5">
            {[
              { href: '/deals', label: 'All Deals' },
              { href: '/coupons', label: 'Coupons & Promo Codes' },
              { href: '/clearance', label: 'Clearance Sales' },
              { href: '/categories', label: 'Explore Categories' },
              { href: '/merchants', label: 'Trusted Merchants' },
              ...links
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">Stay Informed</p>
            <p className="text-sm font-semibold text-foreground">Deal intelligence digest</p>
          </div>
          <form onSubmit={subscribe} className="space-y-2">
            <div className="flex max-w-md overflow-hidden rounded-xl border border-border/80 bg-background/90 shadow-sm focus-within:border-teal-500/60 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
              <label className="sr-only" htmlFor="footer-newsletter">
                Email address
              </label>
              <input
                id="footer-newsletter"
                type="email"
                placeholder="Enter your email..."
                value={email}
                required
                onChange={(event) => setEmail(event.target.value)}
                className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 bg-teal-600 px-4 text-xs font-bold text-white transition-all hover:bg-teal-500 disabled:opacity-60 dark:bg-teal-500 dark:text-zinc-950 dark:hover:bg-teal-400"
              >
                {loading ? (
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                {loading ? 'Joining' : 'Join'}
              </button>
            </div>
            {message ? (
              <p className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {message}
              </p>
            ) : null}
          </form>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Affiliate Disclosure: DealOS receives commissions for qualifying purchases made through links on our site at no extra cost to you.
          </p>
          <p className="text-xs font-medium text-muted-foreground/80">{copyright}</p>
        </div>
      </Container>
    </footer>
  );
};

